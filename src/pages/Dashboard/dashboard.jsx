import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppContext } from "../../contexts/AppContext"
import "./dashboard.css"

const Dashboard = () => {
  const { stats, recentActivities, addActivity, users, groups, messages } = useAppContext()
  const navigate = useNavigate()
  const [alertsData, setAlertsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [weatherData, setWeatherData] = useState([])
  const [weatherLoading, setWeatherLoading] = useState(true)

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = async () => {
      setLoading(true)

      // Simulate API calls
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Initialize with sample data if no data exists
      if (users.length === 0) {
        const sampleUsers = [
          {
            id: 1,
            name: "Ahmed Hassan",
            email: "ahmed@example.com",
            phone: "+966501234567",
            role: "amir",
            groupId: 1,
            groupName: "Makkah-2024",
            joinedAt: "2024-01-15",
            password: "sample123"
          },
          {
            id: 2,
            name: "Fatima Ali",
            email: "fatima@example.com",
            phone: "+966507654321",
            role: "pilgrim",
            groupId: 1,
            groupName: "Makkah-2024",
            joinedAt: "2024-01-16",
            password: "sample456"
          }
        ]
        localStorage.setItem("ummrah_users", JSON.stringify(sampleUsers))
      }

      if (groups.length === 0) {
        const sampleGroups = [
          {
            id: 1,
            name: "Makkah-2024",
            amir: "Ahmed Hassan",
            location: "Makkah, Saudi Arabia",
            createdAt: "2024-01-15",
            totalMembers: 2,
            activeMembers: 2,
            members: [
              {
                id: 1,
                name: "Ahmed Hassan",
                phone: "+966501234567",
                role: "amir",
                joinedAt: "2024-01-15"
              },
              {
                id: 2,
                name: "Fatima Ali",
                phone: "+966507654321",
                role: "pilgrim",
                joinedAt: "2024-01-16"
              }
            ],
            lastActivity: new Date().toISOString()
          }
        ]
        localStorage.setItem("ummrah_groups", JSON.stringify(sampleGroups))
      }

      if (messages.length === 0) {
        const sampleMessages = [
          {
            id: 1,
            groupId: 1,
            senderId: 0,
            senderName: "Admin",
            senderRole: "admin",
            message: "Welcome to the Umrah admin panel!",
            timestamp: new Date().toISOString(),
            type: "text"
          }
        ]
        localStorage.setItem("ummrah_messages", JSON.stringify(sampleMessages))
      }

      // Trigger data reload in context
      window.dispatchEvent(new Event("dataUpdated"))

      // Set alerts
      setAlertsData([
        {
          id: 1,
          type: "warning",
          title: "High Temperature Alert",
          message: "Temperature in Makkah exceeds 45°C. Advise pilgrims to stay hydrated.",
          priority: "high",
        },
        {
          id: 2,
          type: "info",
          title: "Prayer Time Update",
          message: "Maghrib prayer time updated for all groups in Medina.",
          priority: "medium",
        },
        {
          id: 3,
          type: "success",
          title: "System Backup Complete",
          message: "Daily system backup completed successfully.",
          priority: "low",
        },
      ])

      setLoading(false)
    }

    loadDashboardData()
  }, [])

  useEffect(() => {
    // Fetch current weather for three locations
    const apiKey = import.meta.env.VITE_OPENWEATHER_KEY
    const locations = [
      { name: "Addis Ababa", q: "Addis Ababa,ET" },
      { name: "Makkah", q: "Makkah,SA" },
      { name: "Medina", q: "Medina,SA" },
    ]

    const fetchWeather = async () => {
      setWeatherLoading(true)
      if (!apiKey) {
        // No API key available — set fallback messages
        setWeatherData(
          locations.map((loc) => ({ name: loc.name, error: "No API key" }))
        )
        setWeatherLoading(false)
        return
      }

      try {
        const results = await Promise.all(
          locations.map(async (loc) => {
            const res = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
                loc.q
              )}&units=metric&appid=${apiKey}`
            )
            if (!res.ok) {
              return { name: loc.name, error: `HTTP ${res.status}` }
            }
            const json = await res.json()
            return {
              name: loc.name,
              tempC: Math.round(json.main.temp),
              condition: json.weather && json.weather[0] ? json.weather[0].main : "-",
              description: json.weather && json.weather[0] ? json.weather[0].description : "",
            }
          })
        )
        setWeatherData(results)
      } catch (err) {
        setWeatherData(locations.map((loc) => ({ name: loc.name, error: "Fetch failed" })))
      } finally {
        setWeatherLoading(false)
      }
    }

    fetchWeather()
  }, [])

  const handleSendNotification = () => {
    addActivity({
      type: "notification_sent",
      message: "Admin sent test notification from dashboard",
      icon: "🔔",
    })
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard Overview</h1>
          <p>Monitor and manage your Umrah pilgrimage operations</p>
        </div>
        {/* header actions removed as requested */}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalUsers.toLocaleString()}</h3>
            <p>Total Pilgrims</p>
            <span className="stat-change positive">+12% from last month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏕️</div>
          <div className="stat-content">
            <h3>{stats.activeGroups}</h3>
            <p>Active Groups</p>
            <span className="stat-change positive">+3 new groups</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>{stats.totalMessages.toLocaleString()}</h3>
            <p>Total Messages</p>
            <span className="stat-change neutral">Today</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-left">
          <div className="card">
            <div className="card-header">
              <h2>Recent Activity</h2>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="activity-list">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">{activity.icon}</div>
                    <div className="activity-content">
                      <p className="activity-message">{activity.message}</p>
                      <span className="activity-time">{activity.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-activity">
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* System Alerts removed as requested */}
        </div>

        <div className="content-right">
          <div className="card">
            <div className="card-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="quick-actions">
              <button className="action-btn" onClick={() => navigate("/dua")}>
                <span className="action-icon">🤲</span>
                <div className="action-content">
                  <h4>Add Dua</h4>
                  <p>Add a new dua to the library</p>
                </div>
              </button>

              <button className="action-btn" onClick={() => navigate("/umrah-guides")}>
                <span className="action-icon">📚</span>
                <div className="action-content">
                  <h4>Add Guide</h4>
                  <p>Add a new Umrah guide</p>
                </div>
              </button>

              <button className="action-btn" onClick={() => navigate("/visit-places") }>
                <span className="action-icon">🗺️</span>
                <div className="action-content">
                  <h4>Add Visit Places</h4>
                  <p>Add visit places to itinerary</p>
                </div>
              </button>

              <button className="action-btn" onClick={() => navigate("/notifications") }>
                <span className="action-icon">🚨</span>
                <div className="action-content">
                  <h4>Send Emergency Alert</h4>
                  <p>Send urgent notification to all groups</p>
                </div>
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Weather & Conditions</h2>
            </div>
            <div className="weather-info">
              {weatherLoading ? (
                <p>Loading weather...</p>
              ) : (
                weatherData.map((w) => (
                  <div className="weather-location" key={w.name}>
                    <h3>{w.name}</h3>
                    {w.error ? (
                      <div className="weather-details">
                        <span className="condition">{w.error}</span>
                      </div>
                    ) : (
                      <>
                        <div className="weather-details">
                          <span className="temperature">{w.tempC}°C</span>
                          <span className="condition">{w.condition}</span>
                        </div>
                        <p className="weather-advice">
                          {w.condition && w.condition.toLowerCase().includes("rain")
                            ? "Wet conditions - advise umbrellas and caution"
                            : w.tempC >= 40
                            ? "High temperature - Ensure pilgrims stay hydrated"
                            : "Good conditions for outdoor activities"}
                        </p>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
