const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    restaurantId: String,
    dish: String,
    spice: Number,
    oil: Number,
    sweet: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
