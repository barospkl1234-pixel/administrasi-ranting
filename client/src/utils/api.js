const BASE_URL = '/api';

export async function fetchApi(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Terjadi kesalahan saat memproses data');
  }
  return data;
}

export const api = {
  getDashboard: () => fetchApi('/dashboard'),
  
  // Members
  getMembers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/members?${query}`);
  },
  getMember: (id) => fetchApi(`/members/${id}`),
  createMember: (data) => fetchApi('/members', { method: 'POST', body: JSON.stringify(data) }),
  updateMember: (id, data) => fetchApi(`/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMember: (id) => fetchApi(`/members/${id}`, { method: 'DELETE' }),

  // Letters
  getLetters: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/letters?${query}`);
  },
  getSuggestedLetterNumber: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/letters/generate-number?${query}`);
  },
  createLetter: (data) => fetchApi('/letters', { method: 'POST', body: JSON.stringify(data) }),
  deleteLetter: (id) => fetchApi(`/letters/${id}`, { method: 'DELETE' }),

  // Finances
  getFinances: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/finances?${query}`);
  },
  createFinance: (data) => fetchApi('/finances', { method: 'POST', body: JSON.stringify(data) }),
  deleteFinance: (id) => fetchApi(`/finances/${id}`, { method: 'DELETE' }),

  // Events & Attendance
  getEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/events?${query}`);
  },
  createEvent: (data) => fetchApi('/events', { method: 'POST', body: JSON.stringify(data) }),
  toggleAttendance: (eventId, memberId) => fetchApi(`/events/${eventId}/attendance`, { 
    method: 'POST', 
    body: JSON.stringify({ memberId }) 
  }),
  deleteEvent: (id) => fetchApi(`/events/${id}`, { method: 'DELETE' }),

  // Inventory
  getInventory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/inventory?${query}`);
  },
  createInventory: (data) => fetchApi('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  updateInventory: (id, data) => fetchApi(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInventory: (id) => fetchApi(`/inventory/${id}`, { method: 'DELETE' }),

  // Settings & Backup
  getSettings: () => fetchApi('/settings'),
  updateSettings: (data) => fetchApi('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  importBackup: (data) => fetchApi('/settings/import-backup', { method: 'POST', body: JSON.stringify(data) })
};

