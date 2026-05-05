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
                // Simple structure validation
                if (user && user.UserID && user.UserType) {
                    set({ user, token, isAuthenticated: true });
                } else {
                    throw new Error('Invalid user structure');
                }
            } catch (err) {
                console.warn("Auth initialization failed:", err);
                get().logout();
            }
        }
    },

    // Login
    login: (token, user, refreshToken) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        set({ user, token, isAuthenticated: true });
    },

    // Logout
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
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
