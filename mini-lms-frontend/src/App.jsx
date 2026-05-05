import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';


// Hooks & Context
import { useTheme } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';

// Components
import Sidebar from './components/Sidebar';
import PageWrapper from './components/PageWrapper';
import ErrorBoundary from './components/ErrorBoundary';

import Breadcrumb from './components/Breadcrumb';

// Common Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MyCourses from './pages/MyCourses';
import Grades from './pages/Grades';
import Assignments from './pages/Assignments';
import Auth from './pages/Auth';
import Landing from './pages/Landing';
import CourseDetails from './pages/CourseDetails';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Calendar from './pages/Calendar';
import Discussions from './pages/Discussions';
import Analytics from './pages/Analytics';

// Assistant Pages
import AssistantDashboard from './pages/assistant/AssistantDashboard';
import AssistantAssignments from './pages/assistant/AssistantAssignments';
import AssistantSubmissions from './pages/assistant/AssistantSubmissions';
import AssistantCourses from './pages/assistant/AssistantCourses';
import AssistantCourseDetails from './pages/assistant/AssistantCourseDetails';

// Instructor Pages
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import ManageStudents from './pages/instructor/ManageStudents';
import ManageAssistants from './pages/instructor/ManageAssistants';
import ManageCourses from './pages/instructor/ManageCourses';
import InstructorSubmissions from './pages/instructor/InstructorSubmissions';
import InstructorCourseDetails from './pages/instructor/InstructorCourseDetails';

// Protected Route Component
const DashboardRedirect = () => {
    const userString = localStorage.getItem('user');
    if (!userString) return <Navigate to="/login" replace />;
    
    try {
        const user = JSON.parse(userString);
        const role = user.UserType?.toLowerCase() || 'student';
        return <Navigate to={`/${role}`} replace />;
    } catch (e) {
        localStorage.clear();
        return <Navigate to="/login" replace />;
    }
};

const ProtectedRoute = ({ children, allowedRoles }) => {
    let user = null;
    try {
        const userString = localStorage.getItem('user');
        if (userString && userString !== 'undefined') {
            user = JSON.parse(userString);
        }
    } catch (e) {
        console.error("Auth state error:", e);
        localStorage.clear();
    }
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.UserType)) {
        return <Navigate to={`/${user.UserType?.toLowerCase() || 'student'}`} replace />;
    }

    return children;
};

const SocketWrapper = ({ toggleTheme, isDarkMode, location }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return (
        <SocketProvider userId={user.UserID}>
            <div className="flex h-screen overflow-hidden relative">
                <Sidebar isDark={isDarkMode} toggleTheme={toggleTheme} />
                <main className="flex-1 relative overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-transparent">
                    <div className="p-4 md:p-10 max-w-[1600px] mx-auto min-h-full pb-24">
                        <Breadcrumb />
                        <AnimatePresence mode="wait">
                            <Routes location={location} key={location.pathname}>
                                {/* Student Routes */}
                                <Route path="/student" element={<ProtectedRoute allowedRoles={['Student']}><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
                                <Route path="/courses" element={<ProtectedRoute allowedRoles={['Student']}><PageWrapper><MyCourses /></PageWrapper></ProtectedRoute>} />
                                <Route path="/course/:id" element={<ProtectedRoute allowedRoles={['Student']}><PageWrapper><CourseDetails /></PageWrapper></ProtectedRoute>} />
                                <Route path="/grades" element={<ProtectedRoute allowedRoles={['Student']}><PageWrapper><Grades /></PageWrapper></ProtectedRoute>} />
                                <Route path="/assignments" element={<ProtectedRoute allowedRoles={['Student']}><PageWrapper><Assignments /></PageWrapper></ProtectedRoute>} />
                                <Route path="/calendar" element={<ProtectedRoute allowedRoles={['Student']}><PageWrapper><Calendar /></PageWrapper></ProtectedRoute>} />
                                <Route path="/discussions/:courseId" element={<ProtectedRoute allowedRoles={['Student', 'Instructor', 'Assistant']}><PageWrapper><Discussions /></PageWrapper></ProtectedRoute>} />
                                <Route path="/analytics" element={<ProtectedRoute allowedRoles={['Student']}><PageWrapper><Analytics /></PageWrapper></ProtectedRoute>} />

                                {/* Assistant Routes */}
                                <Route path="/assistant" element={<ProtectedRoute allowedRoles={['Assistant']}><PageWrapper><AssistantDashboard /></PageWrapper></ProtectedRoute>} />
                                <Route path="/assistant/assignments" element={<ProtectedRoute allowedRoles={['Assistant']}><PageWrapper><AssistantAssignments /></PageWrapper></ProtectedRoute>} />
                                <Route path="/assistant/submissions" element={<ProtectedRoute allowedRoles={['Assistant']}><PageWrapper><AssistantSubmissions /></PageWrapper></ProtectedRoute>} />
                                <Route path="/assistant/courses" element={<ProtectedRoute allowedRoles={['Assistant']}><PageWrapper><AssistantCourses /></PageWrapper></ProtectedRoute>} />
                                <Route path="/assistant/courses/:id" element={<ProtectedRoute allowedRoles={['Assistant']}><PageWrapper><AssistantCourseDetails /></PageWrapper></ProtectedRoute>} />

                                {/* Instructor Routes */}
                                <Route path="/instructor" element={<ProtectedRoute allowedRoles={['Instructor']}><PageWrapper><InstructorDashboard /></PageWrapper></ProtectedRoute>} />
                                <Route path="/instructor/students" element={<ProtectedRoute allowedRoles={['Instructor']}><PageWrapper><ManageStudents /></PageWrapper></ProtectedRoute>} />
                                <Route path="/instructor/assistants" element={<ProtectedRoute allowedRoles={['Instructor']}><PageWrapper><ManageAssistants /></PageWrapper></ProtectedRoute>} />
                                <Route path="/instructor/courses" element={<ProtectedRoute allowedRoles={['Instructor']}><PageWrapper><ManageCourses /></PageWrapper></ProtectedRoute>} />
                                <Route path="/instructor/courses/:id" element={<ProtectedRoute allowedRoles={['Instructor']}><PageWrapper><InstructorCourseDetails /></PageWrapper></ProtectedRoute>} />
                                <Route path="/instructor/submissions" element={<ProtectedRoute allowedRoles={['Instructor']}><PageWrapper><InstructorSubmissions /></PageWrapper></ProtectedRoute>} />

                                {/* Common */}
                                <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />
                                
                                {/* Default Dashboard Redirect when logged in */}
                                <Route path="/dashboard" element={<DashboardRedirect />} />
                                
                                {/* Redirect unmatched nested paths back to specific role dashboard */}
                                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                            </Routes>
                        </AnimatePresence>
                    </div>

                    {/* Background Aurora Effects */}
                    <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20 transition-opacity duration-1000">
                        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-600/10 blur-[130px] rounded-full animate-pulse"></div>
                        <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-indigo-500/10 blur-[130px] rounded-full"></div>
                    </div>
                </main>
            </div>
        </SocketProvider>
    );
};

const AppContent = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const location = useLocation();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-500 font-sans selection:bg-blue-500/30 overflow-hidden">
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    
                    {/* Landing/Intro Path */}
                    <Route path="/" element={<Landing />} />

                    {/* Auth Path */}
                    <Route path="/login" element={<Auth />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Integrated App Structure */}
                    <Route 
                        path="/*" 
                        element={
                            <ProtectedRoute>
                                <SocketWrapper toggleTheme={toggleTheme} isDarkMode={isDarkMode} location={location} />
                            </ProtectedRoute>
                        } 
                    />
                </Routes>
            </AnimatePresence>
        </div>
    );
};

const App = () => {
    return (
        <ErrorBoundary>
            <Router>
                <ToastProvider>
                    <AppContent />
                </ToastProvider>
            </Router>
        </ErrorBoundary>
    );
};

export default App;