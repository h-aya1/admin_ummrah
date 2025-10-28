"use client"
import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAppContext } from "../../contexts/AppContext"
import "./Sidebar.css"
import HanimLogo from "../../assets/Hanim Tour & Travel Logo Small size.png"

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

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  useEffect(() => {
    const handleMobileMenuToggle = () => {
      setMobileOpen((prev) => (isMobile ? !prev : prev))
    }

    window.addEventListener('mobileMenuToggle', handleMobileMenuToggle)

    return () => {
      window.removeEventListener('mobileMenuToggle', handleMobileMenuToggle)
    }
  }, [isMobile])

  useEffect(() => {
    if (!isMobile && mobileOpen) {
      setMobileOpen(false)
    }
  }, [isMobile, mobileOpen])

  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = mobileOpen ? 'hidden' : ''
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen, isMobile])

  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false)
    }
  }, [location.pathname, isMobile])

  const handleToggle = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev)
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
      {isMobile && (
        <div
          className={`mobile-overlay ${mobileOpen ? 'active' : ''}`}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={`sidebar ${sidebarCollapsed && !isMobile ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
        aria-hidden={isMobile && !mobileOpen}
      >
        <div className="sidebar-header">
          <div className="logo">
            <img src={HanimLogo} alt="Hanim Tour & Travel" className="logo-image" style={{ height: '50px' }} />
            {(!sidebarCollapsed || isMobile) && (
              <div className="logo-text">
                <h2>Hanim</h2>
                <p>Tour & Travel</p>
              </div>
            )}
          </div>
          <button
            className="toggle-btn"
            onClick={handleToggle}
            aria-label={isMobile ? (mobileOpen ? 'Close navigation' : 'Open navigation') : sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={isMobile ? mobileOpen : !sidebarCollapsed}
          >
            {isMobile ? (mobileOpen ? '✕' : '☰') : (sidebarCollapsed ? "→" : "←")}
          </button>
        </div>

      <nav className="sidebar-nav" role="navigation">
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
            <p className="footer-text">Hanim Tour & Travel</p>
            <p className="footer-subtext">© 2025 All Rights Reserved</p>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

export default Sidebar
