
const mongoose = require("mongoose");

mongoose.set("autoIndex", false);

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String },

  password: String,

  role: {
    type: String,
    enum: ["customer", "ngo"],
    default: "customer"
  },
  taste: {
    spice: { type: Number, default: 3 },
    oil: { type: Number, default: 3 },
    sweet: { type: Number, default: 3 },
    diet: { type: String, default: "veg" },
    cuisines: { type: [String], default: [] }
  },
  ngoRef: { type: mongoose.Schema.Types.ObjectId, ref: "NGO", default: null }
});

module.exports = mongoose.model("User", UserSchema);
