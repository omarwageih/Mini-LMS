import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, Users, Monitor, ChevronRight, BookOpen, Plus } from 'lucide-react';
import { instructorAPI } from '../../services/api';
import { SkeletonCourseCard } from '../../components/Skeletons';
import EmptyState from '../../components/EmptyState';

const InstructorCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await instructorAPI.getMyCourses();
                setCourses(data || []);
            } catch (err) { 
                console.error(err); 
            } finally { 
                setLoading(false); 
            }
        };
        load();
    }, []);

    const colors = [
        'from-blue-600 to-indigo-600', 
        'from-emerald-600 to-teal-600', 
        'from-violet-600 to-purple-600', 
        'from-rose-600 to-pink-600'
    ];

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 min-h-screen selection:bg-blue-500/30">
            {/* 🌌 Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 dark:border-white/10 pb-12">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-[10px] tracking-[0.4em] uppercase">
                        <BookOpen size={14} className="animate-pulse" />
                        Course Portfolio
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                        My <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Modules</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold italic opacity-80 uppercase tracking-widest leading-relaxed">
                        Instructor Control • Master Instance Management • Curriculum Assets
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Link 
                        to="/instructor/courses" 
                        className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
                    >
                        <Plus size={18} /> Create New Module
                    </Link>
                </motion.div>
            </div>

            {/* 📦 Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {loading ? (
                    <>
                        <SkeletonCourseCard />
                        <SkeletonCourseCard />
                        <SkeletonCourseCard />
                    </>
                ) : courses.length === 0 ? (
                    <div className="col-span-full">
                        <EmptyState type="courses" />
                    </div>
                ) : courses.map((course, index) => {
                    const colorClass = colors[index % colors.length];
                    return (
                        <Link to={`/instructor/courses/${course.CourseID}`} key={course.CourseID} className="block group">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -10 }}
                                className="relative bg-white dark:bg-slate-900/50 rounded-[3rem] p-1 shadow-2xl shadow-slate-200/20 dark:shadow-none border border-slate-100 dark:border-white/5 overflow-hidden h-full transition-all group-hover:border-blue-500/30"
                            >
                                {/* Top Static Bar */}
                                <div className={`h-2.5 w-full bg-gradient-to-r ${colorClass} absolute top-0 left-0 opacity-90`} />

                                <div className="p-10 space-y-8">
                                    <div className="flex justify-between items-center">
                                        <div className="px-5 py-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-inner">
                                            <span className="text-[11px] font-black tracking-[0.2em] text-slate-500 dark:text-slate-300 uppercase italic">
                                                Instance #{String(course.CourseID).padStart(3, '0')}
                                            </span>
                                        </div>
                                        <div className={`w-3 h-3 rounded-full animate-pulse bg-gradient-to-r ${colorClass} shadow-lg shadow-blue-500/50`} />
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-[1.1] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tighter italic">
                                            {course.CourseName}
                                        </h3>
                                        <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
                                            <Monitor size={18} className="text-blue-500/70" />
                                            <span className="text-[11px] font-black uppercase tracking-widest opacity-80 italic">Standard Operating Environment</span>
                                        </div>
                                    </div>

                                    {/* Stats Divider */}
                                    <div className="flex items-center gap-8 py-6 border-y border-slate-50 dark:border-white/5">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Enrolled</span>
                                            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-black text-sm italic">
                                                <Users size={16} className="text-blue-500" />
                                                <span>Active Class</span>
                                            </div>
                                        </div>
                                        <div className="w-px h-10 bg-slate-100 dark:bg-white/10" />
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Scale</span>
                                            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-black text-sm italic">
                                                <Clock size={16} className="text-cyan-500" />
                                                <span>{course.Max_Marks} Pts</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CTA Button */}
                                    <div className={`w-full relative flex items-center justify-center gap-4 py-5 rounded-2xl bg-gradient-to-r ${colorClass} text-white font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-[0.95] group-hover:shadow-blue-500/40`}>
                                        Manage Course
                                        <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default InstructorCourses;
