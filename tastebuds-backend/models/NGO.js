const mongoose = require("mongoose");

const NgoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: "" },         // 👈 Added (usable later)
  address: { type: String, default: "" },

  // ⭐ Required for GeoSpatial
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],        // Must be [lng, lat]
      required: true,
      default: [0, 0]
    }
  },

  acceptedFoodTypes: {
    type: [String],
    default: []
  },

  // ⭐ NEW - Storage Capacity + Dynamic Reliability
  capacityKg: { type: Number, default: 100 },     // 👈 Default capacity
  reliabilityScore: { type: Number, default: 1 }, // 👈 1 = neutral starting score

  // (Optional) NGO Online/Offline Availability
  availability: { type: Boolean, default: true }
});

// ⭐ Index required for fastest GeoSpatial Queries
NgoSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("NGO", NgoSchema);
