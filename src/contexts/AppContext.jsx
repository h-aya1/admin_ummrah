import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { authAPI, usersAPI } from "../services/api"

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

  // Load data from API when authenticated
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated) {
        try {
          const usersResponse = await usersAPI.getAll();
          setUsers(usersResponse);
          // TODO: Load groups and messages from API
        } catch (error) {
          console.error('Failed to load data:', error);
          // If unauthorized, logout the user
          if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            logout();
          }
        }
      }
    };
    loadData();
  }, [isAuthenticated]);

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
      const response = await authAPI.loginAdmin(email, password);
      const { access_token } = response;

      // Decode token to get user info (simple decode, in production use a library)
      const payload = JSON.parse(atob(access_token.split('.')[1]));
      const userData = {
        id: payload.sub,
        name: payload.username || email,
        email: payload.username || email,
        role: payload.role,
      };

      localStorage.setItem("adminToken", access_token);
      localStorage.setItem("adminUser", JSON.stringify(userData));

      setIsAuthenticated(true);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || "Login failed" };
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
  const addUser = async (userData) => {
    try {
      const response = await authAPI.registerUser(userData);
      // Response includes generated password
      const newUser = {
        ...response,
        password: response.password, // Generated password
      };
      // For now, still add to local state for UI, but ideally fetch from API
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      // localStorage.setItem("ummrah_users", JSON.stringify(updatedUsers)); // Remove since using API

      addActivity({
        type: "user_added",
        message: `Admin added new user: ${newUser.name}`,
        icon: "👤",
      });

      return newUser;
    } catch (error) {
      throw new Error(error.message || "Failed to add user");
    }
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
