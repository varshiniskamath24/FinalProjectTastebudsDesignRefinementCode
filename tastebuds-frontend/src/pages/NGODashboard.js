import React, { useEffect, useState } from "react";
import api from "../api/api";
import { jwtDecode } from "jwt-decode";

export default function NGODashboard() {
  const [capacity, setCapacity] = useState("");
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

  const isNgo = user?.role === "ngo";

  const loadAssigned = async () => {
    if (!isNgo) return;
    try {
      const res = await api.get("/donation/assigned-to-me");
      setDonations(res.data);
    } catch {
      alert("Failed to load assigned donations");
    }
  };

  useEffect(() => {
    loadAssigned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNgo]);

  const handleUpdateCapacity = async () => {
    if (!isNgo) {
      alert("Only NGOs can update capacity");
      return;
    }
    try {
      await api.post("/donation/ngo/update-capacity", {
        newCapacity: Number(capacity)
      });
      alert("Capacity updated");
    } catch {
      alert("Failed to update capacity");
    }
  };

  const requestPickup = async (donationId) => {
    if (!isNgo) return;
    try {
      await api.post("/donation/ngo/request-pickup", { donationId });
      alert("Requested pickup confirmation");
      loadAssigned();
    } catch {
      alert("Failed to request pickup");
    }
  };

  if (!isNgo) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Unauthorized</h2>
        <p>This page is only for NGO users.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>NGO Dashboard</h1>

      <h2>Update Storage Capacity</h2>
      <input
        placeholder="Available Capacity (kg)"
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
      />
      <button onClick={handleUpdateCapacity} style={{ marginLeft: 10 }}>
        Update Capacity
      </button>

      <h2 style={{ marginTop: 30 }}>Assigned Donations</h2>

      {donations.length === 0 && <p>No donations assigned.</p>}

      {donations.map((d) => (
        <div
          key={d._id}
          style={{ border: "1px solid #ccc", marginTop: 10, padding: 10 }}
        >
          <p>
            <b>Food:</b> {d.foodType} ({d.quantity} kg)
          </p>
          <p>
            <b>Donor:</b> {d.donorId?.name || "Unknown"}
          </p>
          <p>
            <b>Status:</b> {d.status}
          </p>

          {d.status === "Assigned" && (
            <button onClick={() => requestPickup(d._id)}>
              Request Pickup Confirmation
            </button>
          )}
          {d.status === "Awaiting Confirmation" && (
            <span style={{ fontStyle: "italic", color: "orange" }}>
              Waiting for donor confirmation…
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
