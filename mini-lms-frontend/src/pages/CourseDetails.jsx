import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, FileText, Video, ClipboardList,
    ChevronRight, BookOpen, Layers, Monitor, Calendar, MessageSquare, X, Play
} from 'lucide-react';
import { apiGet } from '../api';
import ReactPlayer from 'react-player';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CourseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [courseData, setCourseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeVideo, setActiveVideo] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiGet(`/student/courses/${id}/content`);
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
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Loading course...</p>
            </div>
        );
    }

    if (!courseData || !courseData.course) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-slate-400 font-bold text-sm">Course not found or not enrolled.</p>
            </div>
        );
    }

    const { course, weeks, lectures, assignments } = courseData;

    return (
        <div className="min-h-screen pt-10 px-6 pb-20 selection:bg-cyan-500/30">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* 🌌 Header Area */}
                <div className="relative">
                    <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
                    
                    <div className="relative space-y-8">
                        <button
                            onClick={() => navigate('/student/courses')}
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:hover:text-cyan-400 transition-all group w-fit bg-white/50 dark:bg-white/5 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-blue-500/30 backdrop-blur-md"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Course Deck</span>
                        </button>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-xl tracking-widest uppercase shadow-lg shadow-blue-500/20">
                                        Course ID {course.CourseID}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-70 italic font-outfit">Syllabus Active</span>
                                    </div>
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.8] font-stalinist">
                                    {course.CourseName}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black">
                                        {course.InstructorName?.charAt(0)}
                                    </div>
                                    <span className="opacity-80">Principal Instructor:</span>
                                    <span className="text-slate-900 dark:text-white">{course.InstructorName}</span>
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* 📅 Main Content (Left Column) */}
                    <div className="lg:col-span-2 space-y-12">
                        <section className="space-y-8">
                            <div className="flex items-center gap-6">
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-3 italic">
                                    <Layers className="text-blue-600" size={24} />
                                    Study Modules
                                </h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-white/10 to-transparent"></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{weeks.length} Weeks Available</span>
                            </div>

                            {weeks.length === 0 ? (
                                <div className="p-20 text-center glass-card border-dashed border-2">
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Syllabus content pending deployment</p>
                                </div>
                            ) : (
                                <div className="grid gap-6">
                                    {weeks.map((week, index) => (
                                        <motion.div
                                            key={week.WeekID || index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="glass-card group border border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/40 relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
                                            
                                            {/* Week Header */}
                                            <div className="p-8 flex justify-between items-center bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                                <div className="flex items-center gap-6">
                                                    <div className="relative">
                                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 flex items-center justify-center text-2xl font-black shadow-xl group-hover:rotate-6 transition-transform">
                                                            {week.WeekNumber}
                                                        </div>
                                                        <div className="absolute -top-2 -right-2 px-2 py-1 bg-blue-600 text-white text-[8px] font-black rounded-md tracking-widest uppercase">Cycle</div>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-slate-800 dark:text-white uppercase text-xl tracking-tighter group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                                                            {week.Title}
                                                        </h3>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Operational Module {week.WeekNumber}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Week Materials */}
                                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {week.materials && week.materials.map((item, i) => {
                                                    const isVideo = item.FilePath && item.FilePath.match(/\.(mp4|webm|ogg)$/i);
                                                    return (
                                                        <motion.div
                                                            key={`mat-${i}`}
                                                            whileHover={{ scale: 1.02 }}
                                                            onClick={() => isVideo ? setActiveVideo(item) : window.open(`${API_URL}${item.FilePath}`, '_blank')}
                                                            className="flex items-center gap-5 p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:shadow-2xl hover:shadow-blue-500/10 transition-all cursor-pointer group/item"
                                                        >
                                                            <div className={`w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center transition-all shadow-sm border border-slate-200 dark:border-white/5 ${isVideo ? 'text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-white group-hover/item:border-emerald-500' : 'text-slate-500 dark:text-slate-400 group-hover/item:bg-blue-600 group-hover/item:text-white'}`}>
                                                                {isVideo ? <Play size={20} /> : <FileText size={20} />}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-tight leading-tight line-clamp-1">{item.Title}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${isVideo ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/10 text-blue-600 dark:text-cyan-400'}`}>
                                                                        {isVideo ? 'Video Stream' : 'Document'}
                                                                    </span>
                                                                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none">Ver 1.0</span>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}

                                                {(!week.materials || week.materials.length === 0) && (
                                                    <div className="col-span-full py-8 text-center bg-slate-50/50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No primary resources at this stage</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* 🎥 Sidebar (Right Column) */}
                    <div className="space-y-12">
                        {/* Session Feeds */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-3 italic">
                                    <Video className="text-emerald-500" size={20} />
                                    Sessions
                                </h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-white/10 to-transparent"></div>
                            </div>
                            
                            <div className="space-y-4">
                                {lectures && lectures.length > 0 ? lectures.map((lec, i) => (
                                    <div key={lec.LectureID || i} className="glass-card p-6 border border-slate-100 dark:border-white/5 bg-white/50 dark:bg-white/5 hover:border-emerald-500/30 transition-all group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                <Video size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none group-hover:text-emerald-500 transition-colors">{lec.Title}</p>
                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 opacity-70">Live Stream</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Temporal Log</span>
                                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                    {lec.Date ? new Date(lec.Date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Duration</span>
                                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                    {lec.Start_Time || '00:00'} - {lec.End_Time || '00:00'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center py-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-dashed border-slate-100 dark:border-white/10 rounded-3xl">Offline Feeds Only</p>
                                )}
                            </div>
                        </section>

                        {/* Objectives Tracker */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-3 italic">
                                    <ClipboardList className="text-[#a78bfa]" size={20} />
                                    Tasks
                                </h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-white/10 to-transparent"></div>
                            </div>
                            
                            <div className="space-y-4">
                                {assignments && assignments.length > 0 ? assignments.map((a, i) => (
                                    <div key={a.AssignmentID || i} className="glass-card p-6 border border-slate-100 dark:border-white/5 bg-white/50 dark:bg-white/5 hover:border-purple-500/30 transition-all group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/10 group-hover:bg-purple-500 group-hover:text-white transition-all">
                                                <ClipboardList size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none group-hover:text-purple-600 dark:group-hover:text-[#a78bfa] transition-colors">{a.Title}</p>
                                                <p className="text-[10px] font-black text-purple-600 dark:text-[#a78bfa] uppercase tracking-widest mt-1 opacity-70">Active Submission</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Yield</span>
                                                <span className="text-[10px] font-black text-emerald-500 uppercase">{a.Max_Score} Pts</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cutoff</span>
                                                <span className="text-[10px] font-bold text-red-500 uppercase">
                                                    {a.Deadline ? new Date(a.Deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'No Cutoff'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center py-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-dashed border-slate-100 dark:border-white/10 rounded-3xl">Registry Clear</p>
                                )}
                            </div>
                        </section>

                        {/* Discussion Forum Link */}
                        <section>
                            <Link
                                to={`/discussions/${course.CourseID}`}
                                className="flex items-center justify-between p-6 glass-card border border-slate-100 dark:border-white/5 bg-white/50 dark:bg-white/5 hover:border-blue-500/30 hover:shadow-lg transition-all group rounded-3xl"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter">Discussion Forum</p>
                                        <p className="text-[10px] text-slate-400 font-bold">Ask questions & collaborate</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                            </Link>
                        </section>
                    </div>
                </div>
            </div>

            {/* Video Player Modal */}
            <AnimatePresence>
                {activeVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-slate-900/90 backdrop-blur-xl"
                    >
                        <div className="absolute inset-0" onClick={() => setActiveVideo(null)}></div>
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="relative w-full max-w-5xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                        >
                            {/* Modal Header */}
                            <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-center pointer-events-none">
                                <h3 className="text-white font-black uppercase tracking-widest text-sm drop-shadow-md pointer-events-auto">
                                    {activeVideo.Title}
                                </h3>
                                <button
                                    onClick={() => setActiveVideo(null)}
                                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors pointer-events-auto"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Player */}
                            <div className="aspect-video w-full bg-black">
                                <ReactPlayer
                                    url={`${API_URL}${activeVideo.FilePath}`}
                                    width="100%"
                                    height="100%"
                                    controls
                                    playing
                                    config={{ file: { attributes: { controlsList: 'nodownload' } } }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CourseDetails;