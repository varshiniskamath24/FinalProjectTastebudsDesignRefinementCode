
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");


function getImageURL(it) {
  return (
    it?.imageUrl ||
    it?.image ||
    it?.img ||
    it?.photo ||
    it?.picture ||
    "https://placehold.co/140x100?text=No+Image"
  );
}

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const r = await Restaurant.findById(req.params.id).lean();
    if (!r) return res.status(404).json({ msg: "Restaurant not found" });

    const menu = Array.isArray(r.menu) ? r.menu : [];

    const user = await User.findById(req.user._id).lean();
    const uTaste = user?.taste || { spice: 3, oil: 3, sweet: 3 };

    const t = r.tasteTags || { spice: 3, oil: 3, sweet: 3 };
    const reason = [];
    if (t.spice > uTaste.spice) reason.push(" Spicy like you prefer.");
    if (t.oil < uTaste.oil) reason.push("Low oil matches your taste.");
    if (t.sweet > uTaste.sweet) reason.push(" Sweeter just for you.");
    if (!reason.length) reason.push("Perfectly balanced for you.");

    const scoreDish = (d) =>
      5 -
      (Math.abs((d.spice || 3) - uTaste.spice) +
        Math.abs((d.oil || 3) - uTaste.oil) +
        Math.abs((d.sweet || 3) - uTaste.sweet));

    const recommendedDishes = menu
      .map((d) => ({
        _id: d._id,
        name: d.name || d.item,
        price: d.price,
        spice: d.spice ?? 3,
        oil: d.oil ?? 3,
        sweet: d.sweet ?? 3,
        imageUrl: getImageURL(d),    
        image: getImageURL(d),        
        score: scoreDish(d)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);


    return res.json({
      _id: r._id,
      name: r.name,
      tasteTags: t,
      explanation: reason.join(" "),
      menu: menu.map((m) => ({
        ...m,
        imageUrl: getImageURL(m),   
        image: getImageURL(m)       
      })),
      recommendedDishes
    });
  } catch (err) {
    console.log("Restaurant Lookup Error ", err);
    res.status(500).json({ msg: "Server error loading restaurant" });
  }
});

module.exports = router;
