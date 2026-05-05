import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Users, UserPlus, BookOpen, ClipboardList,
    Sparkles, ArrowRight, GraduationCap, Activity
} from 'lucide-react';
import { apiGet } from '../../services/api';
import { format } from 'date-fns';

const InstructorDashboard = () => {
    const [stats, setStats] = useState({ students: 0, assistants: 0, courses: 0 });
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        loadStats();
        return () => clearInterval(timer);
    }, []);

    const loadStats = async () => {
        try {
            const [students, assistants, courses] = await Promise.all([
                apiGet('/instructor/students'),
                apiGet('/instructor/assistants'),
                apiGet('/instructor/courses')
            ]);
            setStats({
                students: students.length,
                assistants: assistants.length,
                courses: courses.length
            });
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    };

    return (
        <div className="min-h-screen pt-10 px-6 transition-all duration-500">
            <div className="max-w-7xl mx-auto space-y-10 pb-20">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-white/10 pb-10">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-2 text-blue-600 dark:text-[#a78bfa] font-black text-[10px] mb-3 tracking-[0.4em] uppercase">
                            <Sparkles size={14} className="animate-pulse" />
                            Instructor Panel
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-[#a78bfa]">Dr. Abdulhameed</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-bold italic uppercase text-xs tracking-widest">
                            Full System Control • Manage Everything
                        </p>
                    </motion.div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { label: 'Total Students', val: String(stats.students).padStart(2, '0'), icon: <Users />, color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/instructor/students' },
                        { label: 'Assistants', val: String(stats.assistants).padStart(2, '0'), icon: <UserPlus />, color: 'text-[#a78bfa]', bg: 'bg-[#a78bfa]/10', path: '/instructor/assistants' },
                        { label: 'My Modules', val: String(stats.courses).padStart(2, '0'), icon: <BookOpen />, color: 'text-cyan-500', bg: 'bg-cyan-500/10', path: '/instructor/my-courses' }
                    ].map((stat, i) => (
                        <Link key={i} to={stat.path}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="glass-card p-8 flex items-center gap-6 border-l-4 border-l-blue-500 dark:border-l-[#a78bfa] cursor-pointer group transition-all shadow-xl shadow-slate-200/50 dark:shadow-none"
                            >
                                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                    {React.cloneElement(stat.icon, { size: 28 })}
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{stat.val}</h3>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>

                {/* Welcome Card + Quick Actions */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                    <div className="xl:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card p-10 relative overflow-hidden bg-gradient-to-br from-blue-600/10 via-transparent to-[#a78bfa]/10 border-none shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 p-10 opacity-5 dark:opacity-10">
                                <GraduationCap size={160} className="text-[#a78bfa]" />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                    System <br />
                                    <span className="text-blue-600 dark:text-[#a78bfa]">Control Center</span>
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 font-bold max-w-lg leading-relaxed text-sm">
                                    Manage your students, assistants, courses, and review all submissions from one place.
                                </p>
                                <div className="flex flex-wrap gap-4 pt-4">
                                    <Link to="/instructor/submissions" className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                                        View Submissions <ArrowRight size={16} />
                                    </Link>
                                    <Link to="/instructor/my-courses" className="inline-flex items-center gap-3 px-8 py-4 bg-white dark:bg-white/5 text-slate-700 dark:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg border border-slate-200 dark:border-white/10 hover:scale-105 transition-all">
                                        My Modules <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-8">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white px-2 italic uppercase tracking-tighter flex items-center gap-2">
                            <Activity size={20} className="text-[#a78bfa]" />
                            Quick Actions
                        </h2>
                        <div className="glass-card p-8 space-y-4 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60">
                            {[
                                { title: 'Manage Students', path: '/instructor/students', icon: <Users />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                                { title: 'Manage Assistants', path: '/instructor/assistants', icon: <UserPlus />, color: 'text-[#a78bfa]', bg: 'bg-[#a78bfa]/10' },
                                { title: 'View Submissions', path: '/instructor/submissions', icon: <ClipboardList />, color: 'text-cyan-500', bg: 'bg-cyan-500/10' }
                            ].map((item, idx) => (
                                <Link key={idx} to={item.path}>
                                    <div className="flex gap-5 group items-center p-3 rounded-2xl transition-all border border-transparent hover:border-blue-500/20 hover:bg-blue-500/5">
                                        <div className={`w-12 h-12 shrink-0 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center`}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase leading-tight tracking-tight">{item.title}</h4>
                                        </div>
                                        <ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorDashboard;
