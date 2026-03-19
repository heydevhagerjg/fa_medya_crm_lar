import axios from 'axios';
import { useAuthStore } from '../stores/index.js';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
    },
    withCredentials: true,
});

// Add auth token to every request
api.interceptors.request.use((config) => {
    // Check if the request is for admin or standard user
    const isAdminRequest = config.url.startsWith('/admin') || config.url.startsWith('admin');
    
    if (isAdminRequest) {
        const adminToken = localStorage.getItem('admin_token');
        if (adminToken) {
            config.headers.Authorization = `Bearer ${adminToken}`;
        }
    } else {
        const token = useAuthStore.getState().token || localStorage.getItem('crm_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    
    return config;
});

// Handle 401 globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const isAdminRequest = error.config.url.startsWith('/admin') || error.config.url.startsWith('admin');

            if (isAdminRequest) {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('crm-admin-auth');
                window.location.href = '/admin/login';
            } else {
                localStorage.removeItem('crm_token');
                localStorage.removeItem('crm_user');
                localStorage.removeItem('crm-auth');
                useAuthStore.getState().clearAuth();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
