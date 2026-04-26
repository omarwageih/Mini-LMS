import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, Users, Monitor, ChevronRight } from 'lucide-react';
import { apiGet } from '../api';

const MyCourses = () => {
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiGet('/student/courses');
                setCourses(data);
            } catch (err) { console.error(err); }
        };
        load();
    }, []);

    const colors = ['from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500', 'from-purple-500 to-indigo-500', 'from-orange-500 to-amber-500'];

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 min-h-screen">
            {/* Header section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
            >
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
                    My <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Courses</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium">
                    Manage your academic journey and access your learning materials in one place.
                </p>
            </motion.div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.length === 0 ? (
                    <p className="text-slate-400 text-sm italic col-span-full text-center py-20">No enrolled courses found</p>
                ) : courses.map((course, index) => (
                    <Link to={`/student/course/${course.CourseID}`} key={course.CourseID}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -8 }}
                            className="group relative bg-white dark:bg-slate-900/50 rounded-[2rem] p-1 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 overflow-hidden h-full"
                        >
                            <div className={`h-2 w-full bg-gradient-to-r ${colors[index % colors.length]} absolute top-0 left-0`} />

                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                        <span className="text-[11px] font-black tracking-widest text-slate-600 dark:text-slate-300 uppercase">
                                            Course #{course.CourseID}
                                        </span>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full animate-pulse bg-gradient-to-r ${colors[index % colors.length]}`} />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                                        {course.CourseName}
                                    </h3>
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                        <Monitor size={16} className="opacity-70" />
                                        <span className="text-sm font-bold italic">{course.InstructorName}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 py-4 border-y border-slate-50 dark:border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Duration</span>
                                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold">
                                            <Clock size={14} className="text-blue-500" />
                                            <span>14 Weeks</span>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100 dark:bg-white/10" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Status</span>
                                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold">
                                            <Users size={14} className="text-cyan-500" />
                                            <span>Enrolled</span>
                                        </div>
                                    </div>
                                </div>

                                <button className={`w-full group/btn relative flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r ${colors[index % colors.length]} text-white font-black text-sm transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]`}>
                                    VIEW CONTENT
                                    <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default MyCourses;