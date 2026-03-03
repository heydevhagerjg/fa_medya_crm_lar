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
                localStorage.setItem('crm_token', token);
                localStorage.setItem('crm_user', JSON.stringify(user));
            },

            clearAuth: () => {
                set({ user: null, token: null, isAuthenticated: false });
                localStorage.removeItem('crm_token');
                localStorage.removeItem('crm_user');
            },

            updateUser: (user) => set({ user }),
        }),
        {
            name: 'crm-auth',
            partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
        }
    )
);

export const useThemeStore = create(
    persist(
        (set, get) => ({
            theme: 'dark',
            toggleTheme: () => {
                const newTheme = get().theme === 'dark' ? 'light' : 'dark';
                set({ theme: newTheme });
                document.documentElement.classList.toggle('dark', newTheme === 'dark');
            },
            initTheme: () => {
                const theme = get().theme;
                document.documentElement.classList.toggle('dark', theme === 'dark');
            },
        }),
        {
            name: 'crm-theme',
        }
    )
);
