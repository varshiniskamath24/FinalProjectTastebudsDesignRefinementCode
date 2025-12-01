// tastebuds-backend/routes/recommendation.js
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");

// ---------------- Helper ----------------
const num = (v, d = 3) =>
  v === undefined || v === null || Number.isNaN(Number(v)) ? d : Number(v);

// ---------------- Taste Similarity ----------------
function tasteSim(u, v) {
  const ds = (a, b) => Math.pow(num(a, 3) - num(b, 3), 2);
  const dist = Math.sqrt(
    ds(u.spice, v.spice) + ds(u.oil, v.oil) + ds(u.sweet, v.sweet)
  );
  return 1 / (1 + dist);
}

// ---------------- Cuisine + Diet ----------------
function cuisineBonus(userTaste, dishCuisine) {
  if (!dishCuisine || !userTaste.cuisines) return 0;
  return userTaste.cuisines.includes(dishCuisine.toLowerCase()) ? 0.2 : 0;
}

function dietPenalty(userDiet, dishDiet) {
  if (!dishDiet) return 0;

  if (userDiet === "veg" && dishDiet === "non-veg") return -0.15;
  if (userDiet === "vegan" && dishDiet !== "vegan") return -0.15;

  return 0;
}

function buildReasonParts(tasteScore, popNorm, restScore, cuisineMatch, dietMatch) {
  const parts = [];

  if (tasteScore >= 0.7) parts.push("matches your taste");
  else if (tasteScore >= 0.4) parts.push("somewhat matches your taste");

  if (cuisineMatch) parts.push("fits your cuisine preference");
  if (dietMatch) parts.push("matches your diet");

  if (popNorm >= 0.6) parts.push("popular among others");
  else if (popNorm >= 0.2) parts.push("somewhat popular");

  if (restScore >= 0.6) parts.push("restaurant taste matches you");

  return parts.length ? parts.join(" & ") : "Recommended by multiple people";
}
function scoreRestaurant(r, userTaste, maxPop) {
  const rTaste = r.tasteTags || { spice: 3, oil: 3, sweet: 3 };
  const tasteScore = tasteSim(userTaste, rTaste);

  const pops = (r.menu || []).map((m) => Number(m.popularity || 0));
  const avgPop = pops.length ? pops.reduce((s, x) => s + x, 0) / pops.length : 0;
  const popNorm = maxPop > 0 ? avgPop / maxPop : 0;

  const ratingNorm = num(r.rating, 4) / 5;

  const final =
  0.40 * tasteScore +    
  0.20 * popNorm +        
  0.40 * ratingNorm;      

  return {
    finalScore: Number(final.toFixed(4)),
    explanation: buildReasonParts(tasteScore, popNorm, tasteScore)
  };
}

function scoreDish(it, restaurant, userTaste, maxPop) {
  const itemTaste = {
    spice: num(it.spice || (it.taste && it.taste.spice), 3),
    oil: num(it.oil || (it.taste && it.taste.oil), 3),
    sweet: num(it.sweet || (it.taste && it.taste.sweet), 3)
  };

  const dishCuisine =
    (it.cuisine ||
      (it.taste && it.taste.cuisine) ||
      restaurant.cuisine ||
      "indian").toLowerCase();

  const dishDiet =
    it.diet || (it.taste && it.taste.diet) || "veg";

  const tasteScore = tasteSim(userTaste, itemTaste);
  const popNorm = maxPop > 0 ? num(it.popularity, 0) / maxPop : 0;

  const restTaste = restaurant.tasteTags || { spice: 3, oil: 3, sweet: 3 };
  const restScore = tasteSim(userTaste, restTaste);

  const cuisineBoost = cuisineBonus(userTaste, dishCuisine);
  const dietImpact = dietPenalty(userTaste.diet, dishDiet);

  const final =
    0.55 * tasteScore +
    0.25 * popNorm +
    0.1 * restScore +
    0.08 * cuisineBoost +
    dietImpact;

  return {
    finalScore: Number(final.toFixed(4)),
    explanation: buildReasonParts(
      tasteScore,
      popNorm,
      restScore,
      cuisineBoost > 0,
      dietImpact === 0
    )
  };
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const { lat, lng, radiusKm = 10 } = req.body;
    const u = await User.findById(req.user._id).lean();
    const userTaste =
      (u && u.taste) || { spice: 3, oil: 3, sweet: 3, diet: "veg", cuisines: [] };

    let restaurants = [];

    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      try {
        restaurants = await Restaurant.aggregate([
          {
            $geoNear: {
              near: { type: "Point", coordinates: [Number(lng), Number(lat)] },
              distanceField: "distanceMeters",
              spherical: true,
              maxDistance: radiusKm * 1000
            }
          }
        ]);
      } catch (e) {
        restaurants = await Restaurant.find({}).lean();
      }
    } else {
      restaurants = await Restaurant.find({}).lean();
    }

    let maxPop = 0;
    restaurants.forEach((r) =>
      (r.menu || []).forEach((mi) => {
        const p = num(mi.popularity, 0);
        if (p > maxPop) maxPop = p;
      })
    );
    const restScored = restaurants
      .map((r) => {
        const s = scoreRestaurant(r, userTaste, maxPop);
        return {
          restaurantId: r._id,
          name: r.name,
          cuisine: r.cuisine,
          rating: r.rating,
          location: r.location,
          distanceMeters: r.distanceMeters || 0,
          score: s.finalScore,
          match: Math.round(s.finalScore * 100),  
          explanation: s.explanation
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
    const dishPool = [];
    restaurants.forEach((r) =>
      (r.menu || []).forEach((mi) =>
        dishPool.push({
          restaurant: r,
          restaurantId: r._id,
          restaurantName: r.name,
          rawItem: mi,
          itemId: mi._id,
          itemName: mi.name || mi.item,
          itemImage: mi.imageUrl || mi.image || null,
          itemPrice: mi.price,
          popularity: num(mi.popularity, 0),
          distanceMeters: r.distanceMeters || 0
        })
      )
    );

    const dishScored = dishPool
      .map((it) => {
        const s = scoreDish(it.rawItem, it.restaurant, userTaste, maxPop);
        return {
          ...it,
          score: s.finalScore,
          match: Math.round(s.finalScore * 100), 
          reason: s.explanation
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    res.json({ restaurants: restScored, dishes: dishScored });

  } catch (err) {
    res.status(500).json({ msg: "Recommendation error", error: err.message });
  }
});

module.exports = router;
