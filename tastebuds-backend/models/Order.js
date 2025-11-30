const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  restaurantId: { type: String, required: true },  // IMPORTANT
  restaurantName: String,
  items: Array,
  total: Number,
  status: { type: String, default: "Preparing" }
}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);
