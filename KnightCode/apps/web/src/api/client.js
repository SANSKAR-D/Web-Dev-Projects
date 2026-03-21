import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:3001/api', // Match API port in docker/architecture
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('knightcode_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
