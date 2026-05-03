import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,

    // Initialize from localStorage
    init: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr && userStr !== 'undefined') {
            try {
                const user = JSON.parse(userStr);
                set({ user, token, isAuthenticated: true });
            } catch {
                set({ user: null, token: null, isAuthenticated: false });
            }
        }
    },

    // Login
    login: (token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
    },

    // Logout
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
    },

    // Update user profile
    updateUser: (updates) => {
        const currentUser = get().user;
        const updatedUser = { ...currentUser, ...updates };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
    }
}));

export default useAuthStore;
