import React from "react";
import { useApp } from "../../contexts/AppContext";
import "./Topbar.css";

function Topbar({ title }) {
  const { user, theme, setTheme, notifications } = useApp();
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h1>{title}</h1>
      </div>
      
      <div className="topbar-right">
        <div className="notifications">
          <button className="notification-btn" title="Notifications">
            🔔
            {unreadNotifications > 0 && (
              <span className="notification-badge">{unreadNotifications}</span>
            )}
          </button>
        </div>
        
        <div className="user-info">
          <span className="user-name">{user?.name || "Admin"}</span>
          <span className="user-role">{user?.role || "Administrator"}</span>
        </div>
        
        <button 
          className="theme-toggle" 
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>
    </div>
  );
}

export default Topbar;
