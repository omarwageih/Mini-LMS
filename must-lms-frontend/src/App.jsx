import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Components
import Sidebar from './components/Sidebar';

// Auth
import Login from './pages/Login';

// Student Pages
import Dashboard from './pages/Dashboard';
import CourseDetails from './pages/CourseDetails';
import MyCourses from './pages/MyCourses';
import Profile from './pages/Profile';
import Grades from './pages/Grades';
import Assignments from './pages/Assignments';

// Instructor Pages
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import ManageStudents from './pages/instructor/ManageStudents';
import ManageAssistants from './pages/instructor/ManageAssistants';
import ManageCourses from './pages/instructor/ManageCourses';
import InstructorSubmissions from './pages/instructor/InstructorSubmissions';

// Assistant Pages
import AssistantDashboard from './pages/assistant/AssistantDashboard';
import AssistantCourses from './pages/assistant/AssistantCourses';
import AssistantAssignments from './pages/assistant/AssistantAssignments';
import AssistantSubmissions from './pages/assistant/AssistantSubmissions';

// 🛡️ Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.UserType)) {
        // Redirect to their own dashboard
        if (user.UserType === 'Instructor') return <Navigate to="/instructor" replace />;
        if (user.UserType === 'Assistant') return <Navigate to="/assistant" replace />;
        return <Navigate to="/student" replace />;
    }
    return children;
};

// Layout wrapper with Sidebar
const AppLayout = ({ children }) => (
    <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 relative overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-8">
                {children}
            </div>
            {/* Background glow effects */}
            <div className="fixed inset-0 pointer-events-none z-[-1] opacity-30 dark:opacity-60">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#a78bfa]/20 blur-[120px] rounded-full"></div>
            </div>
        </main>
    </div>
);

// Root redirect based on role
const RoleRedirect = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return <Navigate to="/login" replace />;
    if (user.UserType === 'Instructor') return <Navigate to="/instructor" replace />;
    if (user.UserType === 'Assistant') return <Navigate to="/assistant" replace />;
    return <Navigate to="/student" replace />;
};

const App = () => {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    return (
        <Router>
            <div className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-500">
                <AnimatePresence mode="wait">
                    <Routes>
                        {/* Login — public */}
                        <Route path="/login" element={<Login />} />

                        {/* Root — redirect based on role */}
                        <Route path="/" element={<RoleRedirect />} />

                        {/* ===== INSTRUCTOR ROUTES ===== */}
                        <Route path="/instructor" element={
                            <ProtectedRoute allowedRoles={['Instructor']}>
                                <AppLayout><InstructorDashboard /></AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/instructor/students" element={
                            <ProtectedRoute allowedRoles={['Instructor']}>
                                <AppLayout><ManageStudents /></AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/instructor/assistants" element={
                            <ProtectedRoute allowedRoles={['Instructor']}>
                                <AppLayout><ManageAssistants /></AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/instructor/courses" element={
                            <ProtectedRoute allowedRoles={['Instructor']}>
                                <AppLayout><ManageCourses /></AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/instructor/submissions" element={
                            <ProtectedRoute allowedRoles={['Instructor']}>
                                <AppLayout><InstructorSubmissions /></AppLayout>
                            </ProtectedRoute>
                        } />

                        {/* ===== ASSISTANT ROUTES ===== */}
                        <Route path="/assistant" element={
                            <ProtectedRoute allowedRoles={['Assistant']}>
                                <AppLayout><AssistantDashboard /></AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/assistant/courses" element={
                            <ProtectedRoute allowedRoles={['Assistant']}>
                                <AppLayout><AssistantCourses /></AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/assistant/assignments" element={
                            <ProtectedRoute allowedRoles={['Assistant']}>
                                <AppLayout><AssistantAssignments /></AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/assistant/submissions" element={
                            <ProtectedRoute allowedRoles={['Assistant']}>
                                <AppLayout><AssistantSubmissions /></AppLayout>
                            </ProtectedRoute>
                        } />

                        {/* ===== STUDENT ROUTES ===== */}
                        <Route path="/student" element={
                            <ProtectedRoute allowedRoles={['Student']}>
                                <AppLayout><Dashboard /></AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/student/courses" element={
                            <ProtectedRoute allowedRoles={['Student']}>
                                <AppLayout><MyCourses /></AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/student/course/:id" element={
                            <ProtectedRoute allowedRoles={['Student']}>
                                <AppLayout><CourseDetails /></AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/student/assignments" element={
                            <ProtectedRoute allowedRoles={['Student']}>
                                <AppLayout><Assignments /></AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/student/grades" element={
                            <ProtectedRoute allowedRoles={['Student']}>
                                <AppLayout><Grades /></AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/student/profile" element={
                            <ProtectedRoute allowedRoles={['Student']}>
                                <AppLayout><Profile /></AppLayout>
                            </ProtectedRoute>
                        } />

                        {/* Fallback */}
                        <Route path="*" element={<RoleRedirect />} />
                    </Routes>
                </AnimatePresence>
            </div>
        </Router>
    );
};

export default App;