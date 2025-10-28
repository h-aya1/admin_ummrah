import { useState, useEffect, useRef } from "react"
import { useAppContext } from "../../contexts/AppContext"
import ThemeToggle from "../ThemeToggle/ThemeToggle"
import "./Topbar.css"

const Topbar = () => {
  const { user, logout, currentPage } = useAppContext()
  const [showProfile, setShowProfile] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const profileRef = useRef(null)

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false)
      }
    }

    if (showProfile) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfile])

  const handleMobileMenuToggle = () => {
    // Dispatch a custom event that the sidebar can listen to
    window.dispatchEvent(new CustomEvent('mobileMenuToggle'))
  }

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout()
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        {isMobile && (
          <button className="mobile-menu-btn" onClick={handleMobileMenuToggle} aria-label="Toggle navigation">
            ☰
          </button>
        )}
        <div className="page-info">
          <h1 className="page-title">Admin Dashboard</h1>
          <div className="breadcrumb" aria-label="Breadcrumb">
            <span>Home</span>
            <span className="separator">/</span>
            <span>{currentPage}</span>
          </div>
        </div>
      </div>

      <div className="topbar-actions">
        <ThemeToggle />

        <div className="profile-wrapper" ref={profileRef}>
          <button className="profile-btn" onClick={() => setShowProfile(!showProfile)} aria-haspopup="menu" aria-expanded={showProfile}>
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
            <div className="profile-dropdown" role="menu">
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
    </header>
  )
}


export default Topbar
