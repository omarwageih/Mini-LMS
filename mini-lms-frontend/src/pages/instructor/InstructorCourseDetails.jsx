import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, FileText, Video, ClipboardList,
    ChevronRight, BookOpen, Layers, Monitor, Calendar,
    Users, Inbox, Loader2
} from 'lucide-react';
import { apiGet } from '../../api';
import EmptyState from '../../components/EmptyState';

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
                <EmptyState type="courses" title="Course not found" subtitle="The course may have been removed or doesn't exist." />
            </div>
        );
    }

    const { course, weeks, lectures, assignments, enrolledCount, submissionCount } = courseData;

    return (
        <div className="min-h-screen pt-10 px-6 pb-20 selection:bg-cyan-500/30">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* 🌌 Navigation & Header Area */}
                <div className="relative">
                    <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
                    
                    <div className="relative space-y-8">
                        <button
                            onClick={() => navigate('/instructor/courses')}
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:hover:text-cyan-400 transition-all group w-fit bg-white/50 dark:bg-white/5 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-blue-500/30 backdrop-blur-md"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Fleet Management</span>
                        </button>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-xl tracking-widest uppercase shadow-lg shadow-blue-500/20">
                                        ID {course.CourseID}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-70 italic font-outfit">Active Operation</span>
                                    </div>
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.8] font-stalinist">
                                    {course.CourseName}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black">
                                        {course.InstructorName?.charAt(0)}
                                    </div>
                                    <span className="opacity-80 px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-full text-[9px] border border-slate-200 dark:border-white/10 uppercase font-black">Commander</span>
                                    <span className="text-slate-900 dark:text-white">{course.InstructorName}</span>
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* 🛰 Quick Data Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Study Modules', val: weeks.length, icon: <Layers size={22} />, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                        { label: 'Lecture Feeds', val: lectures.length, icon: <Video size={22} />, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                        { label: 'Active Objectives', val: assignments.length, icon: <ClipboardList size={22} />, color: 'text-purple-500', bg: 'bg-purple-500/5' },
                        { label: 'Personnel Count', val: enrolledCount, icon: <Users size={22} />, color: 'text-orange-500', bg: 'bg-orange-500/5' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="glass-card p-8 flex flex-col items-center text-center gap-4 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-950/60 hover:border-blue-500/20 transition-all group"
                        >
                            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                            <div className="space-y-1">
                                <p className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none">{stat.val}</p>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-12">
                        {/* Syllabus Registry */}
                        <section className="space-y-8">
                            <div className="flex items-center gap-6">
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-3 italic">
                                    <Layers className="text-blue-600" size={24} />
                                    Deployment Syllabus
                                </h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-white/10 to-transparent"></div>
                            </div>

                            {weeks.length === 0 ? (
                                <div className="py-20 text-center glass-card bg-slate-50/50 dark:bg-white/5 border-dashed border-2">
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-loose italic">No study modules deployed for this terminal</p>
                                </div>
                            ) : (
                                <div className="grid gap-8">
                                    {weeks.map((week, index) => (
                                        <motion.div
                                            key={week.WeekID || index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="glass-card group border border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-950/40 relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
                                            
                                            <div className="p-8 flex justify-between items-center border-b border-slate-100 dark:border-white/5">
                                                <div className="flex items-center gap-8">
                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 flex items-center justify-center text-3xl font-black shadow-xl group-hover:rotate-6 transition-transform">
                                                        {week.WeekNumber}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-slate-800 dark:text-white uppercase text-xl md:text-2xl tracking-tighter group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                                                            {week.Title}
                                                        </h3>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1 italic">Module Sequence Alpha</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {week.materials && week.materials.map((item, i) => (
                                                    <div
                                                        key={`mat-${i}`}
                                                        className="flex items-center gap-5 p-5 rounded-3xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:shadow-2xl transition-all group/item cursor-pointer"
                                                    >
                                                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 group-hover/item:bg-blue-600 group-hover/item:text-white flex items-center justify-center transition-all shadow-sm border border-slate-200 dark:border-white/5">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-tight leading-tight">{item.Title}</p>
                                                            <span className="text-[8px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mt-1">Resource Archive</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="space-y-12">
                        {/* Visual Log / Lectures */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white italic">
                                    Broadcasts
                                </h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-white/10 to-transparent"></div>
                            </div>

                            <div className="space-y-4">
                                {lectures.length > 0 ? lectures.map((lec, i) => (
                                    <div key={lec.LectureID || i} className="glass-card p-6 border border-slate-100 dark:border-white/5 bg-white/50 dark:bg-white/5 hover:border-emerald-500/30 transition-all group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-inner">
                                                <Video size={18} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none group-hover:text-emerald-500 transition-colors">{lec.Title}</p>
                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 opacity-70">Secured Feed</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5 opacity-60">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Temporal</span>
                                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                    {lec.Date ? new Date(lec.Date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Timeframe</span>
                                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                    {lec.Start_Time || '00:00'} - {lec.End_Time || '00:00'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-10 text-center glass-card border-dashed border-2 border-slate-100 dark:border-white/5">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-loose">Feeds Offline</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Submission Matrix / Assignments */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white italic">
                                    Objective Matrix
                                </h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-white/10 to-transparent"></div>
                            </div>

                            <div className="space-y-4">
                                {assignments.length > 0 ? assignments.map((a, i) => (
                                    <div key={a.AssignmentID || i} className="glass-card p-6 border border-slate-100 dark:border-white/5 bg-white/50 dark:bg-white/5 hover:border-purple-500/30 transition-all group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-[#a78bfa] flex items-center justify-center border border-purple-500/10 group-hover:bg-purple-600 dark:group-hover:bg-[#a78bfa] group-hover:text-white transition-all shadow-inner">
                                                <ClipboardList size={20} />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none group-hover:text-purple-600 dark:group-hover:text-[#a78bfa] transition-colors truncate">{a.Title}</p>
                                                <p className="text-[10px] font-black text-purple-600 dark:text-[#a78bfa] uppercase tracking-widest mt-1 opacity-70 italic font-mono">ID {a.AssignmentID}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Weighting</span>
                                                <span className="text-[10px] font-black text-emerald-500 uppercase">{a.Max_Score} Units</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Hard Deadline</span>
                                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">
                                                    {a.Deadline ? new Date(a.Deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '∞'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-10 text-center glass-card border-dashed border-2 border-slate-100 dark:border-white/5">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-loose">Matrix registry empty</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer Trace */}
                <div className="pt-20 text-center opacity-40">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.6em]">
                        Command Interface Trace • Session ID {new Date().getTime().toString(16)} • Mini LMS
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InstructorCourseDetails;
