import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  LayoutDashboard, BookOpen, Users, ClipboardList, Bell,
  LogOut, Menu, X, GraduationCap, ChevronRight, Activity,
  FileText, Calendar, Settings
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications/unread-count');
        setUnreadCount(data.UnreadCount || 0);
      } catch (err) { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = {
    Student: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/courses', label: 'My Courses', icon: BookOpen },
      { path: '/assignments', label: 'Assignments', icon: ClipboardList },
      { path: '/quizzes', label: 'Quizzes', icon: FileText },
      { path: '/attendance', label: 'Attendance', icon: Calendar },
      { path: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    ],
    Instructor: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/courses', label: 'My Courses', icon: BookOpen },
      { path: '/students', label: 'Students', icon: Users },
      { path: '/attendance', label: 'Attendance', icon: Calendar },
      { path: '/activity-log', label: 'Activity Log', icon: Activity },
      { path: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    ],
    Assistant: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/submissions', label: 'Submissions', icon: ClipboardList },
      { path: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    ],
  };

  const links = navItems[user?.UserType] || navItems.Student;

  return (
    <div className="min-h-screen bg-must-blue-dark flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#000d1a] border-r border-white/5 flex flex-col transition-all duration-300 fixed h-screen z-30`}>
        {/* Logo */}
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-must-gold rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse-glow">
            <GraduationCap className="w-5 h-5 text-must-blue-dark" />
          </div>
          {sidebarOpen && (
            <div className="animate-slide-in-left">
              <h2 className="text-sm font-bold text-white leading-tight">MUST University</h2>
              <p className="text-xs text-gray-500">LMS Portal</p>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && item.badge > 0 && (
                  <span className="ml-auto must-badge bg-red-500/20 text-red-400">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top bar */}
        <header className="h-16 bg-[#000d1a]/80 backdrop-blur-lg border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center text-sm text-gray-400">
              <span>MUST LMS</span>
              <ChevronRight className="w-4 h-4 mx-1" />
              <span className="text-white font-medium">
                {links.find(l => l.path === location.pathname)?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/notifications" className="relative text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-must-gold/20 border border-must-gold/30 rounded-lg flex items-center justify-center">
                <span className="text-must-gold text-xs font-bold">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              {sidebarOpen && (
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-white leading-tight">{user?.email}</p>
                  <p className="text-xs text-must-gold">{user?.UserType}</p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
