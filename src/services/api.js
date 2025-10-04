// API service with authentication
const API_BASE_URL = 'http://localhost:3000'; // Adjust if needed

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper for API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

export const authAPI = {
  async loginAdmin(email, password) {
    return apiCall('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async registerUser(userData) {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
};

export const usersAPI = {
  async getAll() {
    return apiCall('/admin/users');
  },
};

export const groupsAPI = {
  async getAll() {
    await delay(300);
    return { data: [
      { id: 'g1', name: 'Group A', status: 'active', members: [{ id: 'u1' }, { id: 'u2' }], amir: { id: 'a1', name: 'Ustadh Bilal' }, createdAt: new Date().toISOString() },
      { id: 'g2', name: 'Group B', status: 'inactive', members: [{ id: 'u3' }], amir: null, createdAt: new Date().toISOString() },
    ] };
  },
};

export const duasAPI = {
  async getAll() {
    await delay(300);
    return { data: [] };
  },
  async create(payload) {
    await delay(200);
    return { data: { id: Math.random().toString(36).slice(2), ...payload } };
  },
  async update(id, payload) {
    await delay(200);
    return { data: { id, ...payload } };
  },
  async delete() {
    await delay(150);
    return { ok: true };
  },
};

export const guidesAPI = {
  async getAll() {
    await delay(300);
    return { data: [] };
  },
  async create(payload) {
    await delay(200);
    return { data: { id: Math.random().toString(36).slice(2), ...payload } };
  },
  async update(id, payload) {
    await delay(200);
    return { data: { id, ...payload } };
  },
  async delete() {
    await delay(150);
    return { ok: true };
  },
};

export const analyticsAPI = {
  async overview() {
    await delay(250);
    return { data: { users: 0, groups: 0 } };
  }
};


