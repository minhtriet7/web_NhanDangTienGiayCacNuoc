import { Link, useNavigate, useLocation } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem("username");

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <div className="sidebar">
      <div className="logo-box">
        <h1>🕵️ GIÁM ĐỊNH AI</h1>
        <p style={{ color: "#10b981", fontWeight: "bold" }}>
          👋 Xin chào, {username}
        </p>
      </div>

      <div className="nav-menu" style={{ flexDirection: "column" }}>
        <Link
          to="/"
          className={`nav-btn ${location.pathname === "/" ? "active" : ""}`}
          style={{ textDecoration: "none", textAlign: "center" }}
        >
          🔍 Giám Định
        </Link>
        <Link
          to="/history"
          className={`nav-btn ${location.pathname === "/history" ? "active" : ""}`}
          style={{
            textDecoration: "none",
            textAlign: "center",
            marginTop: "10px",
          }}
        >
          🗄️ Lịch Sử Dữ Liệu
        </Link>
      </div>

      <button
        onClick={handleLogout}
        style={{
          padding: "12px",
          marginTop: "auto",
          background: "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: "pointer",
          position: "absolute",
          bottom: "30px",
          left: "0",
          width: "calc(100% - 40px)",
          margin: "0 20px",
        }}
      >
        🚪 Đăng Xuất
      </button>
    </div>
  );
}

export default Sidebar;
