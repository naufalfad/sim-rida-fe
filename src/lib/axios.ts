import axios from 'axios';

// Resolve base URL for SIM-RIDA Backend API (default to /api/v1)
const rawBaseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const baseURL = rawBaseURL.endsWith('/v1')
  ? rawBaseURL
  : rawBaseURL.endsWith('/api')
  ? `${rawBaseURL}/v1`
  : rawBaseURL;

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Bearer token to every request header
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor for responses (handle 401 unauthenticated globally)
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
