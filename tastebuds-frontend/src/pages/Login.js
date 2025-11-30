// src/pages/Login.js
import React, { useState } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    if (!email || !password) {
      setErr("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      nav("/recommend");
    } catch (e) {
      setErr("Invalid Credentials");
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>

        <input
          placeholder="Email or username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        {err && <div style={styles.error}>{err}</div>}

        <button onClick={submit} disabled={loading} style={styles.button}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={styles.footerText}>
          No account? <Link to="/signup" style={styles.link}>Signup</Link>
        </p>
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
    width: 350,
    padding: 28,
    borderRadius: 12,
    background: "white",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  title: {
    marginBottom: 22,
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
  },
  error: {
    color: "red",
    marginBottom: 12,
    fontSize: 13,
  },
  button: {
    width: "100%",
    padding: "12px",
    borderRadius: 8,
    border: "none",
    background: "#ff6c52",
    color: "white",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    marginTop: 6,
  },
  footerText: {
    marginTop: 16,
    fontSize: 14,
    color: "#555",
  },
  link: {
    color: "#ff6c52",
    fontWeight: 600,
    textDecoration: "none",
  },
};
