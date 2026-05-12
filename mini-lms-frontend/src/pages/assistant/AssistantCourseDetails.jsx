import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, FileText, Video, ClipboardList, MessageSquare,
    ChevronDown, ChevronRight, Play, X, Calendar, Plus, Upload, Loader2, CheckCircle2, AlertCircle,
    Users, Award, Target, BookOpen, Trash2
} from 'lucide-react';
import { apiGet, apiPost, apiDelete, assistantAPI } from '../../services/api';
import ReactPlayer from 'react-player';

// Tabs
import ParticipantsTab from '../../components/common/ParticipantsTab';
import GradesTab from '../../components/common/GradesTab';
import ActivitiesTab from '../../components/common/ActivitiesTab';
import AttendanceTab from '../../components/common/AttendanceTab';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AssistantCourseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [courseData, setCourseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedWeeks, setExpandedWeeks] = useState({});
    const [activeTab, setActiveTab] = useState('course'); // 'course' | 'participants' | 'grades' | 'activities' | 'competencies'
    const [activeVideo, setActiveVideo] = useState(null);
    
    // UI State for forms
    const [activeForm, setActiveForm] = useState({ type: null, weekId: null }); // type: 'material' | 'lecture'
    
    // Form data
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });
    
    const [materialForm, setMaterialForm] = useState({ title: '', description: '', file: null, fileType: 'document', url: '' });
    const [lectureForm, setLectureForm] = useState({ title: '', date: '', startTime: '', endTime: '' });

    const loadData = async () => {
        try {
            // Use the combined endpoint if available, otherwise manual fetch
            // Instructor uses /instructor/courses/:id/content
            // Assistant should have a similar one or we fetch course+weeks
            const contentData = await assistantAPI.getCourseDetails(id);
            setCourseData(contentData.data || contentData);
            
            // Expand all weeks by default if first load
            if (Object.keys(expandedWeeks).length === 0 && (contentData.weeks || contentData.data?.weeks)) {
                const initialExpanded = {};
                const weeks = contentData.weeks || contentData.data?.weeks;
                weeks.forEach(w => { initialExpanded[w.WeekID] = true });
                setExpandedWeeks(initialExpanded);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const toggleWeek = (weekId) => {
        setExpandedWeeks(prev => ({
            ...prev,
            [weekId]: !prev[weekId]
        }));
    };

    const handleUploadMaterial = async (e, weekId) => {
        e.preventDefault();
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('courseId', id);
            formData.append('weekId', weekId);
            formData.append('title', materialForm.title);
            formData.append('description', materialForm.description);
            formData.append('fileType', materialForm.fileType);
            if (materialForm.file) formData.append('file', materialForm.file);
            if (materialForm.url) formData.append('url', materialForm.url);

            await assistantAPI.uploadCourseMaterial(formData);
            
            setMsg({ text: 'Resource deployed successfully!', type: 'success' });
            setMaterialForm({ title: '', description: '', file: null, fileType: 'document', url: '' });
            setActiveForm({ type: null, weekId: null });
            loadData();
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        } catch (err) {
            setMsg({ text: err.response?.data?.message || err.message, type: 'error' });
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        } finally {
            setUploading(false);
        }
    };

    const handleAddLecture = async (e, weekId) => {
        e.preventDefault();
        setUploading(true);
        try {
            const payload = {
                courseId: id,
                weekId: weekId,
                title: lectureForm.title,
                date: lectureForm.date,
                startTime: lectureForm.startTime,
                endTime: lectureForm.endTime
            };
            await apiPost('/assistant/courses/lectures', payload);
            
            setMsg({ text: 'Lecture scheduled successfully!', type: 'success' });
            setLectureForm({ title: '', date: '', startTime: '', endTime: '' });
            setActiveForm({ type: null, weekId: null });
            loadData();
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        } catch (err) {
            setMsg({ text: err.message, type: 'error' });
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteMaterial = async (mId) => {
        if (!window.confirm("Are you sure you want to decommission this resource?")) return;
        try {
            await assistantAPI.deleteMaterial(mId);
            setMsg({ text: 'Resource removed.', type: 'success' });
            loadData();
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        } catch (err) {
            setMsg({ text: err.response?.data?.message || err.message, type: 'error' });
        }
    };

    const handleDeleteLecture = async (lId) => {
        if (!window.confirm("Are you sure you want to cancel this scheduled session?")) return;
        try {
            await assistantAPI.deleteLecture(lId);
            setMsg({ text: 'Session cancelled.', type: 'success' });
            loadData();
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        } catch (err) {
            setMsg({ text: err.response?.data?.message || err.message, type: 'error' });
        }
    };

    const handleDeleteWeek = async (wId) => {
        if (!window.confirm("Are you sure you want to remove this entire module? All materials and lectures within will be impacted.")) return;
        try {
            await assistantAPI.deleteWeek(wId);
            setMsg({ text: 'Module removed.', type: 'success' });
            loadData();
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        } catch (err) {
            setMsg({ text: err.response?.data?.message || err.message, type: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#020617] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] italic">Accessing Terminal...</p>
                </div>
            </div>
        );
    }

    if (!courseData || !courseData.course) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle size={40} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs italic">Course Not Found</p>
                    <button onClick={() => navigate('/assistant/dashboard')} className="text-blue-600 font-bold text-xs uppercase tracking-tighter">Return to Base</button>
                </div>
            </div>
        );
    }

    const { course, weeks, lectures, assignments } = courseData;

    const tabs = [
        { id: 'course', label: 'Syllabus', icon: <BookOpen size={14} /> },
        { id: 'participants', label: 'Roster', icon: <Users size={14} /> },
        { id: 'grades', label: 'Gradebook', icon: <Award size={14} /> },
        { id: 'activities', label: 'Operations', icon: <Target size={14} /> },
        { id: 'attendance', label: 'Attendance', icon: <Calendar size={14} /> }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'course':
                return (
                    <div className="space-y-4 pt-4">
                        {/* General Section */}
                        <div className="glass-card overflow-hidden shadow-xl shadow-blue-500/5">
                            <div className="px-6 py-5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white italic">General</h2>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => {
                                            const anyCollapsed = (weeks || []).some(w => !expandedWeeks[w.WeekID]);
                                            if (anyCollapsed) {
                                                const allExpandedObj = {};
                                                (weeks || []).forEach(w => { allExpandedObj[w.WeekID] = true });
                                                setExpandedWeeks(allExpandedObj);
                                            } else {
                                                setExpandedWeeks({});
                                            }
                                        }}
                                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        {(weeks || []).some(w => !expandedWeeks[w.WeekID]) ? 'Expand all' : 'Collapse all'}
                                    </button>
                                </div>
                            </div>
                            <div className="px-6 py-5 border-t border-slate-100 dark:border-white/5 space-y-3">
                                <Link to={`/discussions/${course.CourseID}`} className="flex items-center gap-4 text-blue-600 dark:text-blue-400 hover:bg-blue-600/5 p-4 rounded-2xl transition-all border border-transparent hover:border-blue-500/20 group">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform">
                                        <MessageSquare size={22} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black text-sm uppercase tracking-wider italic">Course Announcements & Discussions</span>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Interaction Hub</span>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Weeks Accordions */}
                        {(weeks || []).map((week) => {
                            const isExpanded = expandedWeeks[week.WeekID];
                            let dateString = `Week ${week.WeekNumber}`;
                            if (week.Title) {
                                dateString = week.Title
                                    .replace(/â€“/g, '–')
                                    .replace(/Â€“/g, '–')
                                    .replace(/â€™/g, "'")
                                    .replace(/Â/g, '');
                            }

                            return (
                                <div key={week.WeekID} className="glass-card overflow-hidden shadow-xl shadow-blue-500/5 group/week">
                                    <div 
                                        onClick={() => toggleWeek(week.WeekID)}
                                        className="w-full px-6 py-5 flex items-center justify-between bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                                                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                            </div>
                                            <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-white italic uppercase">{dateString}</h2>
                                        </div>
                                        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                            <button 
                                                onClick={() => setActiveForm({ type: 'material', weekId: week.WeekID })}
                                                className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:hover:bg-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-2 transition-all border border-emerald-200/50 dark:border-emerald-500/20"
                                            >
                                                <Plus size={14} /> PDF / Video
                                            </button>
                                            <button 
                                                onClick={() => setActiveForm({ type: 'lecture', weekId: week.WeekID })}
                                                className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:hover:bg-orange-500/20 px-4 py-2 rounded-xl flex items-center gap-2 transition-all border border-orange-200/50 dark:border-orange-500/20"
                                            >
                                                <Plus size={14} /> Lecture
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteWeek(week.WeekID); }}
                                                className="p-2 text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 py-6 border-t border-slate-100 dark:border-white/5 space-y-4 ml-12">
                                                    {/* Material Upload Form */}
                                                    {activeForm.type === 'material' && activeForm.weekId === week.WeekID && (
                                                        <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-blue-500/10 animate-in fade-in slide-in-from-top-2">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 italic">Deploy Resource</h3>
                                                                <button onClick={() => setActiveForm({ type: null, weekId: null })} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                                                            </div>
                                                            <form onSubmit={(e) => handleUploadMaterial(e, week.WeekID)} className="space-y-4">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                                                                        <input type="text" required value={materialForm.title} onChange={e => setMaterialForm({...materialForm, title: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Intro to Architecture" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Resource Type</label>
                                                                        <select value={materialForm.fileType} onChange={e => setMaterialForm({...materialForm, fileType: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                                                            <option value="document">PDF / Document</option>
                                                                            <option value="video">Video Link</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                {materialForm.fileType === 'document' ? (
                                                                    <div className="space-y-1">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">File Deployment</label>
                                                                        <input type="file" required onChange={e => setMaterialForm({...materialForm, file: e.target.files[0]})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-1">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">External URL</label>
                                                                        <input type="url" required value={materialForm.url} onChange={e => setMaterialForm({...materialForm, url: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="https://www.youtube.com/watch?v=..." />
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-end pt-2">
                                                                    <button type="submit" disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20">
                                                                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                                        Execute Deployment
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        </div>
                                                    )}

                                                    {/* Lecture Form */}
                                                    {activeForm.type === 'lecture' && activeForm.weekId === week.WeekID && (
                                                        <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-orange-500/10 animate-in fade-in slide-in-from-top-2">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 italic">Schedule Session</h3>
                                                                <button onClick={() => setActiveForm({ type: null, weekId: null })} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                                                            </div>
                                                            <form onSubmit={(e) => handleAddLecture(e, week.WeekID)} className="space-y-4">
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Title</label>
                                                                    <input type="text" required value={lectureForm.title} onChange={e => setLectureForm({...lectureForm, title: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Systems Deep-Dive" />
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                                                                        <input type="date" required value={lectureForm.date} onChange={e => setLectureForm({...lectureForm, date: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                                                                        <input type="time" value={lectureForm.startTime} onChange={e => setLectureForm({...lectureForm, startTime: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">End Time</label>
                                                                        <input type="time" value={lectureForm.endTime} onChange={e => setLectureForm({...lectureForm, endTime: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-end pt-2">
                                                                    <button type="submit" disabled={uploading} className="bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-widest py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20">
                                                                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
                                                                        Confirm Schedule
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        </div>
                                                    )}

                                                    {/* Materials List */}
                                                    {(week.materials || []).map(mat => {
                                                        const isVideo = mat.Type === 'Video' || (mat.FileURL && (mat.FileURL.includes('youtube.com') || mat.FileURL.includes('youtu.be')));
                                                        return (
                                                            <div key={`mat-${mat.MaterialID}`} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-blue-500/20 group cursor-pointer transition-all">
                                                                <div onClick={() => isVideo ? setActiveVideo(mat) : window.open(mat.FileURL.startsWith('http') ? mat.FileURL : `${API_URL}${mat.FileURL}`, '_blank')} className="flex items-center gap-4 flex-1">
                                                                    <div className={`p-3 rounded-xl ${isVideo ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                                                        {isVideo ? <Video size={20} className="text-emerald-600" /> : <FileText size={20} className="text-blue-600" />}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white group-hover:text-blue-600 italic transition-colors">{mat.Title}</span>
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isVideo ? 'Video' : 'Document'}</span>
                                                                    </div>
                                                                </div>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteMaterial(mat.MaterialID); }} className="ml-auto p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Lectures List */}
                                                    {(week.lectures || []).map(lec => (
                                                        <div key={`lec-${lec.LectureID}`} className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group hover:border-orange-500/20 transition-all">
                                                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                                                                <Calendar size={20} className="text-orange-600" />
                                                            </div>
                                                            <div className="flex flex-col flex-1">
                                                                <span className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white italic">{lec.Title}</span>
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{new Date(lec.Date).toLocaleDateString()} @ {lec.Start_Time.slice(0, 5)}</span>
                                                            </div>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteLecture(lec.LectureID); }}
                                                                className="ml-auto p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                );
            case 'participants': return <ParticipantsTab courseId={id} role="assistant" />;
            case 'grades': return <GradesTab courseId={id} role="assistant" />;
            case 'activities': return <ActivitiesTab courseId={id} role="assistant" assignments={assignments} onRefresh={loadData} />;
            case 'attendance': return <AttendanceTab courseId={id} role="assistant" />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white pb-20 transition-colors duration-500">
            {/* Top Navigation Bar */}
            <div className="border-b border-slate-200 dark:border-white/10 px-6 py-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate('/assistant/dashboard')}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-black uppercase tracking-widest transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Assistant Hub
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-1 rounded uppercase tracking-tighter">Assistant View</span>
                    </div>
                </div>
            </div>

            {msg.text && (
                <div className={`fixed top-20 right-4 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest animate-in slide-in-from-right-4 ${msg.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} 
                    {msg.text}
                </div>
            )}

            <div className="max-w-5xl mx-auto px-6 mt-12 space-y-8">
                {/* Course Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase leading-none">
                            {course.Name || course.CourseName}
                        </h1>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] ml-1">Academic Support Terminal</p>
                    </div>
                </div>

                {/* Modern Tabs */}
                <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl w-fit shadow-sm overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                activeTab === tab.id 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderTabContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Video Player Modal */}
            <AnimatePresence>
                {activeVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
                    >
                        <div className="absolute inset-0" onClick={() => setActiveVideo(null)}></div>
                        <div className="relative w-full max-w-4xl bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
                            <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-center">
                                <h3 className="text-white font-black italic tracking-widest uppercase text-sm">
                                    {activeVideo.Title}
                                </h3>
                                <button
                                    onClick={() => setActiveVideo(null)}
                                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="aspect-video w-full">
                                <ReactPlayer
                                    url={activeVideo.FileURL.startsWith('http') ? activeVideo.FileURL : `${API_URL}${activeVideo.FileURL}`}
                                    width="100%"
                                    height="100%"
                                    controls
                                    playing
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AssistantCourseDetails;
