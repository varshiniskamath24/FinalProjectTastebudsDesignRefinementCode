const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");

// ⭐ CREATE NEW ORDER (Used in Checkout)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { restaurantId, items, total } = req.body;

    if (!restaurantId || !items || !total) {
      return res.status(400).json({ msg: "Missing order fields" });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    const newOrder = new Order({
      userId: req.user._id,
      restaurantId,
      items,
      total,
      status: "Placed"
    });

    await newOrder.save();

    // Preparing after 30s
setTimeout(async () => {
  await Order.findByIdAndUpdate(newOrder._id, { status: "Preparing" });
}, 30000);  // 30 sec

// Out for Delivery after 60s
setTimeout(async () => {
  await Order.findByIdAndUpdate(newOrder._id, { status: "Out for Delivery" });
}, 60000);  // 60 sec (1 min)

// Delivered after 90s
setTimeout(async () => {
  await Order.findByIdAndUpdate(newOrder._id, { status: "Delivered" });
}, 90000);  // 90 sec (1.5 min)

    return res.json({ msg: "Order placed successfully", order: newOrder });

  } catch (err) {
    console.log("Order Creation Error ❌", err);
    return res.status(500).json({ msg: "Server error creating order" });
  }
});

// ⭐ GET logged-in user's orders
router.get("/myorders", requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });

    const withRestaurant = await Promise.all(
      orders.map(async (o) => {
        const r = await Restaurant.findById(o.restaurantId);
        return {
          ...o._doc,
          restaurantName: r ? r.name : "Unknown Restaurant",
        };
      })
    );

    res.json(withRestaurant);
  } catch (err) {
    console.log("Order loading error", err);
    res.status(500).json({ msg: "Server error loading orders" });
  }
});

module.exports = router;
