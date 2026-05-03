import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, BookOpen, ClipboardList, Award, CalendarDays, User, Users, GraduationCap, Command } from 'lucide-react';

const allRoutes = [
    // Student
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Student', 'Instructor', 'Assistant'] },
    { label: 'My Courses', path: '/courses', icon: BookOpen, roles: ['Student'] },
    { label: 'Assignments', path: '/assignments', icon: ClipboardList, roles: ['Student'] },
    { label: 'My Grades', path: '/grades', icon: Award, roles: ['Student'] },
    { label: 'Calendar', path: '/calendar', icon: CalendarDays, roles: ['Student'] },
    { label: 'Profile', path: '/profile', icon: User, roles: ['Student', 'Instructor', 'Assistant'] },
    // Instructor
    { label: 'Instructor Dashboard', path: '/instructor', icon: LayoutDashboard, roles: ['Instructor'] },
    { label: 'Manage Students', path: '/instructor/students', icon: Users, roles: ['Instructor'] },
    { label: 'Manage Assistants', path: '/instructor/assistants', icon: GraduationCap, roles: ['Instructor'] },
    { label: 'Manage Courses', path: '/instructor/courses', icon: BookOpen, roles: ['Instructor'] },
    { label: 'Submissions', path: '/instructor/submissions', icon: ClipboardList, roles: ['Instructor'] },
    // Assistant
    { label: 'Assistant Dashboard', path: '/assistant', icon: LayoutDashboard, roles: ['Assistant'] },
    { label: 'My Courses', path: '/assistant/courses', icon: BookOpen, roles: ['Assistant'] },
    { label: 'Assignments', path: '/assistant/assignments', icon: ClipboardList, roles: ['Assistant'] },
    { label: 'Submissions', path: '/assistant/submissions', icon: ClipboardList, roles: ['Assistant'] },
];

const QuickSearch = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const inputRef = useRef(null);

    const userStr = localStorage.getItem('user');
    let userRole = 'Student';
    try { userRole = JSON.parse(userStr)?.UserType || 'Student'; } catch {}

    const filteredRoutes = allRoutes
        .filter(r => r.roles.includes(userRole))
        .filter(r => r.label.toLowerCase().includes(query.toLowerCase()));

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSelect = (path) => {
        navigate(path);
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && filteredRoutes.length > 0) {
            handleSelect(filteredRoutes[0].path);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                        onClick={() => setIsOpen(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[101]"
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
                            <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-white/5">
                                <Search size={20} className="text-slate-400 shrink-0" />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search pages..."
                                    className="flex-1 bg-transparent text-slate-800 dark:text-white font-bold text-sm outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                />
                                <kbd className="px-2 py-1 bg-slate-100 dark:bg-white/5 text-[9px] font-black text-slate-400 rounded-lg uppercase">Esc</kbd>
                            </div>
                            <div className="max-h-80 overflow-y-auto p-2">
                                {filteredRoutes.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-xs font-bold">No results found</div>
                                ) : (
                                    filteredRoutes.map((route) => {
                                        const Icon = route.icon;
                                        return (
                                            <button
                                                key={route.path}
                                                onClick={() => handleSelect(route.path)}
                                                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left group"
                                            >
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-colors">
                                                    <Icon size={18} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors">{route.label}</span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                            <div className="p-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-center gap-2">
                                <Command size={12} className="text-slate-400" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ctrl+K to toggle</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default QuickSearch;
