
import { useState, useEffect, useCallback } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import { locationAPI } from "../../services/api"
import { useAppContext } from "../../contexts/AppContext"
import { useTheme } from "../../contexts/ThemeContext"
import { motion } from "framer-motion"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "./liveMap.css"

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons
const createCustomIcon = (status) => {
  const colors = {
    active: '#10b981', // green
    inactive: '#6b7280', // gray
    new: '#3b82f6', // blue
  }

  return L.divIcon({
    html: `
      <div style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${colors[status]};
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        animation: ${status === 'active' ? 'pulse 2s infinite' : 'none'};
      "></div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
    `,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

const MapController = ({ center }) => {
  const map = useMap()

  useEffect(() => {
    if (center) {
      map.setView(center, 10)
    }
  }, [center, map])

  return null
}

const LiveMap = () => {
  const { users, groups, addActivity } = useAppContext()
  const { theme } = useTheme()
  const [userLocations, setUserLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mapCenter, setMapCenter] = useState([21.4225, 39.8262]) // Default to Mecca
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Calculate user status based on lastSeenAt
  const calculateUserStatus = useCallback((lastSeenAt) => {
    if (!lastSeenAt) return 'inactive'

    const now = new Date()
    const lastSeen = new Date(lastSeenAt)
    const minutesDiff = (now - lastSeen) / (1000 * 60)

    if (minutesDiff <= 30) return 'active'
    if (minutesDiff <= 1440) return 'inactive' // 24 hours
    return 'new' // More than 24 hours, treat as new
  }, [])

  // Fetch user locations
  const fetchUserLocations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const locations = await locationAPI.getAllUserLocations()

      // Enhance locations with user data and status
      const enhancedLocations = locations.map(location => {
        const user = users.find(u => u.id === location.userId)
        const status = calculateUserStatus(location.lastSeenAt)

        return {
          ...location,
          status,
          userName: user?.name || location.name,
          groupName: groups.find(g => g.id === location.groupId)?.name || 'Unknown Group',
          avatar: user?.avatar,
          phone: user?.phone,
        }
      })

      setUserLocations(enhancedLocations)
      setLastUpdate(new Date())

      addActivity({
        type: "location_update",
        message: `Updated live map with ${enhancedLocations.length} user locations`,
        icon: "🗺️",
      })
    } catch (err) {
      setError(err.message || 'Failed to fetch user locations')
      console.error('Error fetching user locations:', err)
    } finally {
      setLoading(false)
    }
  }, [users, groups, calculateUserStatus, addActivity])

  // Initial load and auto-refresh
  useEffect(() => {
    fetchUserLocations()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchUserLocations, 30000)

    return () => clearInterval(interval)
  }, [fetchUserLocations])

  // Calculate stats
  const stats = {
    totalPilgrims: userLocations.length,
  }

  // Center map on user
  const centerOnUser = (location) => {
    setMapCenter([location.latitude, location.longitude])
  }

  if (loading && userLocations.length === 0) {
    return (
      <div className="live-map-loading">
        <div className="loading-spinner"></div>
        <p>Loading live map...</p>
      </div>
    )
  }

  return (
    <motion.div
      className={`live-map ${theme}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="live-map-header">
        <div className="header-content">
          <h1>Live Map</h1>
          <p>Real-time location tracking of pilgrims</p>
          <div className="last-update">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="live-map-content">
        {/* Sidebar with filters and stats */}
        <motion.div
          className="live-map-sidebar"
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          {/* Stats Cards */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon">🕋</div>
              <div className="stat-content">
                <h3>{stats.totalPilgrims}</h3>
                <p>Total Pilgrims</p>
              </div>
            </div>
          </div>

          {/* User Activity Table */}
          <div className="user-activity">
            <h3>Pilgrim Activity</h3>
            <div className="activity-list">
              {userLocations.slice(0, 10).map(location => (
                <div
                  key={location.userId}
                  className={`activity-item ${location.status}`}
                  onClick={() => centerOnUser(location)}
                >
                  <div className="user-avatar">
                    {location.avatar ? (
                      <img src={location.avatar} alt={location.userName} />
                    ) : (
                      <div className="default-avatar">
                        {location.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="user-info">
                    <p className="user-name">{location.userName}</p>
                    <p className="user-group">{location.groupName}</p>
                    <p className="user-status">{location.status}</p>
                  </div>
                  <div className="user-actions">
                    <button
                      className="center-btn"
                      title="Center on pilgrim"
                    >
                      🎯
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Map Container */}
        <div className="map-container">
          {error && (
            <div className="map-error">
              <p>⚠️ {error}</p>
              <button onClick={fetchUserLocations}>Retry</button>
            </div>
          )}

          <MapContainer
            center={mapCenter}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController center={mapCenter} />

            {userLocations.map(location => (
              location.latitude && location.longitude && (
                <Marker
                  key={location.userId}
                  position={[location.latitude, location.longitude]}
                  icon={createCustomIcon(location.status)}
                >
                  <Popup>
                    <div className="user-popup">
                      <h4>{location.userName}</h4>
                      <p><strong>Group:</strong> {location.groupName}</p>
                      <p><strong>Status:</strong>
                        <span className={`status-badge ${location.status}`}>
                          {location.status}
                        </span>
                      </p>
                      <p><strong>Last Seen:</strong> {
                        location.lastSeenAt
                          ? new Date(location.lastSeenAt).toLocaleString()
                          : 'Unknown'
                      }</p>
                      {location.phone && (
                        <p><strong>Phone:</strong> {location.phone}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>

          {loading && (
            <div className="map-loading-overlay">
              <div className="loading-spinner"></div>
              <p>Updating locations...</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default LiveMap
