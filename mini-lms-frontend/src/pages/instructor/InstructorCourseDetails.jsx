import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, FileText, Video, ClipboardList, MessageSquare,
    ChevronDown, ChevronRight, Play, X, Calendar, Plus, Upload, Loader2, CheckCircle2, AlertCircle,
    Users, Award, Target, BookOpen, Trash2, Edit2
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete, instructorAPI } from '../../services/api';
import ReactPlayer from 'react-player';
import ParticipantsTab from '../../components/common/ParticipantsTab';
import GradesTab from '../../components/common/GradesTab';
import ActivitiesTab from '../../components/common/ActivitiesTab';
import AttendanceTab from '../../components/common/AttendanceTab';
import CompetenciesTab from '../course-tabs/CompetenciesTab';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const InstructorCourseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [courseData, setCourseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedWeeks, setExpandedWeeks] = useState({});
    const [activeTab, setActiveTab] = useState('course'); // 'course' | 'participants' | 'grades' | 'activities' | 'competencies'
    const [activeVideo, setActiveVideo] = useState(null);
    
    // UI State for forms
    const [activeForm, setActiveForm] = useState({ type: null, weekId: null }); // type: 'material' | 'lecture'
    const [confirmDelete, setConfirmDelete] = useState(null); // {type, id, title}
    
    // Form data
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });
    
    const [materialForm, setMaterialForm] = useState({ title: '', description: '', file: null, fileType: 'document', url: '' });
    const [lectureForm, setLectureForm] = useState({ title: '', date: '', startTime: '', endTime: '' });

    // Course Edit State
    const [isEditingCourse, setIsEditingCourse] = useState(false);
    const [courseForm, setCourseForm] = useState({ name: '', maxMarks: 100 });

    const loadData = async () => {
        try {
            const contentData = await apiGet(`/instructor/courses/${id}/content`);
            setCourseData(contentData);
            setCourseForm({
                name: contentData.course.Name || contentData.course.CourseName,
                maxMarks: contentData.course.Max_Marks || 100
            });
            
            // Expand all weeks by default if first load
            if (Object.keys(expandedWeeks).length === 0 && contentData.weeks) {
                const initialExpanded = {};
                contentData.weeks.forEach(w => { initialExpanded[w.WeekID] = true });
                setExpandedWeeks(initialExpanded);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            await apiPut(`/instructor/courses/${id}`, {
                name: courseForm.name,
                maxMarks: parseInt(courseForm.maxMarks)
            });
            setMsg({ text: 'Course metadata updated.', type: 'success' });
            setIsEditingCourse(false);
            loadData();
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        } catch (err) {
            setMsg({ text: err.response?.data?.message || err.message, type: 'error' });
        } finally {
            setUploading(false);
        }
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

            await instructorAPI.addMaterial(formData);
            
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

    const handleAddWeek = async () => {
        try {
            const weekNumber = (courseData.weeks || []).length + 1;
            await instructorAPI.addWeek({
                courseId: id,
                weekNumber,
                title: `Week ${weekNumber}: New Module`
            });
            setMsg({ text: 'New study sector established.', type: 'success' });
            loadData();
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        } catch (err) {
            setMsg({ text: err.response?.data?.message || err.message, type: 'error' });
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
            await apiPost('/instructor/lectures', payload);
            
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
        try {
            await apiDelete(`/instructor/materials/${mId}`);
            setMsg({ text: 'Resource removed.', type: 'success' });
            loadData();
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        } catch (err) {
            setMsg({ text: err.response?.data?.message || err.message, type: 'error' });
        }
        setConfirmDelete(null);
    };

    const handleDeleteLecture = async (lId) => {
        try {
            await apiDelete(`/instructor/lectures/${lId}`);
            setMsg({ text: 'Lecture removed.', type: 'success' });
            loadData();
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        } catch (err) {
            setMsg({ text: err.response?.data?.message || err.message, type: 'error' });
        }
        setConfirmDelete(null);
    };

    const handleDeleteWeek = async (wId) => {
        try {
            await apiDelete(`/instructor/weeks/${wId}`);
            setMsg({ text: 'Week decommissioned.', type: 'success' });
            loadData();
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        } catch (err) {
            setMsg({ text: err.response?.data?.message || err.message, type: 'error' });
        }
        setConfirmDelete(null);
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
                <p className="text-slate-500 font-medium">Course not found.</p>
            </div>
        );
    }

    const { course, weeks, lectures, assignments } = courseData;

    const toggleAllWeeks = () => {
        const anyCollapsed = (weeks || []).some(w => !expandedWeeks[w.WeekID]);
        if (anyCollapsed) {
            const allExpandedObj = {};
            (weeks || []).forEach(w => { allExpandedObj[w.WeekID] = true });
            setExpandedWeeks(allExpandedObj);
        } else {
            setExpandedWeeks({});
        }
    };

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
                                        onClick={handleAddWeek}
                                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                        <Plus size={12} /> Add Week
                                    </button>
                                    <button 
                                        onClick={toggleAllWeeks}
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
                        {weeks.map((week) => {
                            const isExpanded = expandedWeeks[week.WeekID];
                            let dateString = `Week ${week.WeekNumber}`;
                            if (week.StartDate && week.EndDate) {
                                const start = new Date(week.StartDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
                                const end = new Date(week.EndDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
                                dateString = `${start} - ${end}`;
                            } else if (week.Title) {
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
                                                className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-2 transition-all border border-emerald-200/50 dark:border-emerald-500/20"
                                            >
                                                <Plus size={14} /> PDF / Video
                                            </button>
                                            <button 
                                                onClick={() => setActiveForm({ type: 'lecture', weekId: week.WeekID })}
                                                className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 px-4 py-2 rounded-xl flex items-center gap-2 transition-all border border-orange-200/50 dark:border-orange-500/20"
                                            >
                                                <Plus size={14} /> Lecture
                                            </button>
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setConfirmDelete({ type: 'week', id: week.WeekID, title: `Week ${week.Week_Number}` });
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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
                                                    {/* Inline Forms omitted for brevity but they should be here if needed */}
                                                    {/* Re-including forms from previous version */}
                                                    {activeForm.weekId === week.WeekID && (
                                                        <div className="mb-6 p-6 border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-white/5 shadow-inner">
                                                            <div className="flex justify-between items-center mb-6">
                                                                <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] italic">
                                                                    {activeForm.type === 'material' ? 'New Asset Deployment' : 'Session Orchestration'}
                                                                </h4>
                                                                <button onClick={() => setActiveForm({ type: null, weekId: null })} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-400 hover:text-red-500 transition-colors"><X size={14}/></button>
                                                            </div>

                                                            {activeForm.type === 'material' ? (
                                                                <form onSubmit={(e) => handleUploadMaterial(e, week.WeekID)} className="space-y-4">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        <div className="space-y-1">
                                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                                                                            <input type="text" required value={materialForm.title} onChange={e => setMaterialForm({...materialForm, title: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Enter resource title..." />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                                                                            <select value={materialForm.fileType} onChange={e => setMaterialForm({...materialForm, fileType: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                                                                <option value="document">PDF Document</option>
                                                                                <option value="video">Video Stream</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                                            {materialForm.fileType === 'video' ? 'Asset File (Optional if URL provided)' : 'Asset File'}
                                                                        </label>
                                                                        <div className="relative group/upload">
                                                                            <input 
                                                                                type="file" 
                                                                                required={materialForm.fileType !== 'video' || !materialForm.url} 
                                                                                onChange={e => setMaterialForm({...materialForm, file: e.target.files[0]})} 
                                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                                                            />
                                                                            <div className="w-full border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 group-hover/upload:border-blue-400 transition-colors">
                                                                                <Upload size={24} className="text-slate-300 dark:text-slate-600" />
                                                                                <span className="text-xs font-bold text-slate-500">{materialForm.file ? materialForm.file.name : 'Drop file here or click to browse'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {materialForm.fileType === 'video' && (
                                                                        <div className="space-y-1">
                                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Or Video URL (YouTube, Vimeo, etc.)</label>
                                                                            <input 
                                                                                type="url" 
                                                                                value={materialForm.url} 
                                                                                onChange={e => setMaterialForm({...materialForm, url: e.target.value})} 
                                                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                                                                                placeholder="https://www.youtube.com/watch?v=..." 
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    <div className="flex justify-end pt-2">
                                                                        <button type="submit" disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20">
                                                                            {uploading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                                            Execute Deployment
                                                                        </button>
                                                                    </div>
                                                                </form>
                                                            ) : (
                                                                <form onSubmit={(e) => handleAddLecture(e, week.WeekID)} className="space-y-4">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Title</label>
                                                                        <input type="text" required value={lectureForm.title} onChange={e => setLectureForm({...lectureForm, title: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. System Architecture Deep-Dive" />
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
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Materials */}
                                                    {week.materials && week.materials.map(mat => {
                                                        const isVideo = mat.Type === 'Video' || (mat.FileURL && mat.FileURL.match(/\.(mp4|webm|ogg)$/i)) || (mat.FileURL && (mat.FileURL.includes('youtube.com') || mat.FileURL.includes('youtu.be')));
                                                        const cleanTitle = mat.Title
                                                            .replace(/â€“/g, '–')
                                                            .replace(/Â€“/g, '–')
                                                            .replace(/â€™/g, "'")
                                                            .replace(/Â/g, '');

                                                        const handleMaterialClick = () => {
                                                            if (isVideo) {
                                                                setActiveVideo(mat);
                                                            } else if (mat.FileURL) {
                                                                const url = mat.FileURL.startsWith('http') ? mat.FileURL : `${API_URL}${mat.FileURL}`;
                                                                window.open(url, '_blank');
                                                            } else {
                                                                setMsg({ text: 'This resource has no valid deployment link.', type: 'error' });
                                                                setTimeout(() => setMsg({ text: '', type: '' }), 3000);
                                                            }
                                                        };

                                                        return (
                                                            <div 
                                                                key={`mat-${mat.MaterialID}`} 
                                                                onClick={handleMaterialClick}
                                                                className={`flex items-center gap-4 p-4 rounded-2xl transition-all border border-transparent group relative overflow-hidden shadow-sm cursor-pointer ${
                                                                    !mat.FileURL && !isVideo 
                                                                        ? 'bg-slate-100 dark:bg-white/5 opacity-50 cursor-not-allowed' 
                                                                        : 'bg-slate-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-blue-500/20'
                                                                }`}
                                                            >
                                                                <div className={`p-3 rounded-xl ${isVideo ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                                                    {isVideo ? <Video size={20} className="text-emerald-600 dark:text-emerald-400" /> : <FileText size={20} className="text-blue-600 dark:text-blue-400" />}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors italic">{cleanTitle}</span>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isVideo ? 'Video Resource' : 'Document Archive'}</span>
                                                                </div>
                                                                
                                                                <button 
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        setConfirmDelete({ type: 'material', id: mat.MaterialID, title: mat.Title });
                                                                    }} 
                                                                    className="ml-auto p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Lectures */}
                                                    {week.lectures && week.lectures.map(lec => (
                                                        <div key={`lec-${lec.LectureID}`} className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group hover:border-orange-500/20 transition-all">
                                                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                                                                <Calendar size={20} className="text-orange-600" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white italic">{lec.Title}</span>
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                                    {lec.Date ? new Date(lec.Date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : ''} 
                                                                    {lec.Start_Time ? ` at ${lec.Start_Time}` : ''}
                                                                </span>
                                                            </div>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteLecture(lec.LectureID); }}
                                                                className="ml-auto p-2 text-slate-300 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {(!week.materials?.length && !week.lectures?.length) && (
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic uppercase font-black tracking-widest ml-2">Terminal shows no active assets for this sector.</p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                );
            case 'participants':
                return <ParticipantsTab courseId={id} role="instructor" />;
            case 'attendance':
                return <AttendanceTab courseId={id} role="instructor" />;
            case 'grades':
                return <GradesTab courseId={id} role="instructor" />;
            case 'activities':
                return <ActivitiesTab assignments={courseData?.assignments} courseId={id} role="instructor" onRefresh={loadData} />;
            default:
                return null;
        }
    };

    const tabs = [
        { id: 'course', label: 'Course', icon: <BookOpen size={16} /> },
        { id: 'participants', label: 'Participants', icon: <Users size={16} /> },
        { id: 'grades', label: 'Grades', icon: <Award size={16} /> },
        { id: 'attendance', label: 'Attendance', icon: <Calendar size={16} /> },
        { id: 'activities', label: 'Activities', icon: <ClipboardList size={16} /> }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white pb-20 transition-colors duration-500">
            {/* Top Navigation Bar area */}
            <div className="border-b border-slate-200 dark:border-white/10 px-6 py-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate('/instructor/dashboard')}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-black uppercase tracking-widest transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Instructor Console
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded uppercase tracking-tighter">Instructor View</span>
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
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase leading-none">
                                {course.CourseName || course.Name}
                            </h1>
                            <button 
                                onClick={() => setIsEditingCourse(true)}
                                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                            >
                                <Edit2 size={16} />
                            </button>
                        </div>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] ml-1">Terminal Master Instance</p>
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
                                    url={`${API_URL}${activeVideo.FileURL}`}
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

            {/* Edit Course Modal */}
            <AnimatePresence>
                {isEditingCourse && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 dark:border-white/5 p-10"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Course Optimization</h3>
                                <button onClick={() => setIsEditingCourse(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"><X size={20}/></button>
                            </div>
                            
                            <form onSubmit={handleUpdateCourse} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Course Designation</label>
                                    <input 
                                        type="text" 
                                        value={courseForm.name}
                                        onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 dark:text-white italic"
                                        placeholder="Course Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Maximum Scale (Points)</label>
                                    <input 
                                        type="number" 
                                        value={courseForm.maxMarks}
                                        onChange={(e) => setCourseForm({ ...courseForm, maxMarks: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 dark:text-white italic"
                                        placeholder="Max Marks"
                                    />
                                </div>
                                
                                <button 
                                    type="submit"
                                    disabled={uploading}
                                    className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-95 transition-all mt-4 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {uploading ? <Loader2 className="animate-spin" size={16} /> : 'Synchronize Changes'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Custom Confirm Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 mb-6 mx-auto">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-black text-center text-slate-800 dark:text-white mb-2 uppercase italic tracking-tight">Confirm Removal</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-8">
                            Are you sure you want to decommission <span className="font-bold text-slate-700 dark:text-slate-200">"{confirmDelete.title}"</span>? This action cannot be reversed.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors uppercase text-xs tracking-widest"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    if (confirmDelete.type === 'week') handleDeleteWeek(confirmDelete.id);
                                    else if (confirmDelete.type === 'material') handleDeleteMaterial(confirmDelete.id);
                                    else if (confirmDelete.type === 'lecture') handleDeleteLecture(confirmDelete.id);
                                }}
                                className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors uppercase text-xs tracking-widest shadow-lg shadow-red-500/30"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructorCourseDetails;
