// src/contexts/AppContext.js

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react"
import { authAPI, usersAPI, groupsAPI, duasAPI, UNAUTHORIZED_EVENT } from "../services/api"
// Firebase imports for push notifications
import { requestForToken, onMessageListener } from "../firebase"

// API service with authentication
const API_BASE_URL = 'http://69.62.109.18:3001';
console.log('Using API base URL:', API_BASE_URL);

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
  if (!group) return group;

  const amirUser = usersList.find(user => user.id === group.amir);

  const groupWithAmirName = {
    ...group,
    amir: amirUser ? amirUser.name : group.amir,
  };

  const members = Array.isArray(group.members) ? [...group.members] : [];
  const amirId = group?.amir;

  const hasAmir = members.some(member => String(member.id) === String(amirId));

  if (hasAmir) {
    return {
      ...groupWithAmirName,
      members,
      totalMembers: group.totalMembers ?? members.length,
    };
  }

  const amirMember = amirUser
    ? {
        id: amirUser.id,
        name: amirUser.name,
        phone: amirUser.phone ?? "",
        role: "amir",
        joinedAt: amirUser.joinedAt || new Date().toISOString().split("T")[0],
      }
    : {
        id: amirId,
        name: "Group Amir (User not found)",
        phone: "",
        role: "amir",
        joinedAt: new Date().toISOString().split("T")[0],
      };

  const updatedMembers = [amirMember, ...members];

  return {
    ...groupWithAmirName,
    members: updatedMembers,
    totalMembers: Math.max(updatedMembers.length, group.totalMembers ?? 0),
  };
};

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

const normalizeDua = (dua) => {
  const translation = typeof dua?.translation === 'string'
    ? (() => {
        try {
          return JSON.parse(dua.translation);
        } catch (e) {
          console.error('Failed to parse translation:', dua.translation, e);
          return { english: '', amharic: '', oromo: '' };
        }
      })()
    : dua?.translation;

  const normalizedAudioPath = typeof dua?.audio === 'string'
    ? dua.audio.replace(/\\/g, '/')
    : dua?.audio;

  const audio = normalizedAudioPath && typeof normalizedAudioPath === 'string' && !normalizedAudioPath.startsWith('http')
    ? `${API_BASE_URL}${normalizedAudioPath.startsWith('/') ? '' : '/'}${normalizedAudioPath}`
    : normalizedAudioPath;

  return {
    ...dua,
    translation,
    audio,
  };
};

export const AppProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("adminToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("adminToken"))
  const [currentUser, setCurrentUser] = useState(() => {
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

  const logout = useCallback(() => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminUser")
    setAuthToken(null);
    setIsAuthenticated(false)
    setCurrentUser(null)
    setUsers([]);
    setGroups([]);
    setMessages([]);
  }, []);

  const loadInitialData = useCallback(async () => {
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
      setDuas((duasResponse || []).map(normalizeDua));
      setDuaCategories(categoriesResponse || []);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      if (error.response?.status === 401 || error.message?.includes('401')) {
        logout();
      }
    }
  }, [userPasswords, logout, normalizeDua]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      setIsAuthenticated(true);
      loadInitialData();
    }
  }, [loadInitialData]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [logout]);

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
      setAuthToken(token);
      setIsAuthenticated(true);
      setCurrentUser(userData);
      await loadInitialData();

      try {
        const fcmTokenValue = await requestForToken();
        if (fcmTokenValue) {
          setFcmToken(fcmTokenValue);
          console.log('FCM Token obtained:', fcmTokenValue);
        }
      } catch (error) {
        console.error('Failed to get FCM token:', error);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || "Login failed" };
    }
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
    setRecentActivities((prev) => [newActivity, ...prev.slice(0, 9)])
  }, [])

  const updateCurrentPage = (page) => {
    setCurrentPage(page)
  }

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

  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = onMessageListener((payload) => {
        console.log('Foreground message received:', payload);
        const title = payload?.notification?.title || 'Umrah Admin Notification';
        const body = payload?.notification?.body || 'You have a new notification';
        alert(`${title}\n\n${body}`);
      });
      return unsubscribe;
    }
  }, [isAuthenticated]);

  const addUser = async (userData) => {
    try {
      const password = (userData?.password || "").trim() || generateRandomPassword()
      const payload = {
        name: userData?.name?.trim(),
        email: userData?.email?.trim(),
        phone: userData?.phone?.trim(),
        role: userData?.role || "pilgrim",
        emergencyContact: userData?.emergencyContact?.trim(),
        password,
      };
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
      const payload = { ...userData };
      if (payload.email === "") {
        delete payload.email;
      }

      const updated = await usersAPI.update(userId, payload);
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

  const addGroup = async (groupData) => {
    try {
      const amirUser = users.find((u) => u.name === groupData.amir);
      const payload = {
        ...groupData,
        amir: amirUser ? amirUser.id : null,
      };

      const created = await groupsAPI.create(payload);

      if (amirUser) {
        await usersAPI.update(amirUser.id, {
          groupId: created.id,
        }).catch(e => console.error("Failed to update amir user's group assignment:", e));
      }

      await refreshGroups();
      await refreshUsers();

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
      const payload = { ...groupData };

      if (groupData.amir) {
        const amirUser = users.find(u => u.name === groupData.amir);
        if (amirUser) {
          payload.amir = amirUser.id;
        } else {
          throw new Error(`Amir "${groupData.amir}" not found.`);
        }
      }

      await groupsAPI.update(groupId, payload);
      await refreshGroups();

      addActivity({
        type: "group_updated",
        message: `Admin updated group: ${groupData.name}`,
        icon: "✏️",
      })
    } catch (error) {
      throw new Error(error.message || "Failed to update group");
    }
  }

  const deleteGroup = async (groupId) => {
    try {
      const groupToDelete = groups.find((g) => g.id === groupId);
      await groupsAPI.delete(groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
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

  const assignUserToGroup = async (userId, groupId) => {
    try {
      const group = groups.find((g) => g.id === groupId);
      if (!group) throw new Error("Group not found");

      await usersAPI.update(userId, { groupId });
      await Promise.all([refreshGroups(), refreshUsers()]);

      addActivity({
        type: "pilgrim_added",
        message: `Added user to ${group.name}`,
        icon: "➕",
      })
    } catch (error) {
      await Promise.allSettled([refreshGroups(), refreshUsers()]);
      throw new Error(error.message || "Failed to assign user to group");
    }
  }

  const removeUserFromGroup = async (userId, groupId) => {
    try {
      const group = groups.find((g) => g.id === groupId);
      if (!group) throw new Error("Group not found");

      await usersAPI.update(userId, { groupId: null });
      await Promise.all([refreshGroups(), refreshUsers()]);

      addActivity({
        type: "pilgrim_removed",
        message: `Removed user from ${group.name}`,
        icon: "➖",
      })
    } catch (error) {
      await Promise.allSettled([refreshGroups(), refreshUsers()]);
      throw new Error(error.message || "Failed to remove user from group");
    }
  }

  // ========================= MESSAGE ORDERING FIX =========================
  // The global state functions are now simplified. The Chat component will handle
  // its own state for real-time updates. These functions are kept for other
  // potential uses or can be removed if chat is the only consumer.
  const addMessage = useCallback((messageData) => {
    setMessages((prev) => [...prev, messageData]);
  }, []);
  
  const setMessagesForGroup = useCallback((groupId, newMessages) => {
    setMessages(prevMessages => {
      const otherGroupMessages = prevMessages.filter(m => m.groupId !== groupId);
      const sortedNewMessages = newMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return [...otherGroupMessages, ...sortedNewMessages];
    });
  }, []);
  // ======================================================================

  const updateStats = useCallback((newStats) => {
    setStats((prev) => ({ ...prev, ...newStats }))
  }, [])

  const refreshDuas = useCallback(async (filters = {}) => {
    try {
      const data = await duasAPI.getAll(filters);
      const processedData = (data || []).map(normalizeDua);

      setDuas(processedData);
      return processedData;
    } catch (error) {
      throw new Error(error.message || "Failed to fetch duas");
    }
  }, [normalizeDua]);

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
      
      formData.append('title', duaData.title);
      formData.append('arabic', duaData.arabic);
      formData.append('category', duaData.category);

      if (duaData.translation && typeof duaData.translation === 'object') {
        for (const key in duaData.translation) {
          if (Object.prototype.hasOwnProperty.call(duaData.translation, key)) {
            formData.append(`translation[${key}]`, duaData.translation[key] || '');
          }
        }
      }
      
      if (duaData.audioFile) {
        formData.append('audio', duaData.audioFile);
      }

      const created = await duasAPI.create(formData);
      await refreshDuas();
      addActivity({
        type: "dua_added",
        message: `Admin added new dua: ${created.title}`,
        icon: "📿",
      });
      return created;
    } catch (error) {
      throw new Error(error.response?.data?.message?.[0] || error.message || "Failed to add dua");
    }
  }

  const updateDua = async (duaId, duaData) => {
    try {
      const formData = new FormData();
      
      formData.append('title', duaData.title);
      formData.append('arabic', duaData.arabic);
      formData.append('category', duaData.category);

      if (duaData.translation && typeof duaData.translation === 'object') {
        for (const key in duaData.translation) {
          if (Object.prototype.hasOwnProperty.call(duaData.translation, key)) {
            formData.append(`translation[${key}]`, duaData.translation[key] || '');
          }
        }
      }
      
      if (duaData.audioFile) {
        formData.append('audio', duaData.audioFile);
      }

      const updated = await duasAPI.update(duaId, formData);
      await refreshDuas();
      addActivity({
        type: "dua_updated",
        message: `Admin updated dua: ${updated.title}`,
        icon: "✏️",
      });
      return updated;
    } catch (error) {
      throw new Error(error.response?.data?.message?.[0] || error.message || "Failed to update dua");
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
      currentUser,
      authToken,
      sidebarCollapsed,
      notifications,
      stats,
      recentActivities,
      currentPage,
      fcmToken,
      users,
      groups,
      messages, // Still provided for other potential components
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
      addMessage, // Still provided
      setMessagesForGroup, // Still provided
      updateStats,
      refreshDuas,
      refreshDuaCategories,
      addDua,
      updateDua,
      deleteDua,
    }),
    [isAuthenticated, currentUser, authToken, sidebarCollapsed, notifications, stats, recentActivities, currentPage, fcmToken, users, groups, messages, duas, duaCategories, addMessage, setMessagesForGroup, addActivity, addDua, addGroup, addNotification, addUser, assignUserToGroup, deleteDua, deleteGroup, deleteUser, login, logout, refreshDuaCategories, refreshDuas, refreshGroups, refreshUsers, removeNotification, removeUserFromGroup, toggleSidebar, updateCurrentPage, updateDua, updateGroup, updateStats, updateUser]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}