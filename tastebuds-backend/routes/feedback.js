// tastebuds-backend/routes/feedback.js
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");

// POST /api/feedback/:orderId
router.post("/:orderId", requireAuth, async (req, res) => {
  try {
    let { spice, oil, sweet } = req.body;

    spice = Number(spice);
    oil = Number(oil);
    sweet = Number(sweet);

    if ([spice, oil, sweet].some(v => isNaN(v) || v < 0)) {
      return res.status(400).json({ msg: "Invalid feedback values" });
    }

    const userId = String(req.user._id);
    const orderId = req.params.orderId;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) return res.status(404).json({ msg: "Order not found" });

    if (order.feedbackSubmitted) {
      return res.status(400).json({ msg: "Feedback already submitted" });
    }

    const restaurant = await Restaurant.findById(order.restaurantId);
    if (!restaurant) return res.status(404).json({ msg: "Restaurant not found" });

    // ---- Taste Update ----
    restaurant.tasteTags = restaurant.tasteTags || { spice: 3, oil: 3, sweet: 3 };
    restaurant.feedbackCount = restaurant.feedbackCount || 0;

    const c = restaurant.feedbackCount;

    restaurant.tasteTags.spice = Math.round((restaurant.tasteTags.spice * c + spice) / (c + 1));
    restaurant.tasteTags.oil   = Math.round((restaurant.tasteTags.oil * c + oil) / (c + 1));
    restaurant.tasteTags.sweet = Math.round((restaurant.tasteTags.sweet * c + sweet) / (c + 1));

    // ---- ⭐ Dynamic Rating Update ----
    const feedbackRating = (spice + oil + sweet) / 3; // 0–10 scaled
    const normalized = Math.min(5, Math.max(1, (feedbackRating / 2))); 

    restaurant.rating = Number(
      ((restaurant.rating || 4) * c + normalized) / (c + 1)
    ).toFixed(1);

    restaurant.feedbackCount++;
    await restaurant.save();

    // ---- User Taste Update ----
    const user = await User.findById(userId);
    user.taste = user.taste || { spice: 3, oil: 3, sweet: 3 };

    user.taste.spice = Math.round((user.taste.spice + spice) / 2);
    user.taste.oil = Math.round((user.taste.oil + oil) / 2);
    user.taste.sweet = Math.round((user.taste.sweet + sweet) / 2);

    await user.save();

    // Mark order feedback
    order.feedbackSubmitted = true;
    await order.save();

    return res.json({ msg: "Feedback saved & restaurant updated" });

  } catch (err) {
    console.error("Feedback Error", err);
    res.status(500).json({ msg: "Server error submitting feedback" });
  }
});

module.exports = router;
