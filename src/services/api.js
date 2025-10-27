// API service with authentication
export const API_BASE_URL =
  window.location.hostname === 'localhost'
    ? 'http://69.62.109.18:3001'
    : 'http://localhost:3000';
console.log('Using API base URL:', API_BASE_URL);

export const getAssetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedBase = API_BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedPath}`;
};

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper for API calls with file uploads
const apiCallWithFiles = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  // Don't set Content-Type for FormData, let browser set it
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let message = '';
    try {
      const text = await response.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          message = data?.message || data?.error || data?.errors?.[0]?.message || '';
        } catch {
          message = text; // non-JSON body
        }
      }
    } catch {
      // ignore
    }
    const statusInfo = `${response.status} ${response.statusText}`;
    throw new Error(message ? `${statusInfo} - ${message}` : statusInfo);
  }

  // No content
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  return response.json().catch(() => null);
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
    let message = '';
    try {
      const text = await response.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          message = data?.message || data?.error || data?.errors?.[0]?.message || '';
        } catch {
          message = text; // non-JSON body
        }
      }
    } catch {
      // ignore
    }
    const statusInfo = `${response.status} ${response.statusText}`;
    throw new Error(message ? `${statusInfo} - ${message}` : statusInfo);
  }

  // No content
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  return response.json().catch(() => null);
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

// Users API
export const usersAPI = {
  async getAll() {
    return apiCall('/admin/users'); // GET all users (admin route)
  },

  async getById(id) {
    return apiCall(`/admin/users/${id}`);
  },

  async create(payload) {
    return apiCall('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async update(id, payload) {
    return apiCall(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async delete(id) {
    return apiCall(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Groups API
export const groupsAPI = {
  async getAll() {
    return apiCall('/admin/groups'); // GET all groups (admin route)
  },

  async create(payload) {
    return apiCall('/admin/groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async update(id, payload) {
    return apiCall(`/admin/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async delete(id) {
    return apiCall(`/admin/groups/${id}`, {
      method: 'DELETE',
    });
  },
};


//Duas
export const duasAPI = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    const queryString = params.toString();
    return apiCall(`/duas${queryString ? `?${queryString}` : ''}`);
  },
  async getCategories() {
    return apiCall('/duas/categories');
  },
  async getOne(id) {
    return apiCall(`/duas/${id}`);
  },
  async create(formData) {
    return apiCallWithFiles('/duas', {
      method: 'POST',
      body: formData,
    });
  },
  async update(id, formData) {
    return apiCallWithFiles(`/duas/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },
  async delete(id) {
    return apiCall(`/duas/${id}`, {
      method: 'DELETE',
    });
  },
};

export const placesAPI = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.city) params.append('city', filters.city);
    const queryString = params.toString();
    return apiCall(`/places${queryString ? `?${queryString}` : ''}`);
  },

  async getById(id) {
    return apiCall(`/places/${id}`);
  },

  async create(payload) {
    return apiCall('/places', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async update(id, payload) {
    return apiCall(`/places/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async delete(id) {
    return apiCall(`/places/${id}`, {
      method: 'DELETE',
    });
  },
};

export const guidesAPI = {
  async getAll() {
    return apiCall('/guides');
  },

  async getById(id) {
    return apiCall(`/guides/${id}`);
  },

  async create(formData) {
    return apiCallWithFiles('/guides', {
      method: 'POST',
      body: formData,
    });
  },

  // JSON variants for strict validators when no files are included
  async createJson(payload) {
    return apiCall('/guides', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async update(id, formData) {
    return apiCallWithFiles(`/guides/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  async updateJson(id, payload) {
    return apiCall(`/guides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async delete(id) {
    return apiCall(`/guides/${id}`, {
      method: 'DELETE',
    });
  },
};

export const stepsAPI = {
  async getAll(guideId = null) {
    const query = guideId ? `?guideId=${guideId}` : '';
    return apiCall(`/guides/steps${query}`);
  },

  async getById(id) {
    return apiCall(`/guides/steps/${id}`);
  },

  async create(formData) {
    // Ensure image field exists even if empty
    if (!formData.has('image')) {
      formData.append('image', '');
    }
    return apiCallWithFiles('/guides/steps', {
      method: 'POST',
      body: formData,
    });
  },

  async update(id, formData) {
    return apiCallWithFiles(`/guides/steps/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  async delete(id) {
    return apiCall(`/guides/steps/${id}`, {
      method: 'DELETE',
    });
  },
};

export const locationAPI = {
  async getAllUserLocations() {
    return apiCall('/location/all-users');
  },

  async getGroupMemberLocations() {
    return apiCall('/location/group-members');
  },
};

export const analyticsAPI = {
  async overview() {
    await delay(250);
    return { data: { users: 0, groups: 0 } };
  }
};

export const notificationsAPI = {
  async getAll() {
    return apiCall('/notifications'); // GET all notifications
  },

  async create(payload) {
    return apiCall('/notifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async delete(id) {
    return apiCall(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};
