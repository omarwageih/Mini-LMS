import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Monitor } from 'lucide-react';
import { apiGet } from '../../api';

const AssistantCourses = () => {
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiGet('/assistant/courses');
                setCourses(data);
            } catch (err) { console.error(err); }
        };
        load();
    }, []);

    const colors = ['from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500', 'from-purple-500 to-indigo-500', 'from-orange-500 to-amber-500'];

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen pb-20 pt-10 px-4 sm:px-10">
            <div className="max-w-6xl mx-auto space-y-10">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                        <BookOpen className="text-blue-500" size={32} />
                        Assigned Courses
                    </h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-11">Courses You're Assisting In</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courses.length === 0 ? (
                        <p className="text-slate-400 text-sm italic col-span-full text-center py-20">No assigned courses</p>
                    ) : courses.map((course, index) => (
                        <motion.div key={course.CourseID}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -8 }}
                            className="group relative bg-white dark:bg-slate-900/50 rounded-[2rem] p-1 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 overflow-hidden"
                        >
                            <div className={`h-2 w-full bg-gradient-to-r ${colors[index % colors.length]} absolute top-0 left-0`} />
                            <div className="p-8 space-y-4">
                                <div className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 w-fit">
                                    <span className="text-[11px] font-black tracking-widest text-slate-600 dark:text-slate-300 uppercase">Course #{course.CourseID}</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                                    {course.CourseName}
                                </h3>
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <Monitor size={16} className="opacity-70" />
                                    <span className="text-sm font-bold italic">{course.InstructorName}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default AssistantCourses;
