import axios from 'axios';

const client = axios.create({
  // Use Vite proxy in development by default; allow overrides via env.
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000, // 30 second timeout
});

// Request interceptor — attach auth token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('knightcode_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 (expired/invalid token)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is expired or invalid — clear it and redirect to login
      const token = localStorage.getItem('knightcode_token');
      if (token) {
        localStorage.removeItem('knightcode_token');
        // Only redirect if not already on login/register pages
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
