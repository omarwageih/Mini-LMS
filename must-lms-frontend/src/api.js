// ===== Central API Helper =====
const BASE_URL = 'http://localhost:3000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Get user from localStorage
export const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

// Fetch wrapper with auth header
export const api = async (endpoint, options = {}) => {
    const token = getToken();

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {})
        },
        ...options
    };

    // Don't set Content-Type for FormData (let browser set it with boundary)
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'API Error');
    }

    return data;
};

// Shorthand methods
export const apiGet = (endpoint) => api(endpoint, { method: 'GET' });
export const apiPost = (endpoint, body) => {
    if (body instanceof FormData) {
        return api(endpoint, { method: 'POST', body });
    }
    return api(endpoint, { method: 'POST', body: JSON.stringify(body) });
};
export const apiDelete = (endpoint) => api(endpoint, { method: 'DELETE' });
