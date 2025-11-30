const mongoose = require("mongoose");

/* ============================================================
   MENU ITEM SCHEMA — UPDATED FOR ITEM COLD-START SOLUTION
   Adds: diet + cuisine (per dish)
   ============================================================ */
const MenuItemSchema = new mongoose.Schema(
  {
    // Support both "item" (old field) and "name"
    name: { type: String },
    item: { type: String }, // backward compatibility
    price: { type: Number },

    // Taste values used for recommendations (cold-start friendly)
    spice: { type: Number, default: 3 },
    oil: { type: Number, default: 3 },
    sweet: { type: Number, default: 3 },

    // ⭐ NEW — solve item cold-start
    // Automatically used when no other metadata exists
    diet: { type: String, default: "veg" },          // veg / non-veg / vegan
    cuisine: { type: String, default: "indian" },    // fallback cuisine

    // Image for UI
    image: { type: String, default: "/images/placeholder_food.jpg" },

    // Popularity (updated via orders)
    popularity: { type: Number, default: 0 }
  },
  { _id: true }
);

/* ============================================================
   RESTAURANT SCHEMA
   ============================================================ */
const RestaurantSchema = new mongoose.Schema(
  {
    name: String,
    cuisine: String,  // restaurant-level cuisine

    // Crowd-computed taste tags for restaurant
    tasteTags: {
      spice: { type: Number, default: 3 },
      oil: { type: Number, default: 3 },
      sweet: { type: Number, default: 3 }
    },

    // ⭐ Menu with updated schema (supports cold-start)
    menu: [MenuItemSchema],

    // Geo location
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },

    // Basic rating
    rating: { type: Number, default: 4 },

    // Number of feedback entries
    feedbackCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Ensure 2dsphere index exists for geo queries
RestaurantSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Restaurant", RestaurantSchema);
