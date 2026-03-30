import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            setAuth: (user, token) => {
                set({ user, token, isAuthenticated: true });
            },

            clearAuth: () => {
                set({ user: null, token: null, isAuthenticated: false });
            },

            updateUser: (user) => set({ user }),
        }),
        {
            name: 'crm-auth',
            partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
        }
    )
);

export const useAdminStore = create(
    persist(
        (set, get) => ({
            admin: null,
            token: null,
            isAdminAuthenticated: false,

            setAdminAuth: (admin, token) => {
                set({ admin, token, isAdminAuthenticated: true });
                localStorage.setItem('admin_token', token);
            },

            clearAdminAuth: () => {
                set({ admin: null, token: null, isAdminAuthenticated: false });
                localStorage.removeItem('admin_token');
            },
        }),
        {
            name: 'crm-admin-auth',
        }
    )
);

export const useThemeStore = create(
    persist(
        (set, get) => ({
            theme: 'dark',
            palette: 'violet',
            availablePalettes: ['violet', 'ocean', 'graphite'],
            toggleTheme: () => {
                const newTheme = get().theme === 'dark' ? 'light' : 'dark';
                set({ theme: newTheme });
                document.documentElement.classList.toggle('dark', newTheme === 'dark');
            },
            setPalette: (palette) => {
                set({ palette });
                document.documentElement.dataset.palette = palette;
            },
            initTheme: () => {
                const { theme, palette } = get();
                document.documentElement.classList.toggle('dark', theme === 'dark');
                document.documentElement.dataset.palette = palette || 'violet';
            },
        }),
        {
            name: 'crm-theme',
        }
    )
);
