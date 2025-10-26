import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useAppContext } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';
import L from 'leaflet';
import io from 'socket.io-client'; // ADDED: For real-time
import axios from 'axios'; // ADDED: For initial fetch

import 'leaflet/dist/leaflet.css';
import './liveMap.css';

// --- CONFIGURATION ---
const API_BASE_URL = 'http://69.62.109.18:3001'; // Your backend URL

// --- ASSET IMPORTS ---
// Correct way to fix default Leaflet icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom marker icons (from your UI-focused component - this is great!)
const createCustomIcon = (status) => {
  const colors = {
    active: '#10b981', // green
    inactive: '#6b7280', // gray
  };

  return L.divIcon({
    html: `
      <div style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${colors[status] || colors.inactive};
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
  });
};

// MapController to smoothly move the map view
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13); // Use flyTo for a smoother animation
    }
  }, [center, map]);
  return null;
};

const LiveMap = () => {
  // CORRECTED: Added authToken which is critical for the API/WebSocket
  const { users, groups, addActivity, authToken } = useAppContext();
  const { theme } = useTheme();
  
  // CORRECTED: Use an object for efficient O(1) updates from WebSocket
  const [userLocations, setUserLocations] = useState({}); 
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([21.4225, 39.8262]); // Default to Mecca
  const socketRef = useRef(null);

  // Simplified status logic to match the two-color custom icon
  const calculateUserStatus = useCallback((lastSeenAt) => {
    if (!lastSeenAt) return 'inactive';
    const minutesDiff = (new Date() - new Date(lastSeenAt)) / (1000 * 60);
    return minutesDiff <= 5 ? 'active' : 'inactive'; // Active if seen in the last 5 minutes
  }, []);

  // Central function to enrich raw location data with user details
  const enrichLocationData = useCallback((location) => {
      const user = users.find(u => u.id === location.userId);
      const status = calculateUserStatus(location.lastSeenAt);
      return {
        ...location,
        status,
        userName: user?.name || location.name || 'Unknown User',
        groupName: groups.find(g => g.id === user?.groupId)?.name || 'No Group',
        avatar: user?.avatar,
        phone: user?.phone,
      };
  }, [users, groups, calculateUserStatus]);


  // THE CORE LOGIC: Replaces polling with a real-time WebSocket connection
  useEffect(() => {
    // Abort if the user isn't authenticated yet
    if (!authToken) {
      setError("Authentication token not found. Please log in.");
      setLoading(false);
      return;
    }

    // 1. Fetch initial locations via REST API once
    const fetchInitialLocations = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/location/all-users`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        // Convert array to an efficient object map for fast updates
        const locationsMap = response.data.reduce((acc, loc) => {
          if (loc.latitude && loc.longitude) {
            acc[loc.userId] = enrichLocationData(loc);
          }
          return acc;
        }, {});

        setUserLocations(locationsMap);
        setError(null);
        addActivity({
          type: "location_update",
          message: `Loaded live map with ${Object.keys(locationsMap).length} user locations`,
          icon: "🗺️",
        });
      } catch (err) {
        console.error("Failed to fetch initial locations:", err);
        setError(err.response?.data?.message || "Could not fetch initial locations.");
      } finally {
        setLoading(false);
      }
    };

    // 2. Connect to WebSocket for live updates
    const setupWebSocket = () => {
      const socketUrl = `${API_BASE_URL}/location`;
      socketRef.current = io(socketUrl, { auth: { token: authToken } });

      socketRef.current.on('connect', () => {
        console.log('Successfully connected to WebSocket for live locations.');
        setError(null);
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('WebSocket connection error:', err.message);
        setError('Failed to connect to the real-time location service.');
      });

      // Listen for 'locationUpdated' events from the server
      socketRef.current.on('locationUpdated', (update) => {
        console.log('Received real-time location update:', update);
        if (update.latitude && update.longitude) {
          const enrichedUpdate = enrichLocationData(update);
          // Efficiently update or add the user's location in our state object
          setUserLocations(prevLocations => ({
            ...prevLocations,
            [update.userId]: enrichedUpdate,
          }));
        }
      });
    };

    fetchInitialLocations();
    setupWebSocket();

    // 3. Cleanup: Disconnect the socket when the component unmounts
    return () => {
      if (socketRef.current) {
        console.log('Disconnecting WebSocket.');
        socketRef.current.disconnect();
      }
    };
  }, [authToken, addActivity, enrichLocationData]); 
  
  const centerOnUser = (location) => {
    setMapCenter([location.latitude, location.longitude]);
  };

  // Convert the locations object into an array for rendering
  const locations = Object.values(userLocations);

  if (loading && locations.length === 0) {
    return (
      <div className="live-map-loading">
        <div className="loading-spinner"></div>
        <p>Loading live map...</p>
      </div>
    );
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
            {locations.length} Pilgrims Visible
          </div>
        </div>
      </div>

      <div className="live-map-content">
        <motion.div
          className="live-map-sidebar"
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <div className="user-activity">
            <h3>Pilgrim Activity</h3>
            <div className="activity-list">
              {locations
                // Sort by most recently seen first
                .sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt))
                .map(location => (
                <div key={location.userId} className={`activity-item ${location.status}`} onClick={() => centerOnUser(location)}>
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
                    <p className="user-status">{new Date(location.lastSeenAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="user-actions">
                    <button className="center-btn" title="Center on pilgrim">🎯</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="map-container">
          {error && <div className="map-error">⚠️ {error}</div>}
          <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
            <MapController center={mapCenter} />
            {locations.map(loc => (
              loc.latitude && loc.longitude && (
                <Marker key={loc.userId} position={[loc.latitude, loc.longitude]} icon={createCustomIcon(loc.status)}>
                  <Popup>
                    <div className="user-popup">
                      <h4>{loc.userName}</h4>
                      <p><strong>Group:</strong> {loc.groupName}</p>
                      <p><strong>Status:</strong> <span className={`status-badge ${loc.status}`}>{loc.status}</span></p>
                      <p><strong>Last Seen:</strong> {new Date(loc.lastSeenAt).toLocaleString()}</p>
                      {loc.phone && <p><strong>Phone:</strong> {loc.phone}</p>}
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default LiveMap;