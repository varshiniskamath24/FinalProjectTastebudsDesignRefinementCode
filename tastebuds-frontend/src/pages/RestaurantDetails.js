
import React, { useEffect, useState } from "react";
import API from "../api/api";
import { useParams, useNavigate } from "react-router-dom";

const FALLBACK_IMG = "https://placehold.co/140x100?text=No+Image";

const itemId = (it) =>
  it._resolvedId || it._id || it.id || it.item || it.name || "item-" + Math.random();

const getName = (it) =>
  it._resolvedName || it.name || it.item || "Unnamed Item";

const getPrice = (it) =>
  it._resolvedPrice ?? it.price ?? it.cost ?? "N/A";

const getImage = (it) =>
  it._resolvedImage ||
  it.imageUrl ||
  it.itemImage ||
  it.image ||
  FALLBACK_IMG;

const getTaste = (it) => ({
  spice: Number(it?.taste?.spice ?? it.spice ?? 3),
  oil: Number(it?.taste?.oil ?? it.oil ?? 3),
  sweet: Number(it?.taste?.sweet ?? it.sweet ?? 3),
});


function tasteExplanation(userTaste, dish) {
  const u = userTaste || { spice: 3, sweet: 3, oil: 3 };
  const d = getTaste(dish);

  const parts = [];


  if (d.spice > u.spice) {
    parts.push("🌶 This dish is spicier than your preference.");
  } else if (d.spice < u.spice) {
    parts.push("🌶 This dish is less spicy than you prefer.");
  } else {
    parts.push("🌶 Spice level matches your taste.");
  }


  if (d.sweet > u.sweet) {
    parts.push("This dish is sweeter than your taste.");
  } else if (d.sweet < u.sweet) {
    parts.push("This dish is not sweet enough for your taste.");
  } else {
    parts.push("Sweetness matches your taste.");
  }

 
  if (d.oil > u.oil) {
    parts.push("This dish is oilier than you prefer.");
  } else if (d.oil < u.oil) {
    parts.push("This dish is less oily than your preference.");
  } else {
    parts.push("Oil level matches your taste.");
  }

  return parts.join(" ");
}


function restaurantHeadline(userTaste, menu) {
  if (!Array.isArray(menu) || menu.length === 0) return "";

  let sum = { spice: 0, oil: 0, sweet: 0 };
  let count = 0;

  menu.forEach((m) => {
    const t = getTaste(m);
    sum.spice += t.spice;
    sum.oil += t.oil;
    sum.sweet += t.sweet;
    count++;
  });

  const avg = {
    spice: sum.spice / count,
    oil: sum.oil / count,
    sweet: sum.sweet / count,
  };

  const u = userTaste;
  const r = avg;

  const parts = [];


  if (r.spice > u.spice + 1) parts.push("Spicier than you prefer.");
  else if (r.spice < u.spice - 1) parts.push("Milder than your preference.");
  else parts.push("Spice level similar to your taste.");


  if (r.oil > u.oil + 1) parts.push("Oilier than your taste.");
  else if (r.oil < u.oil - 1) parts.push("Lower oil than you prefer.");
  else parts.push("Oil level similar to your taste.");

  // SWEET
  if (r.sweet > u.sweet + 1) parts.push("Sweeter than your usual preference.");
  else if (r.sweet < u.sweet - 1) parts.push("Less sweet than you prefer.");
  else parts.push("Sweetness similar to your taste.");

  return parts.join(" ");
}


function TasteBadge({ emoji, count }) {
  if (!count || Number(count) <= 0) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", marginRight: 8 }}>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <span
        style={{
          background: "#eee",
          padding: "2px 8px",
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 12,
          marginLeft: 6,
          minWidth: 20,
          textAlign: "center"
        }}
      >
        {count}
      </span>
    </span>
  );
}

export default function RestaurantDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [cart, setCart] = useState([]);

  const enrichRecommended = (dataObj) => {
    const menu = dataObj.menu || [];
    return (dataObj.recommendedDishes || []).map((rec, i) => {
      const match = menu.find((m) => m.name === rec.name) || null;
      const t = getTaste(match || rec);

      return {
        ...rec,
        _resolvedName: rec.name || match?.name || `Item ${i + 1}`,
        _resolvedImage: rec.image || match?.image || FALLBACK_IMG,
        _resolvedPrice: rec.price || match?.price || 0,
        _resolvedId: rec._id || rec.id || match?._id || `rec-${i}`,
        spice: t.spice,
        sweet: t.sweet,
        oil: t.oil,
        taste: t
      };
    });
  };

  async function loadDetails() {
    try {
      const res = await API.get(`/api/restaurant/${id}`);
      const fetched = res.data;

      fetched.userTaste =
        res.data.userTaste || { spice: 3, oil: 3, sweet: 3 };

      fetched.recommendedDishes = enrichRecommended(fetched);
      setData(fetched);
    } catch (err) {
      console.log("Restaurant error", err);
      alert("Failed to load restaurant");
    }
  }

  useEffect(() => {
    loadDetails();
  }, [id]);

  const addItem = (item) => {
    const key = itemId(item);
    setCart((prev) => {
      const found = prev.find((x) => itemId(x) === key);
      if (found) {
        return prev.map((x) =>
          itemId(x) === key ? { ...x, qty: x.qty + 1 } : x
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const goCheckout = () =>
    cart.length === 0
      ? alert("Add at least one item.")
      : nav(`/checkout/${id}`, { state: { cart, restaurant: data } });

  if (!data) return <p style={{ padding: 20 }}>Loading…</p>;

  const menu = Array.isArray(data.menu) ? data.menu : [];
  const userTaste = data.userTaste;

  return (
    <div style={{ padding: 30 }}>
      <h2>{data.name}</h2>

      <p style={{ marginTop: 6, color: "#333" }}>
        {restaurantHeadline(userTaste, menu)}
      </p>

      {data.recommendedDishes?.length > 0 && (
        <>
          <h3 style={{ marginTop: 20 }}>🍽 Recommended Dishes for You</h3>

          {data.recommendedDishes.map((d) => {
            const t = getTaste(d);
            return (
              <div
                key={itemId(d)}
                style={{
                  background: "#fff8e6",
                  padding: 12,
                  marginBottom: 12,
                  borderRadius: 8,
                  border: "1px solid #ffe59e",
                  display: "flex",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", gap: 12 }}>
                  <div
                    style={{
                      width: 88,
                      height: 64,
                      overflow: "hidden",
                      borderRadius: 8,
                      background: "#eee",
                      border: "1px solid #ddd",
                      flexShrink: 0
                    }}
                  >
                    <img
                      src={getImage(d)}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => (e.target.src = FALLBACK_IMG)}
                    />
                  </div>

                  <div>
                    <div style={{ fontWeight: 800 }}>
                      {getName(d)} — ₹{getPrice(d)}
                    </div>

                    <div style={{ marginTop: 6, color: "#444", fontSize: 12 }}>
                      {tasteExplanation(userTaste, d)}
                    </div>

                    <div style={{ marginTop: 6 }}>
                      <TasteBadge emoji="🌶️" count={t.spice} />
                      <TasteBadge emoji="🛢" count={t.oil} />
                      <TasteBadge emoji="🍬" count={t.sweet} />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => addItem(d)}
                  style={{ padding: "6px 12px", fontWeight: 700 }}
                >
                  Add
                </button>
              </div>
            );
          })}
        </>
      )}

      {/* Menu Section */}
      <h3 style={{ marginTop: 20 }}>Menu</h3>

      {menu.map((m) => {
        const t = getTaste(m);
        return (
          <div
            key={itemId(m)}
            style={{
              padding: 12,
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  width: 84,
                  height: 64,
                  overflow: "hidden",
                  borderRadius: 8,
                  background: "#eee",
                  border: "1px solid #ddd",
                  flexShrink: 0
                }}
              >
                <img
                  src={getImage(m)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => (e.target.src = FALLBACK_IMG)}
                />
              </div>

              <div>
                <div style={{ fontWeight: 700 }}>{getName(m)}</div>
                <div style={{ marginTop: 6 }}>₹{getPrice(m)}</div>

                <div style={{ marginTop: 6, color: "#444", fontSize: 12 }}>
                  {tasteExplanation(userTaste, m)}
                </div>

                <div style={{ marginTop: 6 }}>
                  <TasteBadge emoji="🌶️" count={t.spice} />
                  <TasteBadge emoji="🛢" count={t.oil} />
                  <TasteBadge emoji="🍬" count={t.sweet} />
                </div>
              </div>
            </div>

            <button
              onClick={() => addItem(m)}
              style={{ padding: "6px 12px", fontWeight: 700 }}
            >
              Add
            </button>
          </div>
        );
      })}

      {/* Checkout button */}
      {cart.length > 0 && (
        <button
          onClick={goCheckout}
          style={{
            marginTop: 20,
            padding: "10px 16px",
            fontWeight: 800,
            background: "#2b7cff",
            color: "#fff",
            borderRadius: 8,
            border: "none"
          }}
        >
          Checkout ({cart.reduce((a, x) => a + x.qty, 0)} items)
        </button>
      )}
    </div>
  );
}
