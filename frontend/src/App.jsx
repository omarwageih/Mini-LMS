import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AssistantDashboard from './pages/AssistantDashboard';
import CoursesPage from './pages/CoursesPage';
import NotificationsPage from './pages/NotificationsPage';
import AttendancePage from './pages/AttendancePage';
import AssignmentsPage from './pages/AssignmentsPage';
import QuizzesPage from './pages/QuizzesPage';
import ActivityLogPage from './pages/ActivityLogPage';
import './index.css';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-must-blue-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-must-gold/30 border-t-must-gold rounded-full animate-spin" />
          <p className="text-must-gold text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.UserType)) return <Navigate to="/dashboard" />;

  return children;
};

// Smart redirect based on user role
const DashboardRedirect = () => {
  const { user } = useAuth();
  
  switch (user?.UserType) {
    case 'Student': return <StudentDashboard />;
    case 'Instructor': return <InstructorDashboard />;
    case 'Assistant': return <AssistantDashboard />;
    default: return <StudentDashboard />;
  }
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Dashboard — auto-selects by role */}
      <Route path="/dashboard" element={
        <ProtectedRoute><DashboardRedirect /></ProtectedRoute>
      } />

      {/* Shared routes */}
      <Route path="/courses" element={
        <ProtectedRoute><CoursesPage /></ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute><NotificationsPage /></ProtectedRoute>
      } />

      {/* Student routes */}
      <Route path="/attendance" element={
        <ProtectedRoute roles={['Student', 'Instructor']}><AttendancePage /></ProtectedRoute>
      } />
      <Route path="/assignments" element={
        <ProtectedRoute roles={['Student']}><AssignmentsPage /></ProtectedRoute>
      } />
      <Route path="/quizzes" element={
        <ProtectedRoute roles={['Student']}><QuizzesPage /></ProtectedRoute>
      } />

      {/* Instructor routes */}
      <Route path="/activity-log" element={
        <ProtectedRoute roles={['Instructor']}><ActivityLogPage /></ProtectedRoute>
      } />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
