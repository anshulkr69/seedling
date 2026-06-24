import axios from 'axios';
import { supabase } from '../supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://seedling-node-server.onrender.com';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const session = (await supabase.auth.getSession()).data.session;
    const token = session?.access_token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('Axios Interceptor Warning: Access token is missing or undefined for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

