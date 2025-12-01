const express = require("express");
const Donation = require("../models/Donation");
const NGO = require("../models/NGO");
const auth = require("../middleware/auth");

const router = express.Router();
function getFoodAgeHours(preparedAt) {
  if (!preparedAt) return 0;
  return (Date.now() - new Date(preparedAt)) / (1000 * 3600);
}

router.post("/donate", auth, async (req, res) => {
  try {
    if (req.user.role === "ngo") {
      return res.status(403).json({ msg: "NGOs cannot donate food" });
    }

    const { foodType, quantity, preparedAt, lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ msg: "Coordinates (lat, lng) required" });
    }

    const donation = await Donation.create({
      donorId: req.user._id,
      foodType,
      quantity,
      preparedAt,
      status: "Pending",
      pickupConfirmed: false
    });
    const ngos = await NGO.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distance",
          spherical: true,
          maxDistance: 10000
        }
      }
    ]);

    if (!ngos.length) {
      return res.json({ msg: "No NGO available nearby" });
    }

    const choose = ngos
      .filter((n) => (n.capacityKg || 0) >= quantity && n.availability !== false)
      .map((n) => {
        const ageHrs = getFoodAgeHours(preparedAt);
        const perishabilityScore =
          ageHrs > 4 ? 0.4 :
          ageHrs > 2 ? 0.7 : 1;

        const finalScore =
          (1 / ((n.distance || 1) + 1)) * 0.4 +       
          ((n.capacityKg || 0) / 100) * 0.2 +         
          ((n.reliabilityScore || 1) * 0.4 * perishabilityScore); 

        return { ...n, finalScore };
      })
      .sort((a, b) => b.finalScore - a.finalScore)[0];

    if (!choose) {
      return res.json({ msg: "No suitable NGO found" });
    }

    donation.assignedNGO = choose._id;
    donation.status = "Assigned";
    await donation.save();

    await NGO.findByIdAndUpdate(choose._id, {
      $inc: { capacityKg: -quantity }
    });

    res.json({ msg: "Donation Assigned", assignedTo: choose.name });
  } catch (err) {
    console.error("donate error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/ngo/update-capacity", auth, async (req, res) => {
  try {
    if (req.user.role !== "ngo") {
      return res.status(403).json({ msg: "Only NGOs can update capacity" });
    }

    const { newCapacity } = req.body;
    if (newCapacity == null) {
      return res.status(400).json({ msg: "newCapacity is required" });
    }

    const updated = await NGO.findByIdAndUpdate(
      req.user.ngoRef,               
      { capacityKg: Number(newCapacity) },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ msg: "NGO not found for this user" });
    }

    res.json({ msg: "Capacity updated", ngo: updated });
  } catch (err) {
    console.error("🔥 update-capacity error:", err);
    res.status(500).json({ msg: "Failed to update capacity" });
  }
});
router.post("/ngo/request-pickup", auth, async (req, res) => {
  try {
    if (req.user.role !== "ngo") {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    const { donationId } = req.body;
    if (!donationId) {
      return res.status(400).json({ msg: "donationId is required" });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ msg: "Donation not found" });
    }

    if (donation.assignedNGO?.toString() !== req.user.ngoRef) {
      return res.status(403).json({ msg: "This donation is not assigned to you" });
    }

    donation.status = "Awaiting Confirmation";
    await donation.save();

    res.json({ msg: "Pickup confirmation requested from donor" });
  } catch (err) {
    console.error("request-pickup error:", err);
    res.status(500).json({ msg: "Request failed" });
  }
});

router.post("/donor/confirm-pickup", auth, async (req, res) => {
  try {
    const { donationId, ngoId } = req.body;

    if (req.user.role === "ngo") {
      return res.status(403).json({ msg: "NGOs cannot confirm pickup" });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) return res.status(404).json({ msg: "Donation not found" });

    if (donation.donorId.toString() !== req.user._id) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    donation.status = "Completed";
    donation.pickupConfirmed = true;
    await donation.save();

    await NGO.findByIdAndUpdate(ngoId, { $inc: { reliabilityScore: 0.1 } });

    res.json({ msg: "Pickup Confirmed! NGO reliability improved." });
  } catch (err) {
    console.error("confirm-pickup error:", err);
    res.status(500).json({ msg: "Error confirming pickup" });
  }
});

router.get("/my-donations", auth, async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.user._id })
      .populate("assignedNGO", "name reliabilityScore capacityKg");

    res.json(donations);
  } catch (err) {
    console.error("my-donations error:", err);
    res.status(500).json({ msg: "Error fetching donations" });
  }
});

router.get("/assigned-to-me", auth, async (req, res) => {
  try {
    if (req.user.role !== "ngo") {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    if (!req.user.ngoRef) {
      return res.status(400).json({ msg: "NGO reference missing in token" });
    }

    const donations = await Donation.find({ assignedNGO: req.user.ngoRef })
      .populate("donorId", "name");

    res.json(donations);
  } catch (err) {
    console.error("assigned-to-me error:", err);
    res.status(500).json({ msg: "Failed to fetch assigned donations" });
  }
});

module.exports = router;
