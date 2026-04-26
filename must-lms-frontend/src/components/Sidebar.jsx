import React from 'react';
import { useTheme } from '../context/ThemeContext';
import {
    Sun, Moon, LayoutDashboard, BookOpen,
    User, LogOut, GraduationCap, Award, ClipboardList,
    Users, UserPlus
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getUser } from '../api';

const Sidebar = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const user = getUser();
    const role = user?.UserType || 'Student';

    // Dynamic menu based on user role
    const getMenuItems = () => {
        if (role === 'Instructor') {
            return [
                { icon: <LayoutDashboard size={22} />, label: 'Dashboard', path: '/instructor' },
                { icon: <Users size={22} />, label: 'Students', path: '/instructor/students' },
                { icon: <UserPlus size={22} />, label: 'Assistants', path: '/instructor/assistants' },
                { icon: <BookOpen size={22} />, label: 'Courses', path: '/instructor/courses' },
                { icon: <ClipboardList size={22} />, label: 'Submissions', path: '/instructor/submissions' },
            ];
        }
        if (role === 'Assistant') {
            return [
                { icon: <LayoutDashboard size={22} />, label: 'Dashboard', path: '/assistant' },
                { icon: <BookOpen size={22} />, label: 'My Courses', path: '/assistant/courses' },
                { icon: <ClipboardList size={22} />, label: 'Assignments', path: '/assistant/assignments' },
                { icon: <Award size={22} />, label: 'Submissions', path: '/assistant/submissions' },
            ];
        }
        // Student (default)
        return [
            { icon: <LayoutDashboard size={22} />, label: 'Dashboard', path: '/student' },
            { icon: <BookOpen size={22} />, label: 'Courses', path: '/student/courses' },
            { icon: <ClipboardList size={22} />, label: 'Assignments', path: '/student/assignments' },
            { icon: <Award size={22} />, label: 'Grades', path: '/student/grades' },
            { icon: <User size={22} />, label: 'Profile', path: '/student/profile' },
        ];
    };

    const menuItems = getMenuItems();

    const getRoleLabel = () => {
        if (role === 'Instructor') return 'Instructor Panel';
        if (role === 'Assistant') return 'Assistant Panel';
        return 'E-Learning Suite';
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <aside className="w-72 h-screen glass-card border-r-0 sticky top-0 flex flex-col z-50 overflow-hidden transition-all duration-500 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">

            {/* 🚀 Logo Section */}
            <div className="p-8 mb-4">
                <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 text-white">
                        <GraduationCap size={28} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black tracking-tighter leading-none">
                            <span className="dark:text-white transition-colors duration-500">MINI</span>
                            <span className="text-blue-600 dark:text-blue-400"> LMS</span>
                        </h1>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mt-1">
                            {getRoleLabel()}
                        </span>
                    </div>
                </div>
            </div>

            {/* 🧭 Navigation */}
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
                                <span className="text-sm tracking-tight">{item.label}</span>
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
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between p-4 rounded-[1.5rem] bg-slate-100/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isDarkMode ? 'text-blue-400' : 'text-orange-500'}`}>
                            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                        </div>
                        <span className="text-xs font-black dark:text-white uppercase tracking-tighter">
                            {isDarkMode ? 'Midnight' : 'Daylight'}
                        </span>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}>
                        <motion.div
                            animate={{ x: isDarkMode ? 20 : 0 }}
                            className="w-3 h-3 bg-white rounded-full shadow-md"
                        />
                    </div>
                </button>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 p-4 text-red-500 font-black text-xs hover:bg-red-50 dark:hover:bg-red-950/30 rounded-[1.5rem] transition-all group"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="tracking-widest uppercase">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;