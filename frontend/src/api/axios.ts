import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Create an Axios instance with default configurations
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3002',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage if it exists
    const token = localStorage.getItem('auth-storage')
      ? JSON.parse(localStorage.getItem('auth-storage') || '{}').state?.token
      : null;
    
    // If token exists, add it to the headers
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 (Unauthorized) responses
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login page
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    
    // Handle 503 (Service Unavailable) responses
    if (error.response && error.response.status === 503) {
      console.error('Service temporarily unavailable');
      // Implement service unavailable notification here
    }
    
    return Promise.reject(error);
  }
);

export { axiosInstance };
export default axiosInstance; 