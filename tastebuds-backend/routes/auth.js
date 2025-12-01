const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const NGO = require("../models/NGO");

const router = express.Router();

function normalizeEmail(e) {
  if (!e || typeof e !== "string") return "";
  return e.trim().toLowerCase();
}

function normalizeUsername(u) {
  if (!u || typeof u !== "string") return "";
  return u.trim();
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email: rawEmail, password, role = "customer", taste } = req.body || {};

    if (!rawEmail || !password) {
      return res.status(400).json({ msg: "Email (or username) and password required" });
    }

    const email = normalizeEmail(rawEmail);
    console.log("MONGO_URI (env):", process.env.MONGO_URI || "<not-set>");
    console.log("Mongoose readyState:", mongoose.connection.readyState);
    console.log("Mongoose DB name (signup):", mongoose.connection?.db?.databaseName || "<no-db-yet>");
    const existing = await User.findOne({ email }).lean().exec();
    if (existing) {
      return res.status(409).json({ msg: "Email already registered. Please log in instead." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: name || "",
      email,
      password: hashed,
      role,
      taste
    });

    await newUser.save();
    console.log("DEBUG: after save newUser._id:", newUser._id);
    const persisted = await User.findById(newUser._id).lean().exec();
    console.log("DEBUG: persisted user (from DB):", persisted);

    if (!persisted) {
      console.error("Signup: saved user could not be read back from DB", { id: newUser._id });
      return res.status(500).json({ msg: "Signup succeeded locally but failed to persist. Contact admin." });
    }
    if (role === "ngo") {
      try {
        const ngoDoc = await NGO.create({
          name: newUser.name || "NGO",
          phone: "",
          address: "",
          location: { type: "Point", coordinates: [77.5946, 12.9716] },
          capacityKg: 200,
          reliabilityScore: 1
        });

        newUser.ngoRef = ngoDoc._id;
        await newUser.save();
        console.log("DEBUG: NGO created and linked", ngoDoc._id);
      } catch (ngoErr) {
        console.error("Failed to create NGO doc (continuing) - error:", ngoErr && ngoErr.message);
      }
    }
    const token = jwt.sign(
      {
        _id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        ngoRef: newUser.ngoRef || null
      },
      process.env.JWT_SECRET || "changeme",
      { expiresIn: "7d" }
    );

    console.log(`Signup: created user ${newUser.email} (${newUser._id})`);
    return res.status(201).json({ token });

  } catch (err) {
    console.error("Signup error (full):", {
      message: err && err.message,
      code: err && err.code,
      name: err && err.name,
      keyPattern: err && err.keyPattern,
      keyValue: err && err.keyValue,
      stack: err && err.stack
    });

    if (err && err.code === 11000) {
      const offendingField = err.keyValue && Object.keys(err.keyValue)[0];
      return res.status(409).json({
        msg: `${offendingField || "Field"} already exists (duplicate).`,
        field: offendingField || null,
        keyValue: err.keyValue || null
      });
    }

    return res.status(500).json({ msg: "Signup failed. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email: rawIdentifier, password } = req.body || {};
    if (!rawIdentifier || !password) {
      return res.status(400).json({ msg: "Email/username and password required" });
    }

    const identifier = rawIdentifier.trim();
    const normalizedEmail = normalizeEmail(identifier);
    const normalizedUsername = normalizeUsername(identifier);
    const query = {
      $or: [
        { email: normalizedEmail },
        { username: normalizedUsername }
      ]
    };

    console.log("LOGIN: identifier=", identifier);
    console.log("LOGIN: query=", JSON.stringify(query));

    const user = await User.findOne(query).exec();

    if (!user) {
      console.log("LOGIN: no user found for identifier:", identifier);
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    console.log("LOGIN: user found:", {
      id: user._id.toString(),
      email: user.email || null,
      username: user.username || null,
      passwordHashLength: (user.password || "").length
    });

    const ok = await bcrypt.compare(password, user.password);
    console.log("LOGIN: bcrypt.compare result for user", user._id.toString(), "=>", ok);

    if (!ok) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: user.role,
        ngoRef: user.ngoRef || null
      },
      process.env.JWT_SECRET || "changeme",
      { expiresIn: "7d" }
    );

    console.log(`Login: user ${user.email || user.username} (${user._id})`);
    return res.json({ token });

  } catch (err) {
    console.error("Login error (full):", {
      message: err && err.message,
      code: err && err.code,
      name: err && err.name,
      stack: err && err.stack
    });
    return res.status(500).json({ msg: "Login failed" });
  }
});

module.exports = router;
