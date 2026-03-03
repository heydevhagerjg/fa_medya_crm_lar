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
    // Rely on zustand store token as primary, fallback to generic storage if needed
    const token = useAuthStore.getState().token || localStorage.getItem('crm_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear both standard localStorage and Zustand persist storage
            localStorage.removeItem('crm_token');
            localStorage.removeItem('crm_user');
            localStorage.removeItem('crm-auth');

            // Clear Zustand store state
            useAuthStore.getState().clearAuth();

            // Always redirect to login on 401
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
