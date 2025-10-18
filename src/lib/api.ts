const API_BASE_URL = 'http://localhost:3001/api';
const DEMO_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': DEMO_USER_ID,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

export const api = {
  costEntries: {
    list: () => fetchAPI('/cost-entries'),
    create: (data: any) =>
      fetchAPI('/cost-entries', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  sales: {
    sync: (data: any) =>
      fetchAPI('/sales/sync', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  dashboard: {
    get: () => fetchAPI('/dashboard'),
  },

  products: {
    list: () => fetchAPI('/products'),
  },
};
