import { useState, useEffect } from "react"
import { useAppContext } from "../../contexts/AppContext"
import ThemeToggle from "../ThemeToggle/ThemeToggle"
import "./Topbar.css"

const Topbar = () => {
  const { user, logout, notifications, stats, currentPage } = useAppContext()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleMobileMenuToggle = () => {
    // Dispatch a custom event that the sidebar can listen to
    window.dispatchEvent(new CustomEvent('mobileMenuToggle'))
  }

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout()
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h1 className="page-title">Admin Dashboard</h1>
        <div className="breadcrumb">
          <span>Home</span>
          <span className="separator">/</span>
          <span>{currentPage}</span>
        </div>
      </div>

      {isMobile && (
        <button className="mobile-menu-btn" onClick={handleMobileMenuToggle}>
          ☰
        </button>
      )}

      

        <div className="topbar-actions">
          <div className="notification-wrapper">
            <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
              <span className="notification-icon">🔔</span>
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="dropdown-header">
                  <h3>Notifications</h3>
                  <span className="notification-count">{unreadCount} new</span>
                </div>
                <div className="notification-list">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className="notification-item">
                        <div className="notification-content">
                          <p className="notification-title">{notification.title}</p>
                          <p className="notification-message">{notification.message}</p>
                          <span className="notification-time">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-notifications">
                      <p>No new notifications</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <ThemeToggle />

          <div className="profile-wrapper">
            <button className="profile-btn" onClick={() => setShowProfile(!showProfile)}>
              <div className="profile-avatar">
                <span>{user?.name?.charAt(0) || "A"}</span>
              </div>
              <div className="profile-info">
                <span className="profile-name">{user?.name || "Admin"}</span>
                <span className="profile-role">{user?.role || "Administrator"}</span>
              </div>
              <span className="dropdown-arrow">▼</span>
            </button>

            {showProfile && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <div className="profile-details">
                    <div className="profile-avatar large">
                      <span>{user?.name?.charAt(0) || "A"}</span>
                    </div>
                    <div>
                      <p className="profile-name">{user?.name || "Admin User"}</p>
                      <p className="profile-email">{user?.email || "admin@umrah.com"}</p>
                    </div>
                  </div>
                </div>
                <div className="dropdown-menu">
                  <hr className="menu-divider" />
                  <button className="menu-item logout" onClick={handleLogout}>
                    <span>🚪</span>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  )
}


export default Topbar
