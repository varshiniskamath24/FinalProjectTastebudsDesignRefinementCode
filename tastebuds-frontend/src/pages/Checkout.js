// src/pages/Checkout.js
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/api";

const FALLBACK_IMG = "https://placehold.co/80x60?text=No+Image";

// Clean extractor helpers (MATCH RestaurantDetails.js)
const getName = (it) =>
  it.name || it.item || it.itemName || it._resolvedName || "Item";

const getPrice = (it) =>
  it.price ?? it.cost ?? it._resolvedPrice ?? 0;

const getImage = (it) =>
  it.image ||
  it.imageUrl ||
  it.itemImage ||
  it._resolvedImage ||
  FALLBACK_IMG;

export default function Checkout() {
  const location = useLocation();
  const nav = useNavigate();
  const { cart, restaurant } = location.state || {};

  const [loading, setLoading] = useState(false);

  if (!cart || !restaurant) return <p>No items selected.</p>;

  const total = cart.reduce(
    (sum, it) => sum + getPrice(it) * it.qty,
    0
  );

  const confirmOrder = async () => {
    setLoading(true);
    try {
      await API.post("/api/order", {
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        items: cart.map((c) => ({
          name: getName(c),
          price: getPrice(c),
          qty: c.qty,
          image: getImage(c)
        })),
        total
      });

      alert("Order placed successfully!");
      nav("/orders");
    } catch (err) {
      console.log("Order error:", err);
      alert("Order failed");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Checkout — {restaurant.name}</h2>

      <div style={{ marginTop: 20 }}>
        {cart.map((c, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: "1px solid #ddd"
            }}
          >
            {/* IMAGE FIXED SIZE — SO NO FLICKER */}
            <div
              style={{
                width: 80,
                height: 60,
                borderRadius: 6,
                overflow: "hidden",
                background: "#eee",
                flexShrink: 0
              }}
            >
              <img
                src={getImage(c)}
                alt={getName(c)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
                onError={(e) => (e.target.src = FALLBACK_IMG)}
              />
            </div>

            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {getName(c)}
              </div>

              <div style={{ marginTop: 6 }}>
                ₹{getPrice(c)} × {c.qty} ={" "}
                <b>₹{getPrice(c) * c.qty}</b>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h3>Total: ₹{total}</h3>

      <button
        disabled={loading}
        onClick={confirmOrder}
        style={{
          marginTop: 20,
          padding: "10px 16px",
          fontWeight: 700,
          background: "#2b7cff",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer"
        }}
      >
        {loading ? "Processing…" : "Confirm Order"}
      </button>
    </div>
  );
}
