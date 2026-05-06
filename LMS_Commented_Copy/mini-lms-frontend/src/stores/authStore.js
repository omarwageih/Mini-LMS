/**
 * AUTHENTICATION STORE (ZUSTAND)
 * This file manages the "Global State" of the user. 
 * Instead of passing user data from component to component, any part of the app 
 * can ask this store "Who is logged in?" and "Are they authenticated?".
 */
import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
    user: null,             // Stores ID, Name, Email, Role (Instructor/Student)
    token: null,            // Stores the active JWT session token
    isAuthenticated: false, // Quick flag to check if session is active

    /**
     * INITIALIZE
     * When the user refreshes their browser, this function reloads their
     * session from the browser's permanent 'localStorage'.
     */
    init: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr && userStr !== 'undefined') {
            try {
                const user = JSON.parse(userStr);
                // Validate that the stored data is actually a valid user object
                if (user && user.UserID && user.UserType) {
                    set({ user, token, isAuthenticated: true });
                } else {
                    throw new Error('Invalid user structure');
                }
            } catch (err) {
                console.warn("Auth initialization failed. Clearing corrupted session.");
                get().logout();
            }
        }
    },

    /**
     * LOGIN ACTION
     * Saves the session details both in the store (for speed) 
     * and in localStorage (for persistence).
     */
    login: (token, user, refreshToken) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        set({ user, token, isAuthenticated: true });
    },

    /**
     * LOGOUT ACTION
     * Completely wipes the session from the app and the browser.
     */
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        set({ user: null, token: null, isAuthenticated: false });
    },

    /**
     * UPDATE PROFILE
     * Merges new user data (like a new profile picture or name change)
     * into the existing user state.
     */
    updateUser: (updates) => {
        const currentUser = get().user;
        const updatedUser = { ...currentUser, ...updates };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
    }
}));

export default useAuthStore;
