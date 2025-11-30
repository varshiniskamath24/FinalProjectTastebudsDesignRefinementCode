import React, { useState, useEffect } from "react";
import API from "../api/api";

export default function Donate() {
  const [foodType, setFoodType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [preparedAt, setPreparedAt] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [message, setMessage] = useState("");
  const [explanation, setExplanation] = useState("");
  const [permState, setPermState] = useState(null); // "granted" | "prompt" | "denied" | null

  useEffect(() => {
    // on mount, attempt to get permission state & location
    checkAndRequestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function checkAndRequestLocation() {
    setMessage("");
    setExplanation("");
    setLoadingLocation(true);

    if (!("geolocation" in navigator)) {
      setMessage("Geolocation is not supported by your browser.");
      setLoadingLocation(false);
      return;
    }

    // If permissions API exists, query first
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          setPermState(result.state);
          if (result.state === "denied") {
            setMessage(
              "Location permission is blocked. Click the lock icon in the address bar → Site settings → Allow Location, then reload."
            );
            setLoadingLocation(false);
          } else {
            // if prompt or granted, request position (this will either prompt or succeed)
            requestPosition();
          }

          // listen for changes (user may update permission from UI)
          result.onchange = () => {
            setPermState(result.state);
            if (result.state === "granted") requestPosition();
          };
        })
        .catch(() => {
          // permissions API not available — fallback to direct request
          requestPosition();
        });
    } else {
      // No permissions API — go straight to request
      requestPosition();
    }
  }

  function requestPosition() {
    if (!navigator.geolocation) {
      setMessage("Geolocation not supported.");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setMessage("");
        setLoadingLocation(false);
      },
      (err) => {
        // Map codes to messages
        if (err.code === err.PERMISSION_DENIED) {
          setMessage(
            "Permission denied. Please allow location access (click the lock icon → Site settings → Allow Location) and retry."
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setMessage("Position unavailable. Try again or check device location services.");
        } else if (err.code === err.TIMEOUT) {
          setMessage("Location request timed out. Please retry.");
        } else {
          setMessage("Unable to fetch your location. Try again.");
        }
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setExplanation("");

    if (!lat || !lng) {
      setMessage("Location not available. Please allow location access and retry.");
      return;
    }
    if (!foodType || !quantity || !preparedAt) {
      setMessage("Please fill all the fields.");
      return;
    }

    try {
      const res = await API.post("/donation/donate", {
        foodType,
        quantity: Number(quantity),
        preparedAt,
        lat,
        lng
      });

      if (res.data.escalate) {
        setMessage(res.data.msg || "No suitable NGO found. Escalation triggered.");
        setExplanation("");
      } else {
        if (res.data.assignedTo) {
          setMessage(`Donation assigned to: ${res.data.assignedTo}`);
        } else {
          setMessage(res.data.msg || "Donation Assigned Successfully");
        }
        if (res.data.explain) {
          setExplanation(`Reason: ${res.data.explain}`);
        }
      }
    } catch (err) {
      console.error(err);
      setMessage("Error while submitting donation");
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "20px auto", padding: 10 }}>
      <h2>Donate Surplus Food</h2>

      {loadingLocation && <p>Detecting your location…</p>}

      {!loadingLocation && lat && lng && (
        <p style={{ fontSize: "0.9rem" }}>
          Location detected ✓ (lat: {lat.toFixed(6)}, lng: {lng.toFixed(6)})
        </p>
      )}

      {!loadingLocation && (!lat || !lng) && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ color: "crimson", fontWeight: "600" }}>
            {message || "Location not available. Please allow location access."}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => checkAndRequestLocation()}
              style={{ padding: "8px 12px" }}
            >
              Retry / Allow Location
            </button>
            <button
              type="button"
              onClick={() => {
                // helpful hint: open site settings instructions
                window.alert(
                  "If you previously blocked location, open the lock icon in the address bar → Site settings → Allow Location, then reload this page."
                );
              }}
              style={{ padding: "8px 12px" }}
            >
              How to allow
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        <input
          type="text"
          placeholder="Food Type (e.g., Rice, Sweets)"
          value={foodType}
          onChange={(e) => setFoodType(e.target.value)}
        />

        <input
          type="number"
          placeholder="Quantity (kg)"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />

        <label style={{ fontSize: "0.9rem" }}>
          Prepared At:
          <input
            type="datetime-local"
            value={preparedAt}
            onChange={(e) => setPreparedAt(e.target.value)}
            style={{ display: "block", marginTop: 6 }}
          />
        </label>

        <button type="submit" style={{ padding: "10px 12px" }}>
          Submit Donation
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 15, fontWeight: "bold" }}>{message}</p>
      )}

      {explanation && (
        <p style={{ marginTop: 5, fontSize: "0.9rem" }}>{explanation}</p>
      )}
    </div>
  );
}
