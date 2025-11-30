import React, { useEffect, useState } from "react";
import API from "../api/api";

// ⭐ Status Dot Colors
function statusColor(status) {
  switch (status) {
    case "Placed":
    case "Preparing":
      return "orange";
    case "Out for Delivery":
      return "dodgerblue";
    case "Delivered":
      return "green";
    default:
      return "gray";
  }
}

// ⭐ SINGLE ORDER CARD
function OrderCard({ order }) {
  const [fb, setFB] = useState({ spice: 3, oil: 3, sweet: 3 });

  const submitFeedback = async () => {
    try {
      await API.post("/api/feedback/" + order._id, {
        spice: fb.spice,
        oil: fb.oil,
        sweet: fb.sweet,
      });
      alert("Feedback saved - thank you!");
      setFB({ spice: 3, oil: 3, sweet: 3 });
    } catch {
      alert("Error submitting feedback");
    }
  };

  return (
    <div
      style={{
        marginTop: 25,
        padding: 20,
        border: "1px solid #ccc",
        borderRadius: 8,
        background: "#fafafa",
      }}
    >
      <p><b>Restaurant:</b> {order.restaurantName || "Unknown Restaurant"}</p>
      <p><b>Total:</b> ₹{order.total}</p>

      {/* ⭐ Order Status with colored dot */}
      <p>
        <b>Status:</b>{" "}
        <span style={{ color: statusColor(order.status), fontWeight: "bold" }}>
          ● {order.status}
        </span>
      </p>

      {/* ⭐ Taste Feedback Sliders */}
      {order.status === "Delivered" && (
        <>
          <h3 style={{ marginTop: 20 }}>Rate Taste:</h3>

          <div style={{ marginBottom: 10 }}>
            🌶 <b>Spice:</b>
            <input
              type="range"
              min="1"
              max="5"
              value={fb.spice}
              onChange={(e) => setFB({ ...fb, spice: Number(e.target.value) })}
              style={{ marginLeft: 10 }}
            />{" "}
            {fb.spice}
          </div>

          <div style={{ marginBottom: 10 }}>
            🛢 <b>Oil:</b>
            <input
              type="range"
              min="1"
              max="5"
              value={fb.oil}
              onChange={(e) => setFB({ ...fb, oil: Number(e.target.value) })}
              style={{ marginLeft: 10 }}
            />{" "}
            {fb.oil}
          </div>

          <div style={{ marginBottom: 10 }}>
            🍬 <b>Sweet:</b>
            <input
              type="range"
              min="1"
              max="5"
              value={fb.sweet}
              onChange={(e) => setFB({ ...fb, sweet: Number(e.target.value) })}
              style={{ marginLeft: 10 }}
            />{" "}
            {fb.sweet}
          </div>

          <button
            onClick={submitFeedback}
            style={{
              marginTop: 10,
              padding: "8px 15px",
              background: "black",
              color: "white",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
            }}
          >
            Submit Feedback
          </button>
        </>
      )}
    </div>
  );
}

// 🎉 MAIN PAGE
export default function Orders() {
  const [orders, setOrders] = useState([]);

  const loadOrders = async () => {
    try {
      const res = await API.get("/api/order/myorders");
      setOrders(res.data);
    } catch {
      alert("Failed to load orders");
    }
  };

  // ⭐ Auto-refresh order status every 30s
  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: 30 }}>
      <h2>My Orders</h2>
      {orders.length === 0 && <p>No orders yet.</p>}
      {orders.map((o) => (
        <OrderCard key={o._id} order={o} />
      ))}
    </div>
  );
}
