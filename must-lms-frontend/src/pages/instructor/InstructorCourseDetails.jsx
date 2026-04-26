import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, FileText, Video, ClipboardList,
    ChevronRight, BookOpen, Layers, Monitor, Calendar,
    Users, Inbox, Loader2
} from 'lucide-react';
import { apiGet } from '../../api';
import { EmptyState } from '../../components/UIHelpers';

const InstructorCourseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [courseData, setCourseData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiGet(`/instructor/courses/${id}/content`);
                setCourseData(data);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        load();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Loader2 size={40} className="text-cyan-500" />
                </motion.div>
            </div>
        );
    }

    if (!courseData || !courseData.course) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <EmptyState title="Course not found" subtitle="The course may have been removed or doesn't exist." icon={BookOpen} />
            </div>
        );
    }

    const { course, weeks, lectures, assignments, enrolledCount, submissionCount } = courseData;

    return (
        <div className="min-h-screen pt-10 px-6 pb-20 selection:bg-cyan-500/30">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* Navigation & Header */}
                <div className="space-y-6">
                    <button
                        onClick={() => navigate('/instructor/courses')}
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:hover:text-cyan-400 transition-all group w-fit bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-full border border-transparent hover:border-blue-500/30"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Courses</span>
                    </button>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-cyan-600 text-white text-[10px] font-black px-3 py-1 rounded-lg tracking-tighter uppercase">
                                    Course #{course.CourseID}
                                </span>
                                <div className="h-px w-8 bg-slate-300 dark:bg-white/10"></div>
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">Instructor View</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                                {course.CourseName}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-4 font-bold italic flex items-center gap-2">
                                <Monitor size={16} className="text-cyan-500" />
                                {course.InstructorName} • Max: {course.Max_Marks} pts
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Study Weeks', val: weeks.length, icon: <Layers size={20} />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Lectures', val: lectures.length, icon: <Video size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { label: 'Assignments', val: assignments.length, icon: <ClipboardList size={20} />, color: 'text-[#a78bfa]', bg: 'bg-[#a78bfa]/10' },
                        { label: 'Enrolled', val: enrolledCount, icon: <Users size={20} />, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="glass-card p-6 flex items-center gap-4 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60"
                        >
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>{stat.icon}</div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stat.val}</p>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Course Syllabus / Weeks */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-2">
                            <Layers className="text-blue-600" />
                            Course Syllabus
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-white/10 to-transparent"></div>
                    </div>

                    {weeks.length === 0 ? (
                        <EmptyState title="No weeks added" subtitle="Use the Manage Courses page to add study weeks." icon={Layers} />
                    ) : (
                        <div className="grid gap-6">
                            {weeks.map((week, index) => (
                                <motion.div
                                    key={week.WeekID || index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="glass-card overflow-hidden group border-l-4 border-l-transparent hover:border-l-cyan-600 transition-all bg-white dark:bg-slate-900/40"
                                >
                                    <div className="p-6 flex justify-between items-center bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 group-hover:bg-cyan-600/5 transition-colors">
                                        <div className="flex items-center gap-5">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-xl font-black shadow-2xl transition-transform group-hover:scale-110">
                                                    {week.WeekNumber < 10 ? `0${week.WeekNumber}` : week.WeekNumber}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800 dark:text-white uppercase text-lg tracking-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                                    Week {week.WeekNumber}
                                                </h3>
                                                <p className="text-xs text-slate-500 font-bold italic">{week.Title}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {week.materials?.length || 0} materials
                                            </span>
                                            <ChevronRight className="text-slate-300 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>

                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {week.materials && week.materials.map((item, i) => (
                                            <div
                                                key={`mat-${i}`}
                                                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:shadow-xl hover:shadow-cyan-500/5 transition-all group/item"
                                            >
                                                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover/item:bg-cyan-600 group-hover/item:text-white transition-all shadow-sm">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-tight">{item.Title}</p>
                                                    <span className="text-[9px] text-cyan-600 dark:text-cyan-500 font-black uppercase tracking-widest">Material</span>
                                                </div>
                                            </div>
                                        ))}

                                        {(!week.materials || week.materials.length === 0) && (
                                            <p className="text-slate-400 text-xs italic p-4 col-span-full text-center">No materials yet</p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Lectures */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-2">
                            <Video className="text-emerald-500" />
                            Lectures
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-white/10 to-transparent"></div>
                    </div>

                    {lectures.length === 0 ? (
                        <EmptyState title="No lectures scheduled" subtitle="Add lectures via the Manage Courses page." icon={Video} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {lectures.map((lec, i) => (
                                <motion.div
                                    key={lec.LectureID || i}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className="glass-card p-6 flex items-center gap-4 border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-all"
                                >
                                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                                        <Video size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 dark:text-white">{lec.Title}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                <Calendar size={10} />
                                                {lec.Date ? new Date(lec.Date).toLocaleDateString() : 'N/A'}
                                            </span>
                                            {lec.Start_Time && (
                                                <span className="text-[10px] text-slate-400 font-bold">
                                                    {lec.Start_Time} - {lec.End_Time}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Assignments */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-2">
                            <ClipboardList className="text-[#a78bfa]" />
                            Assignments
                        </h2>
                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">
                            {submissionCount} submission{submissionCount !== 1 ? 's' : ''} received
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-white/10 to-transparent"></div>
                    </div>

                    {assignments.length === 0 ? (
                        <EmptyState title="No assignments created" subtitle="Create assignments from the Manage Courses page." icon={ClipboardList} />
                    ) : (
                        <div className="space-y-4">
                            {assignments.map((a, i) => (
                                <motion.div
                                    key={a.AssignmentID || i}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className="glass-card p-6 flex items-center justify-between border border-slate-100 dark:border-white/5 hover:border-[#a78bfa]/30 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-[#a78bfa]/10 text-[#a78bfa]">
                                            <ClipboardList size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">{a.Title}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">
                                                Max Score: {a.Max_Score} • {a.Deadline ? `Due: ${new Date(a.Deadline).toLocaleDateString()}` : 'No deadline'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                        a.Deadline && new Date(a.Deadline) < new Date()
                                            ? 'bg-red-500/10 text-red-500'
                                            : 'bg-emerald-500/10 text-emerald-500'
                                    }`}>
                                        {a.Deadline && new Date(a.Deadline) < new Date() ? 'Closed' : 'Active'}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InstructorCourseDetails;
