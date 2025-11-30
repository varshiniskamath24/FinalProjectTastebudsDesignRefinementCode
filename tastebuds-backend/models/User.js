// models/User.js
const mongoose = require("mongoose");

// Prevent Mongoose from auto-creating indexes on startup.
// This helps ensure we don't accidentally recreate a unique index.
mongoose.set("autoIndex", false);

const UserSchema = new mongoose.Schema({
  name: String,

  // <-- NO unique:true here
  email: { type: String },

  password: String,

  role: {
    type: String,
    enum: ["customer", "ngo"],
    default: "customer"
  },

  // ⭐ Taste data is only relevant for customers
  taste: {
    spice: { type: Number, default: 3 },
    oil: { type: Number, default: 3 },
    sweet: { type: Number, default: 3 },
    diet: { type: String, default: "veg" },
    cuisines: { type: [String], default: [] }
  },

  // ⭐ Link NGO user to their NGO document
  ngoRef: { type: mongoose.Schema.Types.ObjectId, ref: "NGO", default: null }
});

module.exports = mongoose.model("User", UserSchema);
