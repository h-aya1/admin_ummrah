import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"

const AppContext = createContext()

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}

export const AppProvider = ({ children }) => {
  // Initialize authentication state from localStorage to prevent flash of login screen
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("adminToken")
    return !!token
  })
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem("adminUser")
    return userData ? JSON.parse(userData) : null
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeGroups: 0,
    totalMessages: 0,
    onlinePilgrims: 0,
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [currentPage, setCurrentPage] = useState("Dashboard")
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [messages, setMessages] = useState([])

  // Load data from localStorage on app start
  useEffect(() => {
    const storedUsers = localStorage.getItem("ummrah_users")
    const storedGroups = localStorage.getItem("ummrah_groups")
    const storedMessages = localStorage.getItem("ummrah_messages")

    if (storedUsers) {
      setUsers(JSON.parse(storedUsers))
    }
    if (storedGroups) {
      setGroups(JSON.parse(storedGroups))
    }
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages))
    }
  }, [])

  // Update stats whenever users, groups, or messages change
  useEffect(() => {
    const totalUsers = users.length
    const activeGroups = groups.length
    const totalMessages = messages.length

    setStats(prevStats => ({
      ...prevStats,
      totalUsers,
      activeGroups,
      totalMessages
    }))
  }, [users, groups, messages])

  const login = async (email, password) => {
    try {
      // Simulate API call
      if (email === "admin@umrah.com" && password === "admin123") {
        const userData = {
          id: 1,
          name: "Admin User",
          email: "admin@umrah.com",
          role: "admin",
        }

        localStorage.setItem("adminToken", "mock-jwt-token")
        localStorage.setItem("adminUser", JSON.stringify(userData))

        setIsAuthenticated(true)
        setUser(userData)
        return { success: true }
      } else {
        return { success: false, error: "Invalid credentials" }
      }
    } catch (error) {
      return { success: false, error: "Login failed" }
    }
  }

  const logout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminUser")
    setIsAuthenticated(false)
    setUser(null)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      ...notification,
    }
    setNotifications((prev) => [newNotification, ...prev])
  }

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  const addActivity = (activity) => {
    const newActivity = {
      id: Date.now(),
      timestamp: new Date(),
      ...activity,
    }
    setRecentActivities((prev) => [newActivity, ...prev.slice(0, 9)]) // Keep only last 10 activities
  }

  const updateCurrentPage = (page) => {
    setCurrentPage(page)
  }

  // User management functions
  const addUser = (userData) => {
    const newUser = {
      ...userData,
      id: Date.now(),
      joinedAt: new Date().toISOString().split("T")[0],
      password: Math.random().toString(36).slice(-8),
    }
    const updatedUsers = [...users, newUser]
    setUsers(updatedUsers)
    localStorage.setItem("ummrah_users", JSON.stringify(updatedUsers))

    addActivity({
      type: "user_added",
      message: `Admin added new user: ${newUser.name}`,
      icon: "👤",
    })

    return newUser
  }

  const updateUser = (userId, userData) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, ...userData } : user
    )
    setUsers(updatedUsers)
    localStorage.setItem("ummrah_users", JSON.stringify(updatedUsers))

    const updatedUser = updatedUsers.find(user => user.id === userId)
    addActivity({
      type: "user_updated",
      message: `Admin updated user: ${updatedUser.name}`,
      icon: "✏️",
    })
  }

  const deleteUser = (userId) => {
    const userToDelete = users.find(user => user.id === userId)
    const updatedUsers = users.filter(user => user.id !== userId)
    setUsers(updatedUsers)
    localStorage.setItem("ummrah_users", JSON.stringify(updatedUsers))

    // Also remove user from any groups
    const updatedGroups = groups.map(group => ({
      ...group,
      members: Array.isArray(group.members)
        ? group.members.filter(member => member.id !== userId)
        : [],
      totalMembers: Array.isArray(group.members)
        ? group.members.filter(member => member.id !== userId).length
        : 0,
    }))
    setGroups(updatedGroups)
    localStorage.setItem("ummrah_groups", JSON.stringify(updatedGroups))

    addActivity({
      type: "user_deleted",
      message: `Admin deleted user: ${userToDelete.name}`,
      icon: "🗑️",
    })
  }

  // Group management functions
  const addGroup = (groupData) => {
    const amirUser = users.find(u => u.name === groupData.amir)
    const amirMember = amirUser ? {
      id: amirUser.id,
      name: amirUser.name,
      phone: amirUser.phone,
      role: "amir",
      joinedAt: new Date().toISOString().split("T")[0]
    } : null

    const newGroup = {
      ...groupData,
      id: Date.now(),
      createdAt: new Date().toISOString().split("T")[0],
      members: amirMember ? [amirMember] : [],
      totalMembers: amirMember ? 1 : 0,
      activeMembers: 0,
      location: groupData.location || "Not set",
      lastActivity: new Date().toISOString()
    }

    const updatedGroups = [...groups, newGroup]
    setGroups(updatedGroups)
    localStorage.setItem("ummrah_groups", JSON.stringify(updatedGroups))

    // Update the amir user's group assignment
    if (amirUser) {
      updateUser(amirUser.id, { groupId: newGroup.id, groupName: newGroup.name })
    }

    addActivity({
      type: "group_created",
      message: `Admin created new group: ${newGroup.name}`,
      icon: "🏕️",
    })

    return newGroup
  }

  const updateGroup = (groupId, groupData) => {
    const updatedGroups = groups.map(group =>
      group.id === groupId ? { ...group, ...groupData, lastActivity: new Date().toISOString() } : group
    )
    setGroups(updatedGroups)
    localStorage.setItem("ummrah_groups", JSON.stringify(updatedGroups))

    const updatedGroup = updatedGroups.find(group => group.id === groupId)
    addActivity({
      type: "group_updated",
      message: `Admin updated group: ${updatedGroup.name}`,
      icon: "✏️",
    })
  }

  const deleteGroup = (groupId) => {
    const groupToDelete = groups.find(group => group.id === groupId)
    const updatedGroups = groups.filter(group => group.id !== groupId)
    setGroups(updatedGroups)
    localStorage.setItem("ummrah_groups", JSON.stringify(updatedGroups))

    // Remove group assignments from users
    const updatedUsers = users.map(user =>
      user.groupId === groupId ? { ...user, groupId: null, groupName: null } : user
    )
    setUsers(updatedUsers)
    localStorage.setItem("ummrah_users", JSON.stringify(updatedUsers))

    addActivity({
      type: "group_deleted",
      message: `Admin deleted group: ${groupToDelete.name}`,
      icon: "🗑️",
    })
  }

  // Message management functions
  const addMessage = (messageData) => {
    const newMessage = {
      ...messageData,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    }
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
    localStorage.setItem("ummrah_messages", JSON.stringify(updatedMessages))

    addActivity({
      type: "message_sent",
      message: `Admin sent message to group`,
      icon: "💬",
    })
  }

  const updateStats = useCallback((newStats) => {
    setStats((prev) => ({ ...prev, ...newStats }))
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      sidebarCollapsed,
      notifications,
      stats,
      recentActivities,
      currentPage,
      users,
      groups,
      messages,
      login,
      logout,
      toggleSidebar,
      addNotification,
      removeNotification,
      addActivity,
      updateCurrentPage,
      addUser,
      updateUser,
      deleteUser,
      addGroup,
      updateGroup,
      deleteGroup,
      addMessage,
      updateStats,
    }),
    [isAuthenticated, user, sidebarCollapsed, notifications, stats, recentActivities, currentPage, users, groups, messages, login, logout, toggleSidebar, addNotification, removeNotification, addActivity, updateCurrentPage, addUser, updateUser, deleteUser, addGroup, updateGroup, deleteGroup, addMessage, updateStats]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
