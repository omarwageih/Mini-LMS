import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 — try refresh token before logging out
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (!refreshToken) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { data } = await api.post('/auth/refresh-token', { refreshToken });
                localStorage.setItem('token', data.token);
                api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
                processQueue(null, data.token);
                originalRequest.headers.Authorization = `Bearer ${data.token}`;
                return api(originalRequest);
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// ===== Auth =====
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    googleLogin: (data) => api.post('/auth/google-login', data),
    forgotPassword: (data) => api.post('/auth/forgot-password', data),
    resetPassword: (data) => api.post('/auth/reset-password', data),
    uploadProfilePic: (formData) => api.post('/auth/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
};

// ===== Dashboard =====
export const dashboardAPI = {
    getStats: () => api.get('/dashboard/stats')
};

// ===== Student =====
export const studentAPI = {
    getDashboard: () => api.get('/student/dashboard'),
    getCourses: () => api.get('/student/courses'),
    getCourseContent: (courseId) => api.get(`/student/courses/${courseId}/content`),
    getAssignments: () => api.get('/student/assignments'),
    submitAssignment: (formData) => api.post('/student/assignments/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getGrades: () => api.get('/student/grades'),
    getCourseMaterials: (courseId) => api.get(`/student/courses/${courseId}/materials`),
    getCourseAnnouncements: (courseId) => api.get(`/student/courses/${courseId}/announcements`),
    getCalendarEvents: () => api.get('/student/calendar'),
    // Discussions
    getDiscussionPosts: (courseId) => api.get(`/student/discussions/${courseId}`),
    createDiscussionPost: (data) => api.post('/student/discussions', data),
    getDiscussionReplies: (postId) => api.get(`/student/discussions/replies/${postId}`),
    createDiscussionReply: (data) => api.post('/student/discussions/reply', data)
};

// ===== Instructor =====
export const instructorAPI = {
    // Assistants
    getAssistants: () => api.get('/instructor/assistants'),
    addAssistant: (data) => api.post('/instructor/assistants', data),
    deleteAssistant: (id) => api.delete(`/instructor/assistants/${id}`),
    assignAssistant: (data) => api.post('/instructor/assistants/assign-course', data),
    // Students
    getStudents: () => api.get('/instructor/students'),
    addStudent: (data) => api.post('/instructor/students', data),
    deleteStudent: (id) => api.delete(`/instructor/students/${id}`),
    enrollStudent: (data) => api.post('/instructor/students/enroll', data),
    // Courses
    getCourses: () => api.get('/instructor/courses'),
    createCourse: (data) => api.post('/instructor/courses', data),
    getCourseContent: (courseId) => api.get(`/instructor/courses/${courseId}/content`),
    // Content
    addWeek: (data) => api.post('/instructor/weeks', data),
    addMaterial: (data) => api.post('/instructor/materials', data),
    addLecture: (data) => api.post('/instructor/lectures', data),
    // Assignments
    createAssignment: (data) => api.post('/instructor/assignments', data),
    // Submissions
    getSubmissions: (params) => api.get('/instructor/submissions', { params }),
    gradeSubmission: (data) => api.post('/instructor/submissions/grade', data),
    // Materials
    getCourseMaterials: (courseId) => api.get(`/instructor/courses/${courseId}/materials`),
    uploadCourseMaterial: (formData) => api.post('/instructor/courses/materials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deleteCourseMaterial: (id) => api.delete(`/instructor/courses/materials/${id}`),
    // Announcements
    getAnnouncements: (courseId) => api.get(`/instructor/courses/${courseId}/announcements`),
    createAnnouncement: (data) => api.post('/instructor/courses/announcements', data),
    deleteAnnouncement: (id) => api.delete(`/instructor/courses/announcements/${id}`)
};

// ===== Assistant =====
export const assistantAPI = {
    getCourses: () => api.get('/assistant/courses'),
    createAssignment: (data) => api.post('/assistant/assignments', data),
    getSubmissions: (params) => api.get('/assistant/submissions', { params }),
    gradeSubmission: (data) => api.post('/assistant/submissions/grade', data)
};

export default api;
