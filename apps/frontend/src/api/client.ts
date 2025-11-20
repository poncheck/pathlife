import axios from 'axios';
import type { DiaryEntry, SyncLog } from '../types';

// Use relative URL so nginx can proxy requests to backend
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('authToken');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const diaryApi = {
  // Get diary entry for a specific date
  getEntry: async (date: string): Promise<DiaryEntry> => {
    const response = await api.get(`/api/diary/entries/${date}`);
    return response.data;
  },

  // Get entries for a date range
  getEntries: async (startDate: string, endDate: string): Promise<DiaryEntry[]> => {
    const response = await api.get('/api/diary/entries', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Get "On this day" entries
  getOnThisDay: async (date: string): Promise<DiaryEntry[]> => {
    const response = await api.get(`/api/diary/on-this-day/${date}`);
    return response.data;
  },

  // Update diary entry description
  updateDescription: async (date: string, description: string): Promise<DiaryEntry> => {
    const response = await api.patch(`/api/diary/entries/${date}`, { description });
    return response.data;
  },

  // Toggle photo selection
  togglePhoto: async (photoId: string) => {
    const response = await api.patch(`/api/diary/photos/${photoId}/toggle`);
    return response.data;
  },

  // Get sync logs
  getSyncLogs: async (): Promise<SyncLog[]> => {
    const response = await api.get('/api/diary/sync-logs');
    return response.data;
  },
};

export const syncApi = {
  // Trigger manual sync
  sync: async (startDate: string, endDate?: string) => {
    const response = await api.post('/api/sync', { startDate, endDate });
    return response.data;
  },

  // Sync today
  syncToday: async () => {
    const response = await api.post('/api/sync/today');
    return response.data;
  },

  // Sync last N days
  syncLastDays: async (days: number) => {
    const response = await api.post(`/api/sync/last-days/${days}`);
    return response.data;
  },

  // Sync all sources (last 30 days)
  syncAll: async () => {
    const response = await api.post('/api/sync/all');
    return response.data;
  },

  // Test connections
  testConnections: async () => {
    const response = await api.get('/api/sync/test-connections');
    return response.data;
  },
};

export default api;
