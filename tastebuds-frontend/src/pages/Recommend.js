// src/pages/Recommend.js
import React, { useState, useEffect } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Recommend() {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [loadingResults, setLoadingResults] = useState(false);
  const [message, setMessage] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function detectLocation() {
    setLocationMessage("");
    setLoadingLocation(true);

    if (!("geolocation" in navigator)) {
      setLocationMessage("Geolocation is not supported by your browser.");
      setLoadingLocation(false);
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((perm) => {
          if (perm.state === "denied") {
            setLocationMessage(
              "Location blocked — open lock icon → Site settings → Allow Location, then reload."
            );
            setLoadingLocation(false);
          } else {
            requestPosition();
          }
          perm.onchange = () => {
            if (perm.state === "granted") requestPosition();
          };
        })
        .catch(requestPosition);
    } else {
      requestPosition();
    }

    function requestPosition() {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(String(pos.coords.latitude));
          setLng(String(pos.coords.longitude));
          setLocationMessage("Using live location ✓");
          setLoadingLocation(false);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setLocationMessage(
              "Permission denied. Click the lock icon → Site settings → Allow Location and retry."
            );
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setLocationMessage("Position unavailable. Try again later.");
          } else if (err.code === err.TIMEOUT) {
            setLocationMessage("Location request timed out. Retry.");
          } else {
            setLocationMessage("Unable to fetch location. Retry.");
          }
          setLoadingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }

  // ---------- robust fetchRecommendations with clear error messages ----------
  const fetchRecommendations = async () => {
    setMessage("");
    setLoadingResults(true);
    setRestaurants([]);
    setDishes([]);

    try {
      const parsedLat = lat ? Number(lat) : undefined;
      const parsedLng = lng ? Number(lng) : undefined;

      // make the POST to the exact route your server exposes:
      // with API.baseURL = "http://localhost:5000" this becomes POST http://localhost:5000/api
      const res = await API.post("/api", { lat: parsedLat, lng: parsedLng });

      console.info("Recommend success response:", res);
      const data = res.data || {};

      if (Array.isArray(data)) {
        setRestaurants(data);
        setDishes([]);
        if (data.length === 0) setMessage("No recommendations found.");
      } else {
        setRestaurants(data.restaurants || []);
        setDishes(data.dishes || []);
        if ((data.restaurants || []).length === 0 && (data.dishes || []).length === 0) {
          setMessage("No recommendations found nearby.");
        }
      }
    } catch (err) {
      // log full error for debugging
      console.error("Recommend API error (full):", err);

      // prefer structured server message:
      // - if JSON: err.response.data.msg or err.response.data
      // - if HTML: err.response.data (string)
      // - fallback to err.message
      let userMsg = "Failed to load recommendations.";

      if (err && err.response) {
        const r = err.response;
        // r.data may be an object or string
        if (r.data) {
          if (typeof r.data === "string") {
            // server returned HTML or plain text
            userMsg = `Failed to load recommendations: ${r.data}`;
          } else if (typeof r.data === "object") {
            // JSON body
            // prefer common msg fields
            userMsg =
              r.data.msg ||
              r.data.message ||
              JSON.stringify(r.data, null, 2);
          } else {
            userMsg = String(r.data);
          }
        } else if (r.statusText) {
          userMsg = `Failed to load recommendations: ${r.statusText} (${r.status})`;
        } else {
          userMsg = `Failed to load recommendations: HTTP ${r.status}`;
        }
      } else if (err && err.request) {
        // request made, no response
        userMsg = "No response from server. Is backend running on port 5000?";
      } else if (err && err.message) {
        userMsg = err.message;
      }

      setMessage(userMsg);
    } finally {
      setLoadingResults(false);
    }
  };
  // ---------------------------------------------------------------------------

  // ---- styles (kept from your dark theme) ----
  const page = {
    minHeight: "70vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 16px",
    background: "linear-gradient(180deg, #0f1115 0%, #0b0c0f 100%)",
    color: "#eee",
  };

  const card = {
    width: "100%",
    maxWidth: 1100,
    background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
    borderRadius: 14,
    padding: 24,
    boxShadow: "0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.04)",
  };

  const title = { fontSize: 28, marginBottom: 12, color: "#fff", display: "flex", alignItems: "center", gap: 10 };
  const row = { display: "flex", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" };
  const input = {
    flex: "1 1 180px",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    color: "#fff",
    outline: "none",
    fontSize: 14,
  };
  const findButton = {
    background: "linear-gradient(90deg,#3b82f6,#5b21b6)",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  };
  const smallButton = {
    background: "transparent",
    color: "#ddd",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
  };
  const hint = {
    color:
      locationMessage.toLowerCase().includes("blocked") ||
      locationMessage.toLowerCase().includes("denied")
        ? "#ff7b7b"
        : "#7ee787",
    marginBottom: 12,
    fontSize: 14,
  };
  const sectionTitle = { color: "#fff", marginTop: 18, marginBottom: 8, fontSize: 18 };

  return (
    <div style={page}>
      <div style={card}>
        <div style={title}><span>Find Food</span> <span style={{ fontSize: 18 }}>🍽️</span></div>

        <div style={row}>
          <input style={input} value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude (auto-detected)" />
          <input style={input} value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude (auto-detected)" />

          <button style={findButton} onClick={fetchRecommendations} disabled={loadingLocation || loadingResults}>
            {loadingResults ? "Finding…" : "Find Recommendations"}
          </button>

          <button style={smallButton} onClick={() => detectLocation()} type="button">
            {loadingLocation ? "Detecting..." : "Detect / Retry"}
          </button>
        </div>

        {locationMessage && <div style={hint}>{locationMessage}</div>}
        {message && <div style={{ color: "#ffb3b3", marginBottom: 12, whiteSpace: "pre-wrap" }}>{message}</div>}

        <h3 style={sectionTitle}>Top Restaurants</h3>
        {restaurants.length === 0 ? (
          <div style={{ color: "#94a3b8", padding: "12px 8px" }}>No recommended restaurants yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {restaurants.map((r) => (
              <div key={String(r.restaurantId || r._id)} style={{ border: "1px solid rgba(255,255,255,0.03)", borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.01)" }}>
                <div style={{ padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 800, color: "#fff" }}>{r.name}</div>
                      <div style={{ color: "#bfc7d6", fontSize: 13 }}>{r.cuisine || ""}</div>
                      <div style={{ color: "#9aa3b3", fontSize: 13, marginTop: 8 }}>{r.explanation}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800 }}>{Math.round((r.score ?? 0) * 100)}%</div>
                      <div style={{ color: "#9ca3af", fontSize: 13 }}>{r.rating ?? "N/A"} ⭐</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <button onClick={() => (window.location.href = `/restaurant/${r.restaurantId || r._id}`)} style={{ padding: "8px 10px", borderRadius: 8, marginRight: 8 }}>Open</button>
                    <button onClick={() => alert("Follow/Save — implement")} style={{ padding: "8px 10px", borderRadius: 8 }}>Save</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <h3 style={sectionTitle}>Top Dishes</h3>
        {dishes.length === 0 ? (
          <div style={{ color: "#94a3b8", padding: "12px 8px" }}>No recommended dishes yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
            {dishes.map((d) => (
              <div key={`${d.restaurantId}-${d.itemId}`} style={{ display: "flex", border: "1px solid rgba(255,255,255,0.03)", borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.01)" }}>
                <img
  src={d.imageUrl || d.itemImage || d.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"}
  alt={d.itemName}
  style={{ width: 140, height: 100, objectFit: "cover", flexShrink: 0 }}
  onError={(e) => {
    e.target.onerror = null;
    e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";
  }}
/>
                <div style={{ padding: 12, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 800, color: "#fff" }}>{d.itemName}</div>
                    <div style={{ fontWeight: 800 }}>₹{d.itemPrice ?? "N/A"}</div>
                  </div>
                  <div style={{ color: "#bfc7d6", marginTop: 6 }}>{d.restaurantName}</div>
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontWeight: 800 }}>{(d.score * 100).toFixed(1)}%</span>
                    <span style={{ marginLeft: 8, color: "#9ca3af" }}>{d.reason?.explanation || ""}</span>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <button onClick={() => alert(`Add ${d.itemName} to cart — implement`)} style={{ padding: "8px 10px", marginRight: 8, borderRadius: 8 }}>Add</button>
                    <button onClick={() => (window.location.href = `/restaurant/${d.restaurantId}`)} style={{ padding: "8px 10px", borderRadius: 8 }}>Open Restaurant</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
