import { useState, useEffect, useRef } from "react"
import "./Notifications.css"
import { notificationsAPI } from "../../services/api"
import { useAppContext } from "../../contexts/AppContext"

const Notifications = () => {
//   const { users, isAuthenticated } = useAppContext()
//   const [notifications, setNotifications] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [showSendModal, setShowSendModal] = useState(false)

//   useEffect(() => {
//     if (isAuthenticated) {
//       loadNotifications()
//     } else {
//       setLoading(false)
//     }
//   }, [isAuthenticated])

//   const loadNotifications = async () => {
//     setLoading(true)
//     try {
//       const data = await notificationsAPI.getAll()
//       setNotifications(data || [])
//     } catch (error) {
//       console.error('Error loading notifications:', error)
//       setNotifications([])
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleSendNotification = async (notificationData) => {
//     if (!isAuthenticated) {
//       alert('You must be logged in to send notifications.')
//       return
//     }
//     try {
//       await notificationsAPI.create(notificationData)
//       setShowSendModal(false)
//       // Refresh the notifications list
//       await loadNotifications()
//     } catch (error) {
//       console.error('Error sending notification:', error)
//       alert('Failed to send notification. Please try again.')
//     }
//   }

//   const handleDeleteNotification = async (id) => {
//     if (!isAuthenticated) {
//       alert('You must be logged in to delete notifications.')
//       return
//     }
//     if (window.confirm("Are you sure you want to delete this notification?")) {
//       try {
//         await notificationsAPI.delete(id)
//         // Refresh the notifications list
//         await loadNotifications()
//       } catch (error) {
//         console.error('Error deleting notification:', error)
//         alert('Failed to delete notification. Please try again.')
//       }
//     }
//   }

//   // Show message if not authenticated
//   if (!isAuthenticated) {
//     return (
//       <div className="notifications-page">
//         <div className="notifications-loading">
//           <div className="loading-spinner"></div>
//           <p>Please log in to access notifications</p>
//         </div>
//       </div>
//     )
//   }

//   if (loading) {
//     return (
//       <div className="notifications-loading">
//         <div className="loading-spinner"></div>
//         <p>Loading notifications...</p>
//       </div>
//     )
//   }

//   return (
//     <div className="notifications-page">
//       <div className="page-header">
//         <div className="header-content">
//           <h1>Notifications</h1>
//           <p>Send and manage notifications to pilgrims</p>
//         </div>
//         <button className="btn btn-primary" onClick={() => setShowSendModal(true)}>
//           Send Notification
//         </button>
//       </div>

//       <div className="notifications-list">
//         {notifications.map((notification) => (
//           <div key={notification.id} className="notification-card">
//             <div className="notification-header">
//               <div className="notification-info">
//                 <h3 className="notification-title">{notification.title}</h3>
//                 <span className={`notification-type ${notification.type}`}>{notification.type}</span>
//               </div>
//               <div className="notification-actions">
//                 <button className="action-btn delete" onClick={() => handleDeleteNotification(notification.id)}>
//                   🗑️
//                 </button>
//               </div>
//             </div>

//             <p className="notification-message">{notification.message}</p>

//             <div className="notification-meta">
//               <div className="meta-item">
//                 <strong>Recipients:</strong> {notification.recipients}
//               </div>
//               <div className="meta-item">
//                 <strong>Sent:</strong> {new Date(notification.createdAt || notification.sentAt).toLocaleString()}
//               </div>
//               <div className="meta-item">
//                 <strong>Read Rate:</strong> {notification.readCount}/{notification.totalRecipients} (
//                 {Math.round((notification.readCount / notification.totalRecipients) * 100)}%)
//               </div>
//             </div>

//             <div className="notification-stats">
//               <div className="stats-bar">
//                 <div
//                   className="stats-fill"
//                   style={{ width: `${(notification.readCount / notification.totalRecipients) * 100}%` }}
//                 ></div>
//               </div>
//               <span className="stats-text">
//                 {notification.readCount} of {notification.totalRecipients} read
//               </span>
//             </div>
//           </div>
//         ))}
//       </div>

//       {showSendModal && (
//         <SendNotificationModal onClose={() => setShowSendModal(false)} onSend={handleSendNotification} users={users} />
//       )}
//     </div>
//   )
// }

// const SendNotificationModal = ({ onClose, onSend, users }) => {
//   const modalRef = useRef(null)
//   const [formData, setFormData] = useState({
//     title: "",
//     message: "",
//     type: "announcement",
//     recipients: "all",
//   })

//   // Close modal when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (modalRef.current && event.target === modalRef.current) {
//         onClose()
//       }
//     }

//     document.addEventListener('mousedown', handleClickOutside)
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside)
//     }
//   }, [onClose])

//   const handleChange = (e) => {
//     const { name, value } = e.target
//     setFormData({ ...formData, [name]: value })
//   }

//   const handleSubmit = (e) => {
//     e.preventDefault()
//     onSend(formData)
//   }

//   return (
//     <div className="modal-overlay" ref={modalRef}>
//       <div className="modal-content">
//         <div className="modal-header">
//           <h2>Send Notification</h2>
//           <button className="close-btn" onClick={onClose}>
//             ×
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="notification-form">
//           <div className="form-group">
//             <label>Title</label>
//             <input type="text" name="title" value={formData.title} onChange={handleChange} className="input" required />
//           </div>

//           <div className="form-group">
//             <label>Message</label>
//             <textarea
//               name="message"
//               value={formData.message}
//               onChange={handleChange}
//               className="input"
//               rows="4"
//               required
//             />
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label>Type</label>
//               <select name="type" value={formData.type} onChange={handleChange} className="input">
//                 <option value="announcement">Announcement</option>
//                 <option value="prayer">Prayer</option>
//                 <option value="weather">Weather</option>
//                 <option value="emergency">Emergency</option>
//               </select>
//             </div>

//             <div className="form-group">
//               <label>Recipients</label>
//               <select name="recipients" value={formData.recipients} onChange={handleChange} className="input">
//                 <option value="all">All pilgrims</option>
//                 <option value="amirs">List of amirs</option>
//                 <option value="Makkah Groups">Group chats</option>
//               </select>
//             </div>
//           </div>

//           {formData.recipients === "amirs" && users && (
//             <div className="form-group">
//               <label>Registered Amirs ({users.filter(user => user.role === "amir").length})</label>
//               <div className="amirs-list">
//                 {users.filter(user => user.role === "amir").map((amir) => (
//                   <div key={amir.id} className="amir-item">
//                     <span className="amir-name">{amir.name}</span>
//                     <span className="amir-phone">{amir.phone || "No phone"}</span>
//                   </div>
//                 ))}
//                 {users.filter(user => user.role === "amir").length === 0 && (
//                   <p className="no-amirs">No registered amirs found</p>
//                 )}
//               </div>
//             </div>
//           )}

//           <div className="modal-actions">
//             <button type="button" className="btn btn-secondary" onClick={onClose}>
//               Cancel
//             </button>
//             <button type="submit" className="btn btn-primary">
//               Send Notification
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   )
// }
}
export default Notifications
