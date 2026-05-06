import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

// Protects routes - redirects to login if not authenticated
export const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user || user === 'undefined') {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Role-based route guard - redirects if user doesn't have required role
export const RoleRoute = ({ children, roles }) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr || userStr === 'undefined') {
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(userStr);
        if (!roles.includes(user.UserType)) {
            return <Navigate to="/dashboard" replace />;
        }
        return children;
    } catch {
        return <Navigate to="/login" replace />;
    }
};
