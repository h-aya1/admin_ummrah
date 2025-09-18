import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppProvider, useApp } from "./contexts/AppContext";
import Sidebar from "./components/Sidebar/Sidebar";
import Topbar from "./components/Topbar/Topbar";

import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Login/Login";
import Dua from "./pages/Dua/dua";
import UmrahGuides from "./pages/UmrahGuides/umrahGuides";
import VisitPlaces from "./pages/VisitPlaces/visitPlaces";
import ManageGroups from "./pages/ManageGroups/manageGroups";
import LiveMap from "./pages/LiveMap/liveMap";
import Chat from "./pages/Chat/chat";
import Notifications from "./pages/Notifications/Notifications";
import Settings from "./pages/Settings/Settings";

import "./App.css";

function AppContent() {
  const { isAuthenticated, loading } = useApp();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        {isAuthenticated && <Sidebar />}
        <div className="main">
          {isAuthenticated && <Topbar title="Umrah Admin Dashboard" />}
          <div className="content">
            <Routes>
              <Route 
                path="/login" 
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
              />
              <Route 
                path="/" 
                element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/dashboard" 
                element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/dua" 
                element={isAuthenticated ? <Dua /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/umrah-guides" 
                element={isAuthenticated ? <UmrahGuides /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/visit-places" 
                element={isAuthenticated ? <VisitPlaces /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/manage-groups" 
                element={isAuthenticated ? <ManageGroups /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/live-map" 
                element={isAuthenticated ? <LiveMap /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/chat" 
                element={isAuthenticated ? <Chat /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/notifications" 
                element={isAuthenticated ? <Notifications /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/settings" 
                element={isAuthenticated ? <Settings /> : <Navigate to="/login" replace />} 
              />
            </Routes>
          </div>
        </div>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--card)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            },
          }}
        />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
