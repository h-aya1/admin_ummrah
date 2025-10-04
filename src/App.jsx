import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useEffect } from "react"
import { useAppContext } from "./contexts/AppContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import Sidebar from "./components/Sidebar/Sidebar"
import Topbar from "./components/Topbar/Topbar"
import Login from "./pages/Login/Login"
import Dashboard from "./pages/Dashboard/dashboard"
import Chat from "./pages/Chat/chat"
import Dua from "./pages/Dua/dua"
import LiveMap from "./pages/LiveMap/liveMap"
import ManageGroups from "./pages/ManageGroups/manageGroups"
import Notifications from "./pages/Notifications/Notifications"
import UmrahGuides from "./pages/UmrahGuides/umrahGuides"
import VisitPlaces from "./pages/VisitPlaces/visitPlaces"
import "./App.css"

const AppContent = () => {
  const { updateCurrentPage, sidebarCollapsed } = useAppContext()
  const location = useLocation()

  useEffect(() => {
    // Map route paths to page names
    const routeToPageName = {
      '/dashboard': 'Dashboard',
      '/chat': 'Chat',
      '/dua': 'Dua Library',
      '/live-map': 'Live Map',
      '/manage-groups': 'Manage Groups',
      '/notifications': 'Notifications',
      '/umrah-guides': 'Umrah Guides',
      '/visit-places': 'Visit Places'
    }

    const currentPath = location.pathname
    const pageName = routeToPageName[currentPath] || 'Dashboard'
    updateCurrentPage(pageName)
  }, [location, updateCurrentPage])

  return (
    <div className="app">
      <Sidebar />
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/dua" element={<Dua />} />
            <Route path="/live-map" element={<LiveMap />} />
            <Route path="/manage-groups" element={<ManageGroups />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/umrah-guides" element={<UmrahGuides />} />
            <Route path="/visit-places" element={<VisitPlaces />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

function App() {
  const { isAuthenticated } = useAppContext()

  return (
    <Router>
      <ThemeProvider>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/*" element={isAuthenticated ? <AppContent /> : <Navigate to="/login" replace />} />
        </Routes>
      </ThemeProvider>
    </Router>
  )
}

export default App
