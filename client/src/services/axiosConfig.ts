import axios from 'axios';

const instance = axios.create({
  // Use Vite dev proxy (same origin) so Sanctum cookies/CSRF work reliably
  baseURL: import.meta.env.DEV ? '' : 'http://localhost:8000',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  withXSRFToken: true,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
