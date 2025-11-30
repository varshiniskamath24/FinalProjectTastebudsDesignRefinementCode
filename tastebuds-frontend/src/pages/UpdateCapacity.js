import React, { useEffect, useState } from "react";
import api from "../api/api";
import { jwtDecode } from "jwt-decode";

export default function UpdateCapacity() {
  const [capacity, setCapacity] = useState("");
  const [donations, setDonations] = useState([]);

  // 🔐 Decode token (NOT conditional hook, this is fine)
  const token = localStorage.getItem("token");
  let user = null;
  try {
    if (token && token.split(".").length === 3) {
      user = jwtDecode(token);
    }
  } catch {
    user = null;
  }

  const isNgo = user && user.role === "ngo";

  // 🔁 Load donations assigned to this NGO
  const loadAssigned = async () => {
    if (!isNgo) return; // do nothing if not NGO
    try {
      const res = await api.get("/donation/assigned-to-me");
      setDonations(res.data);
    } catch {
      alert("Failed to load assigned donations");
    }
  };

  // ✅ Hook is ALWAYS called, no conditional return before this
  useEffect(() => {
    loadAssigned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // 📦 Update capacity
  const handleUpdateCapacity = async () => {
    if (!isNgo) {
      alert("Only NGOs can update capacity");
      return;
    }
    try {
      await api.post("/donation/ngo/update-capacity", {
        ngoId: user.ngoRef,
        newCapacity: Number(capacity)
      });
      alert("Capacity Updated");
    } catch {
      alert("Failed to update capacity");
    }
  };

  // 🚚 NGO requests pickup confirmation
  const requestPickup = async (donationId) => {
    if (!isNgo) {
      alert("Only NGOs can request pickup confirmation");
      return;
    }
    try {
      await api.post("/donation/ngo/request-pickup", { donationId });
      alert("Requested pickup confirmation!");
      loadAssigned();
    } catch {
      alert("Failed to request pickup");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      {!isNgo ? (
        <>
          <h2>Unauthorized Access</h2>
          <p>You must login as an NGO to view this page.</p>
        </>
      ) : (
        <>
          <h1>NGO Dashboard</h1>

          {/* ⭐ CAPACITY SECTION */}
          <h2>Update Storage Capacity</h2>
          <input
            placeholder="Available Capacity (kg)"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
          <br /><br />
          <button onClick={handleUpdateCapacity}>Update Capacity</button>

          {/* 🚚 ASSIGNED DONATIONS LIST */}
          <h2 style={{ marginTop: 40 }}>Assigned Donations</h2>

          {donations.length === 0 && <p>No donations assigned to you yet.</p>}

          {donations.map((d) => (
            <div
              key={d._id}
              style={{ marginTop: 20, padding: 10, border: "1px solid #ccc" }}
            >
              <p><b>Food:</b> {d.foodType} ({d.quantity} kg)</p>
              <p><b>Donor:</b> {d.donorId?.name || "Unknown"}</p>
              <p><b>Status:</b> {d.status}</p>

              {d.status === "Assigned" && (
                <button onClick={() => requestPickup(d._id)}>
                  Request Pickup Confirmation
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
