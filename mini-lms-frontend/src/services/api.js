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

        if (!error.response) {
            console.error("API Network Error:", error.message);
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized
        if (error.response.status === 401 && !originalRequest._retry) {
            const isAuthRequest = originalRequest.url.includes('/auth/refresh-token') || 
                                 originalRequest.url.includes('/auth/login');

            if (isAuthRequest) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                console.log("Token refresh in progress, queuing request:", originalRequest.url);
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                console.warn("No refresh token found, redirecting to login");
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                console.log("Attempting token refresh...");
                const { data } = await axios.post(`${API_URL}/api/auth/refresh-token`, { refreshToken });
                const newToken = data.token;
                
                localStorage.setItem('token', newToken);
                api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                
                console.log("Token refreshed successfully.");
                processQueue(null, newToken);
                return api(originalRequest);
            } catch (refreshErr) {
                console.error("Token refresh failed:", refreshErr.message);
                processQueue(refreshErr, null);
                localStorage.clear();
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
    updateProfile: (data) => api.put('/student/profile', data),
    getCourses: () => api.get('/student/courses'),
    getCourseContent: (courseId) => api.get(`/student/courses/${courseId}/content`),
    getAssignments: () => api.get('/student/assignments'),
    submitAssignment: (formData) => api.post('/student/assignments/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getGrades: () => api.get('/student/grades'),
    getCourseMaterials: (courseId) => api.get(`/student/courses/${courseId}/materials`),
    getCourseAnnouncements: (courseId) => api.get(`/student/courses/${courseId}/announcements`),
    getCourseParticipants: (courseId) => api.get(`/student/courses/${courseId}/participants`),
    getCalendarEvents: () => api.get('/student/calendar'),
    // Discussions
    getDiscussionPosts: (courseId) => api.get(`/student/discussions/${courseId}`),
    createDiscussionPost: (data) => api.post('/student/discussions', data),
    getDiscussionReplies: (postId) => api.get(`/student/discussions/replies/${postId}`),
    createDiscussionReply: (data) => api.post('/student/discussions/reply', data),
    getCourseAttendance: (courseId) => api.get(`/student/courses/${courseId}/attendance`),
    getCourseQuizzes: (courseId) => api.get(`/student/courses/${courseId}/quizzes`)
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
    getMyCourses: () => api.get('/instructor/my-courses'),
    getCourseContent: (courseId) => api.get(`/instructor/courses/${courseId}/content`),
    // Content
    addWeek: (data) => api.post('/instructor/weeks', data),
    addMaterial: (formData) => api.post('/instructor/materials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    addLecture: (data) => api.post('/instructor/lectures', data),
    deleteLecture: (id) => api.delete(`/instructor/lectures/${id}`),
    deleteWeek: (id) => api.delete(`/instructor/weeks/${id}`),
    // Assignments
    createAssignment: (data) => api.post('/instructor/assignments', data),
    updateAssignment: (id, data) => api.put(`/instructor/assignments/${id}`, data),
    deleteAssignment: (id) => api.delete(`/instructor/assignments/${id}`),
    // Submissions
    getSubmissions: (params) => api.get('/instructor/submissions', { params }),
    gradeSubmission: (data) => api.post('/instructor/submissions/grade', data),
    // Stats & Tabs
    getCourseParticipants: (courseId) => api.get(`/instructor/courses/${courseId}/participants`),
    getCourseGrades: (courseId) => api.get(`/instructor/courses/${courseId}/grades`),
    // Materials
    getCourseMaterials: (courseId) => api.get(`/instructor/courses/${courseId}/materials`),
    uploadCourseMaterial: (formData) => api.post('/instructor/courses/materials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deleteCourseMaterial: (id) => api.delete(`/instructor/courses/materials/${id}`),
    // Announcements
    getAnnouncements: (courseId) => api.get(`/instructor/courses/${courseId}/announcements`),
    createAnnouncement: (data) => api.post('/instructor/courses/announcements', data),
    deleteAnnouncement: (id) => api.delete(`/instructor/announcements/${id}`),
    getCourseAttendance: (courseId) => api.get(`/instructor/courses/${courseId}/attendance`),
    markAttendance: (data) => api.post('/instructor/attendance/mark', data),
    getCourseQuizzes: (courseId) => api.get(`/instructor/courses/${courseId}/quizzes`)
};

// ===== Assistant =====
export const assistantAPI = {
    getCourses: () => api.get('/assistant/courses'),
    getCourseDetails: (courseId) => api.get(`/assistant/courses/${courseId}/details`),
    createAssignment: (data) => api.post('/assistant/assignments', data),
    getSubmissions: (params) => api.get('/assistant/submissions', { params }),
    gradeSubmission: (data) => api.post('/assistant/submissions/grade', data),
    getCourseParticipants: (courseId) => api.get(`/assistant/courses/${courseId}/participants`),
    getCourseGrades: (courseId) => api.get(`/assistant/courses/${courseId}/grades`),
    getCourseMaterials: (courseId) => api.get(`/assistant/courses/${courseId}/materials`),
    uploadCourseMaterial: (formData) => api.post('/assistant/courses/materials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deleteCourseMaterial: (id) => api.delete(`/assistant/courses/materials/${id}`),
    getCourseAttendance: (courseId) => api.get(`/assistant/courses/${courseId}/attendance`),
    markAttendance: (data) => api.post('/assistant/attendance/mark', data),
    getCourseQuizzes: (courseId) => api.get(`/assistant/courses/${courseId}/quizzes`)
};

export default api;

// ===== Generic helpers used by older page imports =====
// These allow pages that call apiGet('/instructor/...') to work
// without needing to know which named API group to use.
export const apiGet    = (url, params) => api.get(url, { params }).then(r => r.data);
export const apiPost   = (url, data, config) => api.post(url, data, config).then(r => r.data);
export const apiPut    = (url, data) => api.put(url, data).then(r => r.data);
export const apiDelete = (url) => api.delete(url).then(r => r.data);
