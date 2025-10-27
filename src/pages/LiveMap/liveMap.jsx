import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useAppContext } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import io from 'socket.io-client';
import axios from 'axios';

import 'leaflet/dist/leaflet.css';
import './liveMap.css';

// --- CONFIGURATION ---
const API_BASE_URL = 'http://69.62.109.18:3001';

// --- ASSET IMPORTS ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// --- ENHANCED COLOR PALETTE ---
const GROUP_COLORS = [
  '#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', 
  '#ef4444', '#f59e0b', '#14b8a6', '#6366f1', '#d946ef',
  '#06b6d4', '#84cc16', '#f43f5e', '#a855f7', '#eab308'
];

const getGroupColor = (groupId) => {
  if (!groupId) return '#6b7280';
  return GROUP_COLORS[groupId % GROUP_COLORS.length];
};

// --- ENHANCED Custom marker icons with animations ---
const createCustomIcon = (status, color, userName = 'User') => {
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  return L.divIcon({
    html: `
      <div class="advanced-marker" style="--marker-color: ${color}">
        <div class="marker-pulse ${status === 'active' ? 'pulsing' : ''}"></div>
        <div class="marker-core">
          <div class="marker-avatar">${initials}</div>
        </div>
        <div class="marker-glow"></div>
      </div>
    `,
    className: `custom-marker ${status}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// --- MAP STYLES CONFIGURATION ---
const MAP_STYLES = {
  standard: {
    name: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  detailed: {
    name: 'Detailed',
    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  cyclosm: {
    name: 'CyclOSM',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://github.com/cyclosm/cyclosm-cartocss-style">CyclOSM</a>'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
  },
  topo: {
    name: 'Topographic',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
  }
};

// --- ENHANCED Map Controller ---
const MapController = ({ center, bounds, selectedGroupId }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.flyToBounds(bounds, { 
        padding: [50, 50],
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [bounds, map]);
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, {
        duration: 1,
        easeLinearity: 0.25
      });
    }
  }, [center, map]);

  // Smooth theme transition for map
  useEffect(() => {
    const container = map.getContainer();
    container.style.transition = 'filter 0.5s ease';
    container.style.filter = selectedGroupId ? 'hue-rotate(15deg) saturate(1.1)' : 'none';
  }, [selectedGroupId, map]);

  return null;
};

// --- Map Style Switcher Component ---
const MapStyleSwitcher = ({ currentStyle, onStyleChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div 
      className="map-style-switcher"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 }}
    >
      <button 
        className="style-switcher-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Change map style"
      >
        <span className="map-icon">🗺️</span>
        <span className="current-style">{MAP_STYLES[currentStyle].name}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="style-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {Object.entries(MAP_STYLES).map(([key, style]) => (
              <button
                key={key}
                className={`style-option ${currentStyle === key ? 'active' : ''}`}
                onClick={() => {
                  onStyleChange(key);
                  setIsOpen(false);
                }}
              >
                <span className="style-name">{style.name}</span>
                {currentStyle === key && <span className="checkmark">✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Search and Filter Component ---
const SearchFilter = ({ onSearch, onFilter }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <motion.div 
      className="search-filter-bar"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search pilgrims..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onSearch(e.target.value);
          }}
          className="search-input"
        />
        {searchTerm && (
          <button 
            className="clear-search"
            onClick={() => {
              setSearchTerm('');
              onSearch('');
            }}
          >
            ✕
          </button>
        )}
      </div>
    </motion.div>
  );
};

// --- Error Boundary Component ---
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Map Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="map-error-fallback">
          <div className="error-content">
            <h3>🌍 Map Loading Failed</h3>
            <p>The map could not be loaded. Please check your connection and try again.</p>
            <button 
              className="retry-btn"
              onClick={() => this.setState({ hasError: false })}
            >
              Retry Loading Map
            </button>
            <details className="error-details">
              <summary>Error Details</summary>
              {this.state.error && this.state.error.toString()}
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const LiveMap = () => {
  const { users, groups, addActivity, authToken } = useAppContext();
  const { theme } = useTheme();
  
  const [userLocations, setUserLocations] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Enhanced state management
  const [mapCenter, setMapCenter] = useState([21.4225, 39.8262]);
  const [mapBounds, setMapBounds] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mapStyle, setMapStyle] = useState('detailed'); // Default to detailed map

  const socketRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  const calculateUserStatus = useCallback((lastSeenAt) => {
    if (!lastSeenAt) return 'inactive';
    const minutesDiff = (new Date() - new Date(lastSeenAt)) / (1000 * 60);
    return minutesDiff <= 5 ? 'active' : 'inactive';
  }, []);

  const enrichLocationData = useCallback((location) => {
      const user = users.find(u => u.id === location.userId);
      const group = groups.find(g => g.id === user?.groupId);
      const status = calculateUserStatus(location.lastSeenAt);
      
      return {
        ...location,
        status,
        userName: user?.name || location.name || 'Unknown User',
        groupId: group?.id || 0,
        groupName: group?.name || 'No Group',
        groupColor: getGroupColor(group?.id),
        avatar: user?.avatar,
        phone: user?.phone,
      };
  }, [users, groups, calculateUserStatus]);

  // WebSocket and Initial Fetch Logic
  useEffect(() => {
    if (!authToken) {
      setError("Authentication token not found. Please log in.");
      setLoading(false);
      return;
    }

    const fetchInitialLocations = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/location/all-users`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        const locationsMap = response.data.reduce((acc, loc) => {
          if (loc.latitude && loc.longitude) {
            acc[loc.userId] = enrichLocationData(loc);
          }
          return acc;
        }, {});

        setUserLocations(locationsMap);
        
        if (isInitialLoadRef.current) {
            const allGroupIds = [...new Set(Object.values(locationsMap).map(l => l.groupId))];
            const initialExpanded = allGroupIds.reduce((acc, id) => ({ ...acc, [id]: true }), {});
            setExpandedGroups(initialExpanded);
            isInitialLoadRef.current = false;
        }

      } catch (err) {
        console.error("Failed to fetch initial locations:", err);
        setError(err.response?.data?.message || "Could not fetch initial locations.");
      } finally {
        setLoading(false);
      }
    };

    const setupWebSocket = () => {
      const socketUrl = `${API_BASE_URL}/location`;
      socketRef.current = io(socketUrl, { auth: { token: authToken } });
      socketRef.current.on('connect', () => console.log('Connected to WebSocket'));
      socketRef.current.on('connect_error', (err) => setError('Real-time connection failed.'));
      socketRef.current.on('locationUpdated', (update) => {
        if (update.latitude && update.longitude) {
          const enrichedUpdate = enrichLocationData(update);
          setUserLocations(prev => ({ ...prev, [update.userId]: enrichedUpdate }));
        }
      });
    };

    fetchInitialLocations();
    setupWebSocket();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [authToken, addActivity, enrichLocationData]); 
  
  // Enhanced handlers
  const centerOnUser = (location) => {
    setMapBounds(null);
    setMapCenter([location.latitude, location.longitude]);
  };

  const handleGroupSelect = (groupId) => {
    setSelectedGroupId(groupId);
    setMapCenter(null);

    if (groupId === null) {
      const allLocations = Object.values(userLocations);
      if (allLocations.length > 1) {
        const bounds = L.latLngBounds(allLocations.map(l => [l.latitude, l.longitude]));
        setMapBounds(bounds);
      } else if (allLocations.length === 1) {
        centerOnUser(allLocations[0]);
      }
    } else {
      const groupMembers = Object.values(userLocations).filter(l => l.groupId === groupId);
      if (groupMembers.length > 1) {
        const bounds = L.latLngBounds(groupMembers.map(l => [l.latitude, l.longitude]));
        setMapBounds(bounds);
      } else if (groupMembers.length === 1) {
        centerOnUser(groupMembers[0]);
      }
    }
  };
  
  const toggleGroupExpansion = (groupId) => {
    setExpandedGroups(prev => ({...prev, [groupId]: !prev[groupId]}));
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleMapStyleChange = (newStyle) => {
    setMapStyle(newStyle);
  };

  // Enhanced data processing
  const locationsArray = Object.values(userLocations);
  
  const filteredLocations = searchTerm
    ? locationsArray.filter(loc => 
        loc.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.groupName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : locationsArray;

  const visibleLocations = selectedGroupId === null 
    ? filteredLocations 
    : filteredLocations.filter(loc => loc.groupId === selectedGroupId);
    
  const groupedLocations = filteredLocations.reduce((acc, loc) => {
    (acc[loc.groupName] = acc[loc.groupName] || { 
      id: loc.groupId, 
      color: loc.groupColor, 
      members: [] 
    }).members.push(loc);
    return acc;
  }, {});

  if (loading && locationsArray.length === 0) {
    return (
      <motion.div 
        className="live-map-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loading-animation">
          <div className="compass">
            <div className="compass-needle"></div>
          </div>
          <p>Loading Pilgrim Locations...</p>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <MapErrorBoundary>
      <motion.div 
        className={`live-map ${theme}`} 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Simplified Header */}
        <motion.div 
          className="live-map-header"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="header-content">
            <div className="header-title">
              <h1>Pilgrim Live Map</h1>
              <p>Real-time location tracking and monitoring</p>
            </div>
            <div className="header-stats">
              <span className="pilgrim-count">
                {locationsArray.length} Pilgrims Online
              </span>
              <span className="update-time">
                Last update: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="live-map-content">
          {/* Enhanced Sidebar */}
          <motion.div 
            className={`live-map-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="sidebar-header">
              <h3>Pilgrim Groups</h3>
              <button 
                className="sidebar-toggle"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                {isSidebarCollapsed ? '→' : '←'}
              </button>
            </div>

            {!isSidebarCollapsed && (
              <>
                <SearchFilter onSearch={handleSearch} />
                
                <div className="user-activity">
                  <div className="activity-list">
                    {/* Show All Groups */}
                    <motion.div 
                      className={`group-header ${selectedGroupId === null ? 'selected' : ''}`}
                      onClick={() => handleGroupSelect(null)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="group-info">
                        <span className="group-color-swatch" style={{ backgroundColor: '#6b7280' }}></span>
                        <p className="group-name">Show All Groups</p>
                      </div>
                      <span className="group-member-count">{locationsArray.length}</span>
                    </motion.div>
                    
                    {/* Group List */}
                    {Object.entries(groupedLocations)
                      .sort(([groupNameA], [groupNameB]) => groupNameA.localeCompare(groupNameB))
                      .map(([groupName, groupData]) => (
                      <motion.div 
                        key={groupData.id} 
                        className="group-container"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                      >
                        <div 
                          className={`group-header ${selectedGroupId === groupData.id ? 'selected' : ''}`}
                          onClick={() => handleGroupSelect(groupData.id)}
                        >
                          <div className="group-info">
                            <span 
                              className="group-color-swatch" 
                              style={{ backgroundColor: groupData.color }}
                            ></span>
                            <p className="group-name">{groupName}</p>
                          </div>
                          <div className="group-actions">
                            <span className="group-member-count">{groupData.members.length}</span>
                            <button 
                              className="expand-btn"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                toggleGroupExpansion(groupData.id); 
                              }}
                            >
                              {expandedGroups[groupData.id] ? '▲' : '▼'}
                            </button>
                          </div>
                        </div>
                        <AnimatePresence>
                          {expandedGroups[groupData.id] && (
                            <motion.div 
                              className="group-members"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              {groupData.members
                                .sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt))
                                .map((location, index) => (
                                <motion.div 
                                  key={location.userId} 
                                  className={`activity-item ${location.status}`}
                                  onClick={() => centerOnUser(location)}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  whileHover={{ scale: 1.02, x: 5 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <div className="user-avatar">
                                    {location.avatar ? (
                                      <img src={location.avatar} alt={location.userName} />
                                    ) : (
                                      <div 
                                        className="default-avatar"
                                        style={{ 
                                          background: `linear-gradient(135deg, ${location.groupColor}20, ${location.groupColor})` 
                                        }}
                                      >
                                        {location.userName.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className={`status-indicator ${location.status}`}></div>
                                  </div>
                                  <div className="user-info">
                                    <p className="user-name">{location.userName}</p>
                                    <p className="user-status">
                                      {new Date(location.lastSeenAt).toLocaleTimeString()}
                                    </p>
                                  </div>
                                  <div className="user-actions">
                                    <motion.button 
                                      className="center-btn" 
                                      title="Center on pilgrim"
                                      whileHover={{ scale: 1.2, rotate: 15 }}
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      🎯
                                    </motion.button>
                                  </div>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>

          {/* Enhanced Map Container */}
          <div className="map-container-wrapper">
            {error && (
              <motion.div 
                className="map-error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                ⚠️ {error}
              </motion.div>
            )}
            
            {/* Map Style Switcher */}
            <MapStyleSwitcher 
              currentStyle={mapStyle} 
              onStyleChange={handleMapStyleChange} 
            />
            
            <MapContainer 
              center={mapCenter} 
              zoom={15}  // Increased zoom for more detail
              style={{ height: '100%', width: '100%' }} 
              scrollWheelZoom={true}
              className="enhanced-map"
            >
              <TileLayer 
                url={MAP_STYLES[mapStyle].url}
                attribution={MAP_STYLES[mapStyle].attribution}
              />
              <MapController 
                center={mapCenter} 
                bounds={mapBounds} 
                selectedGroupId={selectedGroupId}
              />
              
              {visibleLocations.map(loc => (
                loc.latitude && loc.longitude && (
                  <Marker 
                    key={loc.userId} 
                    position={[loc.latitude, loc.longitude]} 
                    icon={createCustomIcon(loc.status, loc.groupColor, loc.userName)}
                  >
                    <Popup className="enhanced-popup">
                      <div className="user-popup">
                        <div className="popup-header">
                          <div 
                            className="popup-avatar"
                            style={{ backgroundColor: loc.groupColor }}
                          >
                            {loc.userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="popup-info">
                            <h4>{loc.userName}</h4>
                            <span className={`status-badge ${loc.status}`}>
                              {loc.status}
                            </span>
                          </div>
                        </div>
                        <div className="popup-details">
                          <p><strong>Group:</strong> {loc.groupName}</p>
                          <p><strong>Last Seen:</strong> {new Date(loc.lastSeenAt).toLocaleString()}</p>
                          {loc.phone && <p><strong>Contact:</strong> {loc.phone}</p>}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>
        </div>
      </motion.div>
    </MapErrorBoundary>
  );
};

export default LiveMap;