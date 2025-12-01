const mongoose = require("mongoose");

const NgoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: "" },       
  address: { type: String, default: "" },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],      
      required: true,
      default: [0, 0]
    }
  },

  acceptedFoodTypes: {
    type: [String],
    default: []
  },

  capacityKg: { type: Number, default: 100 },     
  reliabilityScore: { type: Number, default: 1 },

  availability: { type: Boolean, default: true }
});

NgoSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("NGO", NgoSchema);
