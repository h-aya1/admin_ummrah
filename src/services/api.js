// Minimal mock API layer to unblock UI. Replace with real HTTP later.

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export const usersAPI = {
  async getAll() {
    await delay(300);
    return { data: [
      { id: 'u1', name: 'Ahmed Ali', email: 'ahmed@example.com', role: 'Pilgrim', status: 'active', group: { id: 'g1', name: 'Group A' } },
      { id: 'u2', name: 'Sara Khan', email: 'sara@example.com', role: 'Pilgrim', status: 'active', group: { id: 'g1', name: 'Group A' } },
    ] };
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


