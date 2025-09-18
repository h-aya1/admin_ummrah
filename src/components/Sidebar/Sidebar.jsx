import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import "./Sidebar.css";

function Sidebar() {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const { logout } = useApp();

  const items = [
    { to: "/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/dua", label: "Duas", icon: "📜" },
    { to: "/umrah-guides", label: "Guides", icon: "📘" },
    { to: "/visit-places", label: "Places", icon: "📍" },
    { to: "/manage-groups", label: "Groups", icon: "👥" },
    { to: "/live-map", label: "Live Map", icon: "🗺️" },
    { to: "/chat", label: "Chat", icon: "💬" },
    { to: "/notifications", label: "Notifications", icon: "🔔" },
    { to: "/settings", label: "Settings", icon: "⚙️" },
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  return (
    <div className={`sidebar ${open ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={() => setOpen(!open)}>
          ☰
        </button>
        {open && <h3>Umrah Admin</h3>}
      </div>
      <nav>
        <ul>
          {items.map((it) => (
            <li key={it.to}>
              <Link 
                className={location.pathname === it.to ? "active" : ""} 
                to={it.to}
                title={it.label}
              >
                <span className="icon" aria-hidden>{it.icon}</span>
                {open && <span className="label">{it.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <span className="icon">🚪</span>
          {open && <span className="label">Logout</span>}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
