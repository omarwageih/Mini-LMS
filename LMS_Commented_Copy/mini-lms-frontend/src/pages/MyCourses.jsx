import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, Users, Monitor, ChevronRight } from 'lucide-react';
import { apiGet } from '../services/api';
import { SkeletonCourseCard } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';

const MyCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiGet('/student/courses');
                setCourses(data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const colors = ['from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500', 'from-purple-500 to-indigo-500', 'from-orange-500 to-amber-500'];

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 min-h-screen selection:bg-blue-500/30">
            {/* 🌌 Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
            >
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
                    My <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Learning</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl mx-auto font-bold italic opacity-80 uppercase tracking-widest leading-relaxed">
                    Terminal View • Standard Operating Environment • Your Active Courses
                </p>
            </motion.div>

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
                        <Link to={`/course/${course.CourseID}`} key={course.CourseID} className="block group">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -10 }}
                                className="relative bg-white dark:bg-slate-900/50 rounded-[2.5rem] p-1 shadow-2xl shadow-slate-200/20 dark:shadow-none border border-slate-100 dark:border-white/5 overflow-hidden h-full transition-all group-hover:border-blue-500/30"
                            >
                                {/* Top Static Bar */}
                                <div className={`h-2 w-full bg-gradient-to-r ${colorClass} absolute top-0 left-0 opacity-80`} />

                                <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div className="px-4 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-inner">
                                            <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 dark:text-slate-300 uppercase">
                                                ID #{course.CourseID}
                                            </span>
                                        </div>
                                        <div className={`w-2.5 h-2.5 rounded-full animate-pulse bg-gradient-to-r ${colorClass}`} />
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-[1.1] group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors uppercase tracking-tighter italic">
                                            {course.CourseName}
                                        </h3>
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                            <Monitor size={16} className="text-blue-500/70" />
                                            <span className="text-xs font-black uppercase tracking-widest opacity-80 italic">{course.InstructorName}</span>
                                        </div>
                                    </div>

                                    {/* Stats Divider */}
                                    <div className="flex items-center gap-6 py-5 border-y border-slate-50 dark:border-white/5">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Duration</span>
                                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-black text-xs">
                                                <Clock size={14} className="text-blue-500" />
                                                <span>14 WEEKS</span>
                                            </div>
                                        </div>
                                        <div className="w-px h-8 bg-slate-100 dark:bg-white/10" />
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Status</span>
                                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-black text-xs">
                                                <Users size={14} className="text-cyan-500" />
                                                <span>ENROLLED</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CTA Button */}
                                    <div className={`w-full relative flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r ${colorClass} text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all active:scale-[0.95]`}>
                                        ENTER MODULE
                                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
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

export default MyCourses;
