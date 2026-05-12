import React, { useState } from 'react';
import {
  Sun, Moon, LayoutDashboard, BookOpen,
  User, LogOut, GraduationCap, Award, ClipboardList,
  Users, PlusSquare, Menu, X, CalendarDays, MessageSquare
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from './NotificationBell';

const Sidebar = ({ isDark, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user')) || {
      FullName: 'Guest User',
      Email: 'guest@university.edu',
      UserType: 'Student'
    }
  );

  React.useEffect(() => {
    const handleUpdate = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user'));
      if (updatedUser) setUser(updatedUser);
    };

    window.addEventListener('userUpdated', handleUpdate);
    return () => window.removeEventListener('userUpdated', handleUpdate);
  }, []);

  const getMenuItems = () => {
    const baseItems = [
      { icon: <LayoutDashboard size={22} />, label: 'Dashboard', path: `/${user.UserType?.toLowerCase()}` },
    ];

    const instructorItems = [
      { icon: <BookOpen size={22} />, label: 'My Courses', path: '/instructor/my-courses' },
      { icon: <PlusSquare size={22} />, label: 'Manage Syllabus', path: '/instructor/courses' },
      { icon: <Users size={22} />, label: 'Assistants', path: '/instructor/assistants' },
      { icon: <ClipboardList size={22} />, label: 'Submissions', path: '/instructor/submissions' },
      { icon: <Award size={22} />, label: 'Students', path: '/instructor/students' },
    ];

    const assistantItems = [
      { icon: <BookOpen size={22} />, label: 'My Courses', path: '/assistant/courses' },
      { icon: <ClipboardList size={22} />, label: 'Assignments', path: '/assistant/assignments' },
      { icon: <Award size={22} />, label: 'Submissions', path: '/assistant/submissions' },
    ];

    const studentItems = [
      { icon: <BookOpen size={22} />, label: 'My Courses', path: '/courses' },
      { icon: <ClipboardList size={22} />, label: 'Assignments', path: '/assignments' },
      { icon: <Award size={22} />, label: 'My Grades', path: '/grades' },
      { icon: <CalendarDays size={22} />, label: 'Calendar', path: '/calendar' },
      { icon: <GraduationCap size={22} />, label: 'Analytics', path: '/analytics' },
    ];

    const commonEnd = [
      { icon: <MessageSquare size={22} />, label: 'Messages', path: '/messages' },
      { icon: <User size={22} />, label: 'Profile', path: '/profile' },
    ];

    if (user.UserType === 'Instructor') return [...baseItems, ...instructorItems, ...commonEnd];
    if (user.UserType === 'Assistant') return [...baseItems, ...assistantItems, ...commonEnd];
    return [...baseItems, ...studentItems, ...commonEnd];
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-5 left-5 z-[60] md:hidden p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 text-slate-600 dark:text-white hover:scale-105 active:scale-95 transition-all"
      >
        <Menu size={22} />
      </button>

      {/* Desktop Sidebar — matches Jana's original structure exactly */}
      <aside className="hidden md:flex w-72 h-screen border-r border-slate-100 dark:border-white/5 sticky top-0 flex-col z-50 overflow-hidden bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-all duration-500">

        {/* 🚀 Logo Section */}
        <div className="p-8 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/20 group cursor-pointer">
                <img src="/logo.png" alt="Mini LMS" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-black tracking-tighter leading-none italic">
                  <span className="dark:text-white transition-colors duration-500">Mini</span>
                  <span className="text-blue-600 dark:text-blue-400"> LMS</span>
                </h1>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500 dark:text-blue-400 mt-1">
                  {user.UserType} Portal
                </span>
              </div>
            </div>
            <NotificationBell />
          </div>
        </div>

        {/* 🧭 Navigation — سكرول داخلي انسيابي */}
        <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.label} to={item.path} className="relative block">
                <div className={`
                  flex items-center gap-4 p-4 rounded-[1.5rem] font-black transition-all duration-300
                  ${isActive
                    ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 shadow-inner'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-blue-500'
                  }
                `}>
                  <span className={`${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>
                    {item.icon}
                  </span>
                  <span className="text-sm tracking-tight uppercase italic">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeCircle"
                      className="ml-auto w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* 🛠 Bottom Actions */}
        <div className="p-6 space-y-4 border-t border-slate-100 dark:border-white/5">
          {/* User Quick Info - Now Clickable */}
          <div 
            onClick={() => navigate('/profile')}
            className="px-4 py-2 flex items-center gap-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-transparent dark:border-white/5 cursor-pointer hover:border-blue-500/30 transition-all group/user"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-500/20 uppercase overflow-hidden group-hover/user:scale-105 transition-transform">
              {user.ProfilePicture ? (
                <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${user.ProfilePicture}`} alt="" className="w-full h-full object-cover" />
              ) : (
                user.FullName?.charAt(0)
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[11px] font-black dark:text-white truncate italic uppercase tracking-tighter group-hover/user:text-blue-500 transition-colors">{user.FullName}</span>
              <span className="text-[9px] text-slate-400 truncate font-bold">{user.Email}</span>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-4 rounded-[1.5rem] bg-slate-100/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-colors ${isDark ? 'text-blue-400 bg-blue-400/10' : 'text-orange-500 bg-orange-500/10'}`}>
                {isDark ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <span className="text-[10px] font-black dark:text-white uppercase tracking-widest italic">
                {isDark ? 'Midnight' : 'Daylight'}
              </span>
            </div>
            <div className={`w-10 h-5 rounded-full p-1 transition-colors ${isDark ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <motion.div
                animate={{ x: isDark ? 20 : 0 }}
                className="w-3 h-3 bg-white rounded-full shadow-md"
              />
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 p-4 text-red-500 font-black text-[10px] hover:bg-red-50 dark:hover:bg-red-950/30 rounded-[1.5rem] transition-all group border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="tracking-[0.2em] uppercase italic">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] md:hidden"
            />

            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 w-72 h-screen flex flex-col z-[80] md:hidden bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-white/5 shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="p-8 mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/20">
                    <img src="/logo.png" alt="Mini LMS" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-2xl font-black tracking-tighter leading-none italic">
                      <span className="dark:text-white">Mini</span>
                      <span className="text-blue-600 dark:text-blue-400"> LMS</span>
                    </h1>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500 dark:text-blue-400 mt-1">
                      {user.UserType} Portal
                    </span>
                  </div>
                </div>
              </div>

              <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.label} to={item.path} className="relative block" onClick={() => setMobileOpen(false)}>
                      <div className={`
                        flex items-center gap-4 p-4 rounded-[1.5rem] font-black transition-all duration-300
                        ${isActive
                          ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 shadow-inner'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-blue-500'
                        }
                      `}>
                        <span className={`${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>
                          {item.icon}
                        </span>
                        <span className="text-sm tracking-tight uppercase italic">{item.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="mobileActiveCircle"
                            className="ml-auto w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                          />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-6 border-t border-slate-100 dark:border-white/5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 p-4 text-red-500 font-black text-[10px] hover:bg-red-50 dark:hover:bg-red-950/30 rounded-[1.5rem] transition-all group border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                >
                  <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                  <span className="tracking-[0.2em] uppercase italic">Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;