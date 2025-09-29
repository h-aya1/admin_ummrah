import { useState, useEffect } from "react"

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSendModal, setShowSendModal] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockNotifications = [
      {
        id: 1,
        title: "Prayer Time Reminder",
        message: "Maghrib prayer time is approaching in 15 minutes",
        type: "prayer",
        recipients: "all",
        sentAt: new Date(Date.now() - 30 * 60000),
        status: "sent",
        readCount: 156,
        totalRecipients: 200,
      },
      {
        id: 2,
        title: "Weather Alert",
        message: "High temperature expected today. Please stay hydrated and seek shade.",
        type: "weather",
        recipients: "Makkah Groups",
        sentAt: new Date(Date.now() - 2 * 60 * 60000),
        status: "sent",
        readCount: 89,
        totalRecipients: 120,
      },
      {
        id: 3,
        title: "Group Meeting",
        message: "All group leaders meeting at 8 PM in the main hall",
        type: "announcement",
        recipients: "amirs",
        sentAt: new Date(Date.now() - 4 * 60 * 60000),
        status: "sent",
        readCount: 23,
        totalRecipients: 25,
      },
    ]

    setNotifications(mockNotifications)
    setLoading(false)
  }

  const handleSendNotification = (notificationData) => {
    const newNotification = {
      id: Date.now(),
      ...notificationData,
      sentAt: new Date(),
      status: "sent",
      readCount: 0,
      totalRecipients: notificationData.recipients === "all" ? 200 : 50,
    }
    setNotifications([newNotification, ...notifications])
    setShowSendModal(false)
  }

  const handleDeleteNotification = (id) => {
    if (window.confirm("Are you sure you want to delete this notification?")) {
      setNotifications(notifications.filter((notif) => notif.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="notifications-loading">
        <div className="loading-spinner"></div>
        <p>Loading notifications...</p>
      </div>
    )
  }

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Notifications</h1>
          <p>Send and manage notifications to pilgrims</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowSendModal(true)}>
          Send Notification
        </button>
      </div>

      <div className="notifications-list">
        {notifications.map((notification) => (
          <div key={notification.id} className="notification-card">
            <div className="notification-header">
              <div className="notification-info">
                <h3 className="notification-title">{notification.title}</h3>
                <span className={`notification-type ${notification.type}`}>{notification.type}</span>
              </div>
              <div className="notification-actions">
                <button className="action-btn delete" onClick={() => handleDeleteNotification(notification.id)}>
                  🗑️
                </button>
              </div>
            </div>

            <p className="notification-message">{notification.message}</p>

            <div className="notification-meta">
              <div className="meta-item">
                <strong>Recipients:</strong> {notification.recipients}
              </div>
              <div className="meta-item">
                <strong>Sent:</strong> {notification.sentAt.toLocaleString()}
              </div>
              <div className="meta-item">
                <strong>Read Rate:</strong> {notification.readCount}/{notification.totalRecipients} (
                {Math.round((notification.readCount / notification.totalRecipients) * 100)}%)
              </div>
            </div>

            <div className="notification-stats">
              <div className="stats-bar">
                <div
                  className="stats-fill"
                  style={{ width: `${(notification.readCount / notification.totalRecipients) * 100}%` }}
                ></div>
              </div>
              <span className="stats-text">
                {notification.readCount} of {notification.totalRecipients} read
              </span>
            </div>
          </div>
        ))}
      </div>

      {showSendModal && (
        <SendNotificationModal onClose={() => setShowSendModal(false)} onSend={handleSendNotification} />
      )}
    </div>
  )
}

const SendNotificationModal = ({ onClose, onSend }) => {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "announcement",
    recipients: "all",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSend(formData)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Send Notification</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="notification-form">
          <div className="form-group">
            <label>Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} className="input" required />
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="input"
              rows="4"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="input">
                <option value="announcement">Announcement</option>
                <option value="prayer">Prayer</option>
                <option value="weather">Weather</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div className="form-group">
              <label>Recipients</label>
              <select name="recipients" value={formData.recipients} onChange={handleChange} className="input">
                <option value="all">All Pilgrims</option>
                <option value="amirs">Group Leaders Only</option>
                <option value="Makkah Groups">Makkah Groups</option>
                <option value="Medina Groups">Medina Groups</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Send Notification
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Notifications
