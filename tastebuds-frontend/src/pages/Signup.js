// src/pages/Signup.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Signup() {
  const nav = useNavigate();

  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
    taste: {
      spice: 3,
      sweet: 3,
      oil: 3,
      diet: "veg",
      cuisines: [],
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setField = (k, v) => setData((p) => ({ ...p, [k]: v }));
  const setTaste = (k, v) =>
    setData((p) => ({ ...p, taste: { ...p.taste, [k]: v } }));

  const handleCuisines = (raw) => {
    const arr = raw.split(",").map((s) => s.trim()).filter(Boolean);
    setTaste("cuisines", arr);
  };

  const signup = async () => {
    setError("");

    if (!data.name || !data.email || !data.password) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...data,
        email: data.email.trim().toLowerCase(),
      };

      const res = await api.post("/auth/signup", payload);
      if (res?.data?.token) {
        localStorage.setItem("token", res.data.token);
      }

      nav(data.role === "ngo" ? "/ngo-dashboard" : "/recommend");
    } catch (err) {
      const msg =
        err?.response?.data?.msg ||
        err?.message ||
        "Signup failed. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create your account</h2>

        <input
          placeholder="Full name"
          value={data.name}
          onChange={(e) => setField("name", e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Email"
          value={data.email}
          onChange={(e) => setField("email", e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={data.password}
          onChange={(e) => setField("password", e.target.value)}
          style={styles.input}
        />

        <select
          value={data.role}
          onChange={(e) => setField("role", e.target.value)}
          style={styles.input}
        >
          <option value="customer">Customer</option>
          <option value="ngo">NGO (Food Provider)</option>
        </select>

        {data.role === "customer" && (
          <div style={styles.tasteBox}>
            <h4 style={styles.subTitle}>Taste profile</h4>

            <label style={styles.label}>Spice ({data.taste.spice})</label>
            <input
              type="range"
              min="0"
              max="10"
              value={data.taste.spice}
              onChange={(e) => setTaste("spice", Number(e.target.value))}
              style={styles.slider}
            />

            <label style={styles.label}>Sweet ({data.taste.sweet})</label>
            <input
              type="range"
              min="0"
              max="10"
              value={data.taste.sweet}
              onChange={(e) => setTaste("sweet", Number(e.target.value))}
              style={styles.slider}
            />

            <label style={styles.label}>Oil ({data.taste.oil})</label>
            <input
              type="range"
              min="0"
              max="10"
              value={data.taste.oil}
              onChange={(e) => setTaste("oil", Number(e.target.value))}
              style={styles.slider}
            />

            <label style={styles.label}>Diet</label>
            <select
              value={data.taste.diet}
              onChange={(e) => setTaste("diet", e.target.value)}
              style={styles.input}
            >
              <option value="veg">Veg</option>
              <option value="non-veg">Non Veg</option>
              <option value="vegan">Vegan</option>
            </select>

            <input
              placeholder="Favorite cuisines (comma separated)"
              onChange={(e) => handleCuisines(e.target.value)}
              style={styles.input}
            />
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        <button onClick={signup} disabled={loading} style={styles.button}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff6f2",
    padding: 20,
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    width: 420,
    padding: 30,
    borderRadius: 12,
    background: "white",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
    fontSize: 24,
    fontWeight: 700,
    color: "#222",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: 14,
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  tasteBox: {
    padding: 15,
    borderRadius: 10,
    background: "#fff7ed",
    border: "1px solid #ffedd5",
    marginTop: 10,
  },
  subTitle: {
    marginBottom: 10,
    fontSize: 15,
    fontWeight: 700,
    color: "#92400e",
  },
  label: {
    fontSize: 13,
    marginTop: 10,
    marginBottom: 4,
    color: "#374151",
  },
  slider: {
    width: "100%",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#ff6c52",
    border: "none",
    color: "white",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 10,
  },
  error: {
    color: "red",
    marginBottom: 12,
    fontSize: 13,
    textAlign: "center",
  },
};
