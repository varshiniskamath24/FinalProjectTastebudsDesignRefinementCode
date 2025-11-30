import React, { useEffect, useState } from "react";
import api from "../api/api";
import { jwtDecode } from "jwt-decode";

export default function MyDonations() {
  const [donations, setDonations] = useState([]);

  const token = localStorage.getItem("token");
  let user = null;

  try {
    if (token && token.split(".").length === 3) {
      user = jwtDecode(token);
    }
  } catch {
    user = null;
  }

  const load = async () => {
    try {
      const res = await api.get("/donation/my-donations");
      setDonations(res.data);
    } catch {
      alert("Failed to load donations");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const confirmPickup = async (donationId, ngoId) => {
    try {
      await api.post("/donation/donor/confirm-pickup", {
        donationId,
        ngoId
      });
      alert("Pickup confirmed!");
      load();
    } catch {
      alert("Error confirming pickup");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>📦 My Food Donations</h2>

      {donations.length === 0 && <p>No donations yet.</p>}

      {donations.map((d) => (
        <div
          key={d._id}
          style={{
            border: "1px solid #ccc",
            padding: 10,
            marginTop: 10,
            borderRadius: 8,
            background: "#fafafa"
          }}
        >
          <p>
            <b>Food Type:</b> {d.foodType}
          </p>
          <p>
            <b>Quantity:</b> {d.quantity} kg
          </p>
          <p>
            <b>Status:</b> {d.status}
          </p>

          {d.assignedNGO && (
            <>
              <p>
                <b>Assigned NGO:</b> {d.assignedNGO.name}
              </p>
              <small>
                Reliability: {d.assignedNGO.reliabilityScore.toFixed(2)}
              </small>
            </>
          )}

          {d.status === "Awaiting Confirmation" && d.assignedNGO && (
            <button
              onClick={() => confirmPickup(d._id, d.assignedNGO._id)}
              style={{
                background: "green",
                color: "white",
                marginTop: 10,
                padding: "8px 12px",
                border: "none",
                borderRadius: 6,
                cursor: "pointer"
              }}
            >
              ✔ Confirm Pickup
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
