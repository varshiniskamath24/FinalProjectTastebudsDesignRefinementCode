import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Recommend from "./pages/Recommend";
import Donate from "./pages/Donate";
import RestaurantDetails from "./pages/RestaurantDetails";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Protected from "./Protected";

import NGODashboard from "./pages/NGODashboard";
import MyDonations from "./pages/MyDonations";
import { jwtDecode } from "jwt-decode";

export default function App() {
  const token = localStorage.getItem("token");
  let user = null;

  try {
    if (token && token.split(".").length === 3) {
      user = jwtDecode(token);
    }
  } catch {
    user = null;
  }

  return (
    <BrowserRouter>
      <Navbar />

      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* AUTO-REDIRECT BASED ON ROLE */}
        <Route
          path="/home"
          element={
            user?.role === "ngo" 
              ? <Navigate to="/ngo-dashboard" replace />
              : <Navigate to="/donate" replace />
          }
        />

        {/* DONOR ROUTES */}
        <Route path="/recommend" element={<Protected><Recommend /></Protected>} />
        <Route path="/donate" element={<Protected><Donate /></Protected>} />
        <Route path="/my-donations" element={<Protected><MyDonations /></Protected>} />

        {/* RESTAURANT / ORDER FLOW */}
        <Route path="/restaurant/:id" element={<Protected><RestaurantDetails /></Protected>} />
        <Route path="/checkout/:id" element={<Protected><Checkout /></Protected>} />
        <Route path="/orders" element={<Protected><Orders /></Protected>} />

        {/* NGO ROUTE */}
        <Route path="/ngo-dashboard" element={<Protected><NGODashboard /></Protected>} />
      </Routes>
    </BrowserRouter>
  );
}
