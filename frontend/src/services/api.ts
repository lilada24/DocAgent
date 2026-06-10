import axios from 'axios';
import { settingsService } from './settingsService';

const api = axios.create({
  baseURL: '/api',
  timeout: 300000,
  // 不设默认 Content-Type：axios 对 JSON body 自动加 application/json，
  // 对 FormData 则让浏览器自动加 multipart/form-data（含 boundary）
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 添加 API 设置 headers
    const apiHeaders = settingsService.getRequestHeaders();
    Object.entries(apiHeaders).forEach(([key, value]) => {
      config.headers[key] = value;
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    console.error('API Error:', error);
    throw error;
  }
);

export default api;