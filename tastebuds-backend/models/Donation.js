const mongoose = require("mongoose");

const DonationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  foodType: { type: String, required: true },
  quantity: { type: Number, required: true },
  preparedAt: { type: Date, required: true },

  status: { type: String, default: "Pending" },

  assignedNGO: { type: mongoose.Schema.Types.ObjectId, ref: "NGO" },

  // 👇 New field: donor confirmation
  pickupConfirmed: { type: Boolean, default: false }
});

module.exports = mongoose.model("Donation", DonationSchema);
