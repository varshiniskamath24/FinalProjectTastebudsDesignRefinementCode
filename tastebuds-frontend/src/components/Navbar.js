import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function Navbar() {
  const nav = useNavigate();
  let user = null;

  try {
    const token = localStorage.getItem("token");
    if (token) user = jwtDecode(token);
  } catch { user = null; }

  const logout = () => {
    localStorage.removeItem("token");
    nav("/login");
  };

  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      background: "#222", color: "white", padding: "10px 20px"
    }}>
      <div>
        <Link to="/recommend" style={{ marginRight: 20, color: "white" }}>Explore</Link>
        <Link to="/donate" style={{ marginRight: 20, color: "white" }}>Donate</Link>
        <Link to="/my-donations" style={{ marginRight: 20, color: "white" }}>My Donations</Link>
        {user?.role === "ngo" && (
          <Link to="/ngo-dashboard" style={{ marginRight: 20, color: "lightgreen" }}>
            NGO Dashboard
          </Link>
        )}

        <Link to="/orders" style={{ color: "white" }}>My Orders</Link>
      </div>

      <button onClick={logout} style={{ color: "white", background: "transparent" }}>
        Logout
      </button>
    </div>
  );
}
