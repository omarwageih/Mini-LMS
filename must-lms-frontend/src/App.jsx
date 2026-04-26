import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Hooks & Context
import { useTheme } from './context/ThemeContext';

// Components
import Sidebar from './components/Sidebar';

// Common Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MyCourses from './pages/MyCourses';
import Grades from './pages/Grades';
import Assignments from './pages/Assignments';
import Login from './pages/Login';
import CourseDetails from './pages/CourseDetails';

// Assistant Pages
import AssistantDashboard from './pages/assistant/AssistantDashboard';
import AssistantAssignments from './pages/assistant/AssistantAssignments';
import AssistantSubmissions from './pages/assistant/AssistantSubmissions';
import AssistantCourses from './pages/assistant/AssistantCourses';

// Instructor Pages
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import ManageStudents from './pages/instructor/ManageStudents';
import ManageAssistants from './pages/instructor/ManageAssistants';
import ManageCourses from './pages/instructor/ManageCourses';
import InstructorSubmissions from './pages/instructor/InstructorSubmissions';
import InstructorCourseDetails from './pages/instructor/InstructorCourseDetails';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.UserType)) {
        return <Navigate to={`/${user.UserType?.toLowerCase()}`} replace />;
    }

    return children;
};

const AppContent = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const location = useLocation();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-500 font-sans selection:bg-blue-500/30 overflow-hidden">
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    
                    {/* Login Path */}
                    <Route path="/login" element={<Login />} />

                    {/* Integrated App Structure */}
                    <Route 
                        path="/*" 
                        element={
                            <ProtectedRoute>
                                <div className="flex h-screen overflow-hidden relative">
                                    
                                    <Sidebar isDark={isDarkMode} toggleTheme={toggleTheme} />

                                    <main className="flex-1 relative overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-transparent">
                                        <div className="p-4 md:p-10 max-w-[1600px] mx-auto min-h-full pb-24">
                                            
                                            <Routes>
                                                {/* Student Routes */}
                                                <Route path="/student" element={<ProtectedRoute allowedRoles={['Student']}><Dashboard /></ProtectedRoute>} />
                                                <Route path="/courses" element={<ProtectedRoute allowedRoles={['Student']}><MyCourses /></ProtectedRoute>} />
                                                <Route path="/course/:id" element={<ProtectedRoute allowedRoles={['Student']}><CourseDetails /></ProtectedRoute>} />
                                                <Route path="/grades" element={<ProtectedRoute allowedRoles={['Student']}><Grades /></ProtectedRoute>} />
                                                <Route path="/assignments" element={<ProtectedRoute allowedRoles={['Student']}><Assignments /></ProtectedRoute>} />

                                                {/* Assistant Routes */}
                                                <Route path="/assistant" element={<ProtectedRoute allowedRoles={['Assistant']}><AssistantDashboard /></ProtectedRoute>} />
                                                <Route path="/assistant/assignments" element={<ProtectedRoute allowedRoles={['Assistant']}><AssistantAssignments /></ProtectedRoute>} />
                                                <Route path="/assistant/submissions" element={<ProtectedRoute allowedRoles={['Assistant']}><AssistantSubmissions /></ProtectedRoute>} />
                                                <Route path="/assistant/courses" element={<ProtectedRoute allowedRoles={['Assistant']}><AssistantCourses /></ProtectedRoute>} />

                                                {/* Instructor Routes */}
                                                <Route path="/instructor" element={<ProtectedRoute allowedRoles={['Instructor']}><InstructorDashboard /></ProtectedRoute>} />
                                                <Route path="/instructor/students" element={<ProtectedRoute allowedRoles={['Instructor']}><ManageStudents /></ProtectedRoute>} />
                                                <Route path="/instructor/assistants" element={<ProtectedRoute allowedRoles={['Instructor']}><ManageAssistants /></ProtectedRoute>} />
                                                <Route path="/instructor/courses" element={<ProtectedRoute allowedRoles={['Instructor']}><ManageCourses /></ProtectedRoute>} />
                                                <Route path="/instructor/courses/:id" element={<ProtectedRoute allowedRoles={['Instructor']}><InstructorCourseDetails /></ProtectedRoute>} />
                                                <Route path="/instructor/submissions" element={<ProtectedRoute allowedRoles={['Instructor']}><InstructorSubmissions /></ProtectedRoute>} />

                                                {/* Common */}
                                                <Route path="/profile" element={<Profile />} />
                                                
                                                {/* Default Redirect */}
                                                <Route path="/" element={<Navigate to="/login" replace />} />
                                            </Routes>

                                        </div>

                                        {/* Background Aurora Effects */}
                                        <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20 transition-opacity duration-1000">
                                            <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-600/10 blur-[130px] rounded-full animate-pulse"></div>
                                            <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-indigo-500/10 blur-[130px] rounded-full"></div>
                                        </div>
                                    </main>
                                </div>
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
        <Router>
            <AppContent />
        </Router>
    );
};

export default App;