// src/contexts/AppContext.js

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react"
import { authAPI, usersAPI, groupsAPI, duasAPI } from "../services/api"
// Firebase imports for push notifications
import { requestForToken, onMessageListener } from "../firebase"

// API service with authentication
const API_BASE_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'http://69.62.109.18:3001';
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
          if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            logout();
          }
        }
      }
    };
    loadData();
  }, [isAuthenticated]);

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

  const logout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminUser")
    setAuthToken(null);
    setIsAuthenticated(false)
    setCurrentUser(null)
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
      const amirMember = amirUser ? { id: amirUser.id, name: amirUser.name, phone: amirUser.phone, role: "amir", joinedAt: new Date().toISOString().split("T")[0] } : null;
      const payload = { ...groupData, amir: amirUser ? amirUser.id : null, createdAt: new Date().toISOString().split("T")[0], members: amirMember ? [amirMember] : [], totalMembers: amirMember ? 1 : 0, activeMembers: 0, location: groupData.location || "Not set", lastActivity: new Date().toISOString() };
      const created = await groupsAPI.create(payload);
      const createdForState = { ...created, amir: groupData.amir };
      const normalizedCreated = ensureAmirMember(createdForState, users);
      setGroups((prev) => [...prev, normalizedCreated]);
      if (amirUser) {
        try {
          const updatedAmir = await usersAPI.update(amirUser.id, { groupId: created.id, groupName: created.name });
          setUsers((prev) => prev.map((u) => (u.id === updatedAmir.id ? updatedAmir : u)));
        } catch (e) {
          console.error("Failed to update amir user's group assignment:", e);
          await refreshUsers().catch(() => {});
        }
      }
      addActivity({ type: "group_created", message: `Admin created new group: ${created.name}`, icon: "🏕️" });
      return created;
    } catch (error) {
      throw new Error(error.message || "Failed to add group");
    }
  }

  const updateGroup = async (groupId, groupData) => {
    try {
      const payload = { ...groupData, lastActivity: new Date().toISOString() };
      if (groupData.amir) {
        const amirUser = users.find(u => u.name === groupData.amir);
        if (amirUser) {
          payload.amir = amirUser.id;
        } else {
          throw new Error(`Amir "${groupData.amir}" not found.`);
        }
      }
      const updated = await groupsAPI.update(groupId, payload);
      const updatedForState = { ...updated, amir: groupData.amir || groups.find(g => g.id === groupId)?.amir };
      const normalized = ensureAmirMember(updatedForState, users);
      setGroups((prev) => prev.map((g) => (g.id === groupId ? normalized : g)));
      addActivity({ type: "group_updated", message: `Admin updated group: ${normalized.name}`, icon: "✏️" });
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
      await refreshUsers().catch(() => {});
      addActivity({ type: "group_deleted", message: `Admin deleted group: ${groupToDelete?.name || groupId}`, icon: "🗑️" });
      return true;
    } catch (error) {
      throw new Error(error.message || "Failed to delete group");
    }
  }

  const assignUserToGroup = async (userId, groupId) => {
    try {
      const group = groups.find((g) => g.id === groupId);
      const userObj = users.find((u) => u.id === userId);
      if (!group || !userObj) {
        throw new Error("User or group not found");
      }
      const updatedUser = await usersAPI.update(userId, { groupId, groupName: group.name });
      const userWithGroup = { ...userObj, ...updatedUser, groupId: updatedUser?.groupId ?? groupId, groupName: updatedUser?.groupName ?? group.name, password: userObj.password || userPasswords?.[userId] };
      const optimisticUsers = users.map((u) => (u.id === userId ? userWithGroup : u));
      setUsers(optimisticUsers);
      const refreshedGroups = await refreshGroups(optimisticUsers);
      const updatedGroup = refreshedGroups.find((g) => g.id === groupId) || group;
      addActivity({ type: "pilgrim_added", message: `Added ${userObj.name} to ${updatedGroup.name}`, icon: "➕" });
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
      if (!group) { throw new Error("Group not found"); }
      const updatedUser = await usersAPI.update(userId, { groupId: null, groupName: null });
      const userWithoutGroup = { ...userObj, ...updatedUser, groupId: null, groupName: "", password: userObj?.password || userPasswords?.[userId] };
      const optimisticUsers = users.map((u) => (u.id === userId ? userWithoutGroup : u));
      setUsers(optimisticUsers);
      const refreshedGroups = await refreshGroups(optimisticUsers);
      const updatedGroup = refreshedGroups.find((g) => g.id === groupId) || group;
      addActivity({ type: "pilgrim_removed", message: `Removed ${userObj?.name || "User"} from ${group.name}`, icon: "➖" });
      return updatedGroup;
    } catch (error) {
      await Promise.allSettled([refreshGroups(), refreshUsers()]);
      throw new Error(error.message || "Failed to remove user from group");
    }
  }

  const addMessage = (messageData) => {
    // Prevent duplicates from race conditions
    setMessages((prev) => prev.some(m => m.id === messageData.id) ? prev : [...prev, messageData]);
    addActivity({ type: "message_sent", message: `Admin sent message to group`, icon: "💬" });
  }

  const setMessagesForGroup = (groupId, newMessages) => {
    setMessages(prevMessages => {
      const otherGroupMessages = prevMessages.filter(m => m.groupId !== groupId);
      return [...otherGroupMessages, ...newMessages];
    });
  };

  const updateStats = useCallback((newStats) => {
    setStats((prev) => ({ ...prev, ...newStats }))
  }, [])

  const refreshDuas = useCallback(async (filters = {}) => {
    try {
      const data = await duasAPI.getAll(filters);
      const processedData = data.map(dua => ({
        ...dua,
        translation: typeof dua.translation === 'string' ? JSON.parse(dua.translation) : dua.translation,
        audio: dua.audio && !dua.audio.startsWith('http') ? `${API_BASE_URL}${dua.audio.startsWith('/') ? '' : '/'}${dua.audio}` : dua.audio
      }));
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
      formData.append('title', duaData.title);
      formData.append('arabic', duaData.arabic);
      formData.append('category', duaData.category);
      if (duaData.translation && typeof duaData.translation === 'object') {
        for (const key in duaData.translation) {
          formData.append(`translation[${key}]`, duaData.translation[key] || '');
        }
      }
      if (duaData.audioFile) {
        formData.append('audio', duaData.audioFile);
      }
      const created = await duasAPI.create(formData);
      await refreshDuas();
      addActivity({ type: "dua_added", message: `Admin added new dua: ${created.title}`, icon: "📿" });
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
          formData.append(`translation[${key}]`, duaData.translation[key] || '');
        }
      }
      if (duaData.audioFile) {
        formData.append('audio', duaData.audioFile);
      }
      const updated = await duasAPI.update(duaId, formData);
      await refreshDuas();
      addActivity({ type: "dua_updated", message: `Admin updated dua: ${updated.title}`, icon: "✏️" });
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
      addActivity({ type: "dua_deleted", message: `Admin deleted dua: ${duaToDelete?.title || duaId}`, icon: "🗑️" });
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
      setMessagesForGroup,
      updateStats,
      refreshDuas,
      refreshDuaCategories,
      addDua,
      updateDua,
      deleteDua,
    }),
    [isAuthenticated, currentUser, authToken, sidebarCollapsed, notifications, stats, recentActivities, currentPage, fcmToken, users, groups, messages, duas, duaCategories, logout, toggleSidebar, addNotification, removeNotification, addActivity, updateCurrentPage, addUser, updateUser, deleteUser, addGroup, updateGroup, deleteGroup, refreshUsers, refreshGroups, assignUserToGroup, removeUserFromGroup, addMessage, updateStats, refreshDuas, refreshDuaCategories, addDua, updateDua, deleteDua]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}