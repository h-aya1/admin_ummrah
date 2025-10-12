import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react"
import { authAPI, usersAPI, groupsAPI, duasAPI } from "../services/api"
// Firebase imports for push notifications
import { requestForToken, onMessageListener } from "../firebase"

const API_BASE_URL = 'http://69.62.109.18:3001'; // Should match the one in api.js

const generateRandomPassword = (length = 10) => {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@$!%*?&"
  let password = ""
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * charset.length)
    password += charset[index]
  }
  return password
}

const PASSWORD_STORE_KEY = "adminUserPasswords"

const ensureAmirMember = (group, usersList = []) => {
  if (!group) return group
  const members = Array.isArray(group.members) ? [...group.members] : []
  const amirId = group?.amirId != null ? String(group.amirId) : null
  const amirName = typeof group?.amir === "string" ? group.amir : ""

  const hasAmir = members.some((member) => {
    const memberId = member?.id != null ? String(member.id) : null
    return (
      (amirId && memberId === amirId) ||
      (amirName && member?.name === amirName) ||
      member?.role === "amir"
    )
  })

  if (hasAmir) {
    return {
      ...group,
      members,
      totalMembers: group.totalMembers ?? members.length,
    }
  }

  const amirUser = usersList.find((user) => {
    const userId = user?.id != null ? String(user.id) : null
    return (
      (amirId && userId === amirId) ||
      (amirName && user?.name === amirName)
    )
  })

  const amirMember = {
    id: amirUser?.id ?? amirId ?? `amir-${group.id}`,
    name: amirUser?.name ?? amirName ?? "Group Amir",
    phone: amirUser?.phone ?? "",
    role: "amir",
    joinedAt: amirUser?.joinedAt || new Date().toISOString().split("T")[0],
  }

  const updatedMembers = [amirMember, ...members]

  return {
    ...group,
    members: updatedMembers,
    totalMembers: Math.max(updatedMembers.length, group.totalMembers ?? 0),
  }
}

const normalizeGroupsWithAmir = (groupsList = [], usersList = []) =>
  groupsList.map((group) => ensureAmirMember(group, usersList))

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
  const [fcmToken, setFcmToken] = useState(null)
  const [userPasswords, setUserPasswords] = useState(() => {
    try {
      const stored = localStorage.getItem(PASSWORD_STORE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.warn("Failed to parse stored user passwords", error)
      return {}
    }
  })
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [messages, setMessages] = useState([])
  const [duas, setDuas] = useState([])
  const [duaCategories, setDuaCategories] = useState([])
  const usersRef = useRef([])

  // Load data from API when authenticated
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated) {
        try {
          const [usersResponse, groupsResponse, duasResponse, categoriesResponse] = await Promise.all([
            usersAPI.getAll(),
            groupsAPI.getAll(),
            duasAPI.getAll(),
            duasAPI.getCategories(),
          ]);
          const usersWithPasswords = usersResponse.map((user) => (
            userPasswords?.[user.id]
              ? { ...user, password: userPasswords[user.id] }
              : user
          ));
          setUsers(usersWithPasswords);
          usersRef.current = usersWithPasswords;
          setGroups(normalizeGroupsWithAmir(groupsResponse, usersWithPasswords));
          setDuas(duasResponse);
          setDuaCategories(categoriesResponse || []);
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
      const token = response?.access_token || response?.accessToken || response?.token;
      if (!token) {
        throw new Error("Invalid login response: missing access token");
      }

      // Decode token to get user info (best-effort; if it fails, still log in)
      let userData = { id: undefined, name: email, email, role: undefined };
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userData = {
          id: payload?.sub || payload?.id,
          name: payload?.username || payload?.name || email,
          email: payload?.username || payload?.email || email,
          role: payload?.role,
        };
      } catch {
        // ignore decode errors
      }

      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminUser", JSON.stringify(userData));

      setIsAuthenticated(true);
      setUser(userData);

      // Request FCM token for push notifications after successful login
      try {
        const token = await requestForToken();
        if (token) {
          setFcmToken(token);
          console.log('FCM Token obtained:', token);
          // TODO: Send this token to your backend via API call
          // Example: await fetch('/api/admin/fcm-token', { method: 'POST', body: JSON.stringify({ token, userId: userData.id }) });
        }
      } catch (error) {
        console.error('Failed to get FCM token:', error);
      }

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

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      ...notification,
    }
    setNotifications((prev) => [newNotification, ...prev])
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }, [])

  const addActivity = useCallback((activity) => {
    const newActivity = {
      id: Date.now(),
      timestamp: new Date(),
      ...activity,
    }
    setRecentActivities((prev) => [newActivity, ...prev.slice(0, 9)]) // Keep only last 10 activities
  }, [])

  const updateCurrentPage = (page) => {
    setCurrentPage(page)
  }

  // Fetch helpers
  const applyStoredPasswords = useCallback((list, passwords = userPasswords) =>
    list.map((user) => {
      const storedPassword = passwords?.[user.id]
      return storedPassword ? { ...user, password: storedPassword } : user
    }),
    [userPasswords]
  )

  const persistUserPasswords = useCallback((updater) => {
    setUserPasswords((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater
      try {
        localStorage.setItem(PASSWORD_STORE_KEY, JSON.stringify(next))
      } catch (error) {
        console.warn("Failed to persist user passwords", error)
      }
      return next
    })
  }, [])

  const refreshUsers = useCallback(async () => {
    try {
      const data = await usersAPI.getAll();
      const merged = applyStoredPasswords(data);
      setUsers(merged);
      return merged;
    } catch (error) {
      throw new Error(error.message || "Failed to fetch users");
    }
  }, [applyStoredPasswords]);

  const refreshGroups = useCallback(async (usersOverride) => {
    try {
      const data = await groupsAPI.getAll();
      const normalized = normalizeGroupsWithAmir(data, usersOverride ?? usersRef.current);
      setGroups(normalized);
      return normalized;
    } catch (error) {
      throw new Error(error.message || "Failed to fetch groups");
    }
  }, []);

  useEffect(() => {
    usersRef.current = users;
  }, [users])

  // Set up FCM foreground message listener when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = onMessageListener((payload) => {
        console.log('Foreground message received:', payload);

        // Display alert with notification content
        const title = payload?.notification?.title || 'Umrah Admin Notification';
        const body = payload?.notification?.body || 'You have a new notification';

        alert(`${title}\n\n${body}`);

        // You can also add the notification to your app's notification system
        // addNotification({
        //   type: 'push',
        //   title,
        //   message: body,
        //   priority: 'high'
        // });
      });

      return unsubscribe; // Cleanup listener on unmount or when authentication changes
    }
  }, [isAuthenticated]);

  // User management functions
  const addUser = async (userData) => {
    try {
      const password = (userData?.password || "").trim() || generateRandomPassword()
      // sanitize create payload: include only supported, non-empty fields
      const payload = {
        name: userData?.name?.trim(),
        email: userData?.email?.trim(),
        phone: userData?.phone?.trim(),
        role: userData?.role || "member",
        emergencyContact: userData?.emergencyContact?.trim(),
        password,
      };
      // remove empty strings / undefined / null entries
      Object.keys(payload).forEach((k) => {
        if (payload[k] === "" || payload[k] === undefined || payload[k] === null) {
          delete payload[k];
        }
      });

      const created = await usersAPI.create(payload);
      const createdWithPassword = {
        ...created,
        password: created?.password || password,
      }
      setUsers((prev) => [...prev, createdWithPassword]);
      persistUserPasswords((prev) => ({
        ...prev,
        [createdWithPassword.id]: createdWithPassword.password,
      }))
      await refreshGroups().catch(() => {});
      addActivity({
        type: "user_added",
        message: `Admin added new user: ${createdWithPassword.name}`,
        icon: "👤",
      });
      return createdWithPassword;
    } catch (error) {
      throw new Error(error.message || "Failed to add user");
    }
  }

  const updateUser = async (userId, userData) => {
    try {
      const updated = await usersAPI.update(userId, userData);
      const nextPassword = (userData?.password || "").trim();
      if (nextPassword) {
        persistUserPasswords((prev) => ({ ...prev, [userId]: nextPassword }))
      }
      const storedPassword = userPasswords?.[userId] || nextPassword;
      const mergedUser = storedPassword ? { ...updated, password: storedPassword } : updated;
      setUsers((prev) => prev.map((u) => (u.id === userId ? mergedUser : u)));
      await refreshGroups().catch(() => {});
      addActivity({
        type: "user_updated",
        message: `Admin updated user: ${updated.name}`,
        icon: "✏️",
      })
      return updated;
    } catch (error) {
      throw new Error(error.message || "Failed to update user");
    }
  }

  const deleteUser = async (userId) => {
    try {
      const userToDelete = users.find((u) => u.id === userId);
      await usersAPI.delete(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      persistUserPasswords((prev) => {
        const next = { ...prev }
        delete next[userId]
        return next
      })
      // Refresh groups to reflect membership changes server-side
      await refreshGroups().catch(() => {});
      addActivity({
        type: "user_deleted",
        message: `Admin deleted user: ${userToDelete?.name || userId}`,
        icon: "🗑️",
      })
      return true;
    } catch (error) {
      throw new Error(error.message || "Failed to delete user");
    }
  }

  // Group management functions
  const addGroup = async (groupData) => {
    try {
      const amirUser = users.find((u) => u.name === groupData.amir);
      const amirMember = amirUser
        ? {
            id: amirUser.id,
            name: amirUser.name,
            phone: amirUser.phone,
            role: "amir",
            joinedAt: new Date().toISOString().split("T")[0],
          }
        : null;

      const payload = {
        ...groupData,
        createdAt: new Date().toISOString().split("T")[0],
        members: amirMember ? [amirMember] : [],
        totalMembers: amirMember ? 1 : 0,
        activeMembers: 0,
        location: groupData.location || "Not set",
        lastActivity: new Date().toISOString(),
      };

      const created = await groupsAPI.create(payload);
      const normalizedCreated = ensureAmirMember(created, users);
      setGroups((prev) => [...prev, normalizedCreated]);

      // Update the amir user's group assignment
      if (amirUser) {
        try {
          const updatedAmir = await usersAPI.update(amirUser.id, {
            groupId: created.id,
            groupName: created.name,
          });
          setUsers((prev) => prev.map((u) => (u.id === updatedAmir.id ? updatedAmir : u)));
        } catch (e) {
          console.error("Failed to update amir user's group assignment:", e);
          await refreshUsers().catch(() => {});
        }
      }

      addActivity({
        type: "group_created",
        message: `Admin created new group: ${created.name}`,
        icon: "🏕️",
      })

      return created;
    } catch (error) {
      throw new Error(error.message || "Failed to add group");
    }
  }

  const updateGroup = async (groupId, groupData) => {
    try {
      const payload = { ...groupData, lastActivity: new Date().toISOString() };
      const updated = await groupsAPI.update(groupId, payload);
      const normalized = ensureAmirMember(updated, users);
      setGroups((prev) => prev.map((g) => (g.id === groupId ? normalized : g)));
      addActivity({
        type: "group_updated",
        message: `Admin updated group: ${normalized.name}`,
        icon: "✏️",
      })
      return normalized;
    } catch (error) {
      throw new Error(error.message || "Failed to update group");
    }
  }

  const deleteGroup = async (groupId) => {
    try {
      const groupToDelete = groups.find((g) => g.id === groupId);
      await groupsAPI.delete(groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      // Refresh users to reflect removed assignments
      await refreshUsers().catch(() => {});
      addActivity({
        type: "group_deleted",
        message: `Admin deleted group: ${groupToDelete?.name || groupId}`,
        icon: "🗑️",
      })
      return true;
    } catch (error) {
      throw new Error(error.message || "Failed to delete group");
    }
  }

  // Membership management (safer flow): update user assignment, then refresh groups
  const assignUserToGroup = async (userId, groupId) => {
    try {
      const group = groups.find((g) => g.id === groupId);
      const userObj = users.find((u) => u.id === userId);
      if (!group || !userObj) {
        throw new Error("User or group not found");
      }

      // Update only the user assignment
      const updatedUser = await usersAPI.update(userId, { groupId, groupName: group.name });
      const userWithGroup = {
        ...userObj,
        ...updatedUser,
        groupId: updatedUser?.groupId ?? groupId,
        groupName: updatedUser?.groupName ?? group.name,
        password: userObj.password || userPasswords?.[userId],
      }
      const optimisticUsers = users.map((u) => (u.id === userId ? userWithGroup : u));
      setUsers(optimisticUsers);

      // Re-fetch groups to reflect server-side membership computation
      const refreshedGroups = await refreshGroups(optimisticUsers);
      const updatedGroup = refreshedGroups.find((g) => g.id === groupId) || group;

      addActivity({
        type: "member_added",
        message: `Added ${userObj.name} to ${updatedGroup.name}`,
        icon: "➕",
      })

      return updatedGroup;
    } catch (error) {
      await Promise.allSettled([refreshGroups(), refreshUsers()]);
      throw new Error(error.message || "Failed to assign user to group");
    }
  }

  const removeUserFromGroup = async (userId, groupId) => {
    try {
      const group = groups.find((g) => g.id === groupId);
      const userObj = users.find((u) => u.id === userId);
      if (!group) {
        throw new Error("Group not found");
      }

      // Clear user assignment
      const updatedUser = await usersAPI.update(userId, { groupId: null, groupName: null });
      const userWithoutGroup = {
        ...userObj,
        ...updatedUser,
        groupId: null,
        groupName: "",
        password: userObj?.password || userPasswords?.[userId],
      }
      const optimisticUsers = users.map((u) => (u.id === userId ? userWithoutGroup : u));
      setUsers(optimisticUsers);

      // Re-fetch groups to get updated membership
      const refreshedGroups = await refreshGroups(optimisticUsers);
      const updatedGroup = refreshedGroups.find((g) => g.id === groupId) || group;

      addActivity({
        type: "member_removed",
        message: `Removed ${userObj?.name || "User"} from ${group.name}`,
        icon: "➖",
      })

      return updatedGroup;
    } catch (error) {
      await Promise.allSettled([refreshGroups(), refreshUsers()]);
      throw new Error(error.message || "Failed to remove user from group");
    }
  }

  // Message management functions
  const addMessage = (messageData) => {
    const newMessage = {
      ...messageData,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, newMessage])

    addActivity({
      type: "message_sent",
      message: `Admin sent message to group`,
      icon: "💬",
    })
  }

  const updateStats = useCallback((newStats) => {
    setStats((prev) => ({ ...prev, ...newStats }))
  }, [])

  // Dua management functions
  const refreshDuas = useCallback(async (filters = {}) => {
    try {
      const data = await duasAPI.getAll(filters);
      console.log('Raw data from API:', data);
      // Ensure translation field is parsed as object if it's a string
      const processedData = data.map(dua => {
        const processedDua = {
          ...dua,
          translation: typeof dua.translation === 'string' 
            ? (() => {
                try {
                  const parsed = JSON.parse(dua.translation);
                  console.log('Successfully parsed translation for dua:', dua.id, parsed);
                  return parsed;
                } catch (e) {
                  console.error('Failed to parse translation:', dua.translation, e);
                  return { english: '', amharic: '', oromo: '' };
                }
              })()
            : dua.translation,
          // Ensure audio URLs are properly formatted
          audio: dua.audio && !dua.audio.startsWith('http') 
            ? `${API_BASE_URL}${dua.audio.startsWith('/') ? '' : '/'}${dua.audio}` 
            : dua.audio
        };
        console.log('Processed dua:', processedDua.id, 'translation:', processedDua.translation, 'audio:', processedDua.audio);
        return processedDua;
      });
      console.log('Final processed data:', processedData);
      setDuas(processedData);
      return processedData;
    } catch (error) {
      throw new Error(error.message || "Failed to fetch duas");
    }
  }, []);

  const refreshDuaCategories = useCallback(async () => {
    try {
      const data = await duasAPI.getCategories();
      setDuaCategories(data || []);
      return data;
    } catch (error) {
      throw new Error(error.message || "Failed to fetch dua categories");
    }
  }, []);

  const addDua = async (duaData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', duaData.title);
      formData.append('arabic', duaData.arabic);
      formData.append('category', duaData.category);
      formData.append('translation', JSON.stringify(duaData.translation));
      
      // Add audio file if provided
      if (duaData.audioFile) {
        formData.append('audio', duaData.audioFile);
      }

      const created = await duasAPI.create(formData);
      setDuas((prev) => [...prev, created]);
      addActivity({
        type: "dua_added",
        message: `Admin added new dua: ${created.title}`,
        icon: "📿",
      });
      return created;
    } catch (error) {
      throw new Error(error.message || "Failed to add dua");
    }
  }

  const updateDua = async (duaId, duaData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', duaData.title);
      formData.append('arabic', duaData.arabic);
      formData.append('category', duaData.category);
      formData.append('translation', JSON.stringify(duaData.translation));
      
      // Add audio file if provided (optional for updates)
      if (duaData.audioFile) {
        formData.append('audio', duaData.audioFile);
      }

      const updated = await duasAPI.update(duaId, formData);
      setDuas((prev) => prev.map((d) => (d.id === duaId ? updated : d)));
      addActivity({
        type: "dua_updated",
        message: `Admin updated dua: ${updated.title}`,
        icon: "✏️",
      });
      return updated;
    } catch (error) {
      throw new Error(error.message || "Failed to update dua");
    }
  }

  const deleteDua = async (duaId) => {
    try {
      const duaToDelete = duas.find((d) => d.id === duaId);
      await duasAPI.delete(duaId);
      setDuas((prev) => prev.filter((d) => d.id !== duaId));
      addActivity({
        type: "dua_deleted",
        message: `Admin deleted dua: ${duaToDelete?.title || duaId}`,
        icon: "🗑️",
      });
      return true;
    } catch (error) {
      throw new Error(error.message || "Failed to delete dua");
    }
  }

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      sidebarCollapsed,
      notifications,
      stats,
      recentActivities,
      currentPage,
      fcmToken,
      users,
      groups,
      messages,
      duas,
      duaCategories,
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
      refreshUsers,
      refreshGroups,
      assignUserToGroup,
      removeUserFromGroup,
      addMessage,
      updateStats,
      refreshDuas,
      refreshDuaCategories,
      addDua,
      updateDua,
      deleteDua,
    }),
    [isAuthenticated, user, sidebarCollapsed, notifications, stats, recentActivities, currentPage, fcmToken, users, groups, messages, duas, duaCategories, login, logout, toggleSidebar, addNotification, removeNotification, addActivity, updateCurrentPage, addUser, updateUser, deleteUser, addGroup, updateGroup, deleteGroup, refreshUsers, refreshGroups, assignUserToGroup, removeUserFromGroup, addMessage, updateStats, refreshDuas, refreshDuaCategories, addDua, updateDua, deleteDua]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
