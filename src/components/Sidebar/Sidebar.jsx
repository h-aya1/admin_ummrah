"use client"
import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAppContext } from "../../contexts/AppContext"
import "./Sidebar.css"

const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar } = useAppContext()
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    // Listen for mobile menu toggle from topbar
    const handleMobileMenuToggle = () => {
      if (isMobile) {
        setMobileOpen(!mobileOpen)
      }
    }

    window.addEventListener('mobileMenuToggle', handleMobileMenuToggle)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('mobileMenuToggle', handleMobileMenuToggle)
    }
  }, [isMobile, mobileOpen])

  const handleToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen)
    } else {
      toggleSidebar()
    }
  }

  const handleNavClick = () => {
    // Close mobile sidebar when navigation item is clicked
    if (isMobile && mobileOpen) {
      setMobileOpen(false)
    }
  }

  const menuItems = [
    {
      path: "/dashboard",
      icon: "📊",
      label: "Dashboard",
      description: "Overview & Analytics",
    },
    {
      path: "/manage-groups",
      icon: "👥",
      label: "Manage Groups",
      description: "Pilgrim Groups",
    },
    {
      path: "/live-map",
      icon: "🗺️",
      label: "Live Map",
      description: "Location Tracking",
    },
    {
      path: "/chat",
      icon: "💬",
      label: "Chat Monitor",
      description: "Group Communications",
    },
    {
      path: "/dua",
      icon: "🤲",
      label: "Duas",
      description: "Prayer Management",
    },
    {
      path: "/umrah-guides",
      icon: "📖",
      label: "Umrah Guides",
      description: "Step-by-Step Guides",
    },
    {
      path: "/visit-places",
      icon: "🕌",
      label: "Visit Places",
      description: "Sacred Locations",
    },
    {
      path: "/notifications",
      icon: "🔔",
      label: "Notifications",
      description: "Alerts & Messages",
    },
  ]

  return (
    <>
      {isMobile && mobileOpen && (
        <div
          className="mobile-overlay active"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className={`sidebar ${sidebarCollapsed && !isMobile ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🕋</span>
            {(!sidebarCollapsed || isMobile) && (
              <div className="logo-text">
                <h2>Umrah Admin</h2>
                <p>Management Portal</p>
              </div>
            )}
          </div>
          <button className="toggle-btn" onClick={handleToggle}>
            {isMobile ? (mobileOpen ? '✕' : '☰') : (sidebarCollapsed ? "→" : "←")}
          </button>
        </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            title={sidebarCollapsed ? item.label : ""}
            onClick={handleNavClick}
          >
            <span className="nav-icon">{item.icon}</span>
            {!sidebarCollapsed && (
              <div className="nav-content">
                <span className="nav-label">{item.label}</span>
                <span className="nav-description">{item.description}</span>
              </div>
            )}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!sidebarCollapsed && !isMobile && (
          <div className="footer-content">
            <p className="footer-text">Umrah Guide Admin v1.0</p>
            <p className="footer-subtext">Spiritual Travel Management</p>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

export default Sidebar
