const mongoose = require("mongoose");
const MenuItemSchema = new mongoose.Schema(
  {
    name: { type: String },
    item: { type: String }, 
    price: { type: Number },
    spice: { type: Number, default: 3 },
    oil: { type: Number, default: 3 },
    sweet: { type: Number, default: 3 },
    diet: { type: String, default: "veg" },          
    cuisine: { type: String, default: "indian" },    
    image: { type: String, default: "/images/placeholder_food.jpg" },
    popularity: { type: Number, default: 0 }
  },
  { _id: true }
);
const RestaurantSchema = new mongoose.Schema(
  {
    name: String,
    cuisine: String, 
    tasteTags: {
      spice: { type: Number, default: 3 },
      oil: { type: Number, default: 3 },
      sweet: { type: Number, default: 3 }
    },
    menu: [MenuItemSchema],
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },

    rating: { type: Number, default: 4 },
    feedbackCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);
RestaurantSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Restaurant", RestaurantSchema);
