import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, FileText, Video, ClipboardList, MessageSquare,
    ChevronDown, ChevronRight, Play, X, Calendar, Plus, Upload, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const InstructorCourseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [courseData, setCourseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedWeeks, setExpandedWeeks] = useState({});
    
    // UI State for forms
    const [activeForm, setActiveForm] = useState({ type: null, weekId: null }); // type: 'material' | 'lecture'
    
    // Form data
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });
    
    const [materialForm, setMaterialForm] = useState({ title: '', description: '', file: null, fileType: 'document' });
    const [lectureForm, setLectureForm] = useState({ title: '', date: '', startTime: '', endTime: '' });

    const loadData = async () => {
        try {
            const contentData = await apiGet(`/instructor/courses/${id}/content`);
            setCourseData(contentData);
            
            // Expand all weeks by default
            const initialExpanded = {};
            if (contentData.weeks) {
                contentData.weeks.forEach(w => { initialExpanded[w.WeekID] = true });
            }
            setExpandedWeeks(initialExpanded);
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

            await apiPost('/instructor/courses/materials', formData);
            
            setMsg({ text: 'Resource deployed successfully!', type: 'success' });
            setMaterialForm({ title: '', description: '', file: null, fileType: 'document' });
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
            await apiPost('/instructor/courses/lectures', payload);
            
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
            await apiDelete(`/instructor/courses/materials/${mId}`);
            setMsg({ text: 'Resource removed.', type: 'success' });
            loadData();
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        } catch (err) {
            setMsg({ text: err.response?.data?.message || err.message, type: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-slate-500 font-medium">Loading course workspace...</p>
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

    return (
        <div className="min-h-screen bg-white text-slate-900 pb-20">
            {/* Top Navigation Bar area */}
            <div className="border-b border-slate-200 px-6 py-4 bg-white relative z-10">
                <button
                    onClick={() => navigate('/instructor/courses')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </button>
            </div>

            {msg.text && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top-2 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} 
                    {msg.text}
                </div>
            )}

            <div className="max-w-5xl mx-auto px-6 mt-8 space-y-6">
                {/* Course Header */}
                <div>
                    <h1 className="text-3xl font-semibold text-slate-800">
                        {course.CourseName}
                    </h1>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-slate-200">
                    <button className="px-1 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">Course</button>
                    <button onClick={() => navigate('/instructor/students')} className="px-1 py-3 text-sm font-medium text-slate-500 hover:text-slate-700">Participants</button>
                    <button onClick={() => navigate('/instructor/submissions')} className="px-1 py-3 text-sm font-medium text-slate-500 hover:text-slate-700">Grades</button>
                    <button onClick={() => setMsg({text: 'Activities dashboard coming soon!', type: 'success'})} className="px-1 py-3 text-sm font-medium text-slate-500 hover:text-slate-700">Activities</button>
                    <button onClick={() => setMsg({text: 'Competencies module coming soon!', type: 'success'})} className="px-1 py-3 text-sm font-medium text-slate-500 hover:text-slate-700">Competencies</button>
                </div>

                {/* Main Content Area */}
                <div className="space-y-4 pt-4">
                    
                    {/* General Section */}
                    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                        <div className="px-5 py-4 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-lg font-medium text-slate-800">General</h2>
                            <button className="text-sm text-blue-600 hover:underline">Collapse all</button>
                        </div>
                        <div className="px-5 py-4 border-t border-slate-100 space-y-3">
                            <Link to={`/discussions/${course.CourseID}`} className="flex items-center gap-3 text-blue-600 hover:underline p-2 rounded-md hover:bg-slate-50 transition-colors">
                                <MessageSquare size={20} className="text-blue-500" />
                                <span className="font-medium text-sm">Course Announcements & Discussions</span>
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
                            dateString = week.Title;
                        }

                        return (
                            <div key={week.WeekID} className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                                <div 
                                    onClick={() => toggleWeek(week.WeekID)}
                                    className="w-full px-5 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </div>
                                        <h2 className="text-lg font-medium text-slate-800">{dateString}</h2>
                                    </div>
                                    {/* Action Buttons for Week (Only show when hovered or always on mobile? Let's show always for instructor clarity) */}
                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                        <button 
                                            onClick={() => setActiveForm({ type: 'material', weekId: week.WeekID })}
                                            className="text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                                        >
                                            <Plus size={14} /> PDF / Video
                                        </button>
                                        <button 
                                            onClick={() => setActiveForm({ type: 'lecture', weekId: week.WeekID })}
                                            className="text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                                        >
                                            <Plus size={14} /> Lecture
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
                                            <div className="px-5 py-4 border-t border-slate-200 space-y-2 pl-14">
                                                
                                                {/* Inline Forms */}
                                                {activeForm.weekId === week.WeekID && (
                                                    <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h4 className="text-sm font-semibold text-slate-800">
                                                                {activeForm.type === 'material' ? 'Add Material' : 'Schedule Lecture'}
                                                            </h4>
                                                            <button onClick={() => setActiveForm({ type: null, weekId: null })} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                                                        </div>

                                                        {activeForm.type === 'material' ? (
                                                            <form onSubmit={(e) => handleUploadMaterial(e, week.WeekID)} className="space-y-4">
                                                                <input type="text" placeholder="Title" required value={materialForm.title} onChange={e => setMaterialForm({...materialForm, title: e.target.value})} className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <select value={materialForm.fileType} onChange={e => setMaterialForm({...materialForm, fileType: e.target.value})} className="text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                                                                        <option value="document">PDF / Doc</option>
                                                                        <option value="video">Video</option>
                                                                    </select>
                                                                    <input type="file" required onChange={e => setMaterialForm({...materialForm, file: e.target.files[0]})} className="text-sm p-1.5 border border-slate-300 rounded bg-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                                                                </div>
                                                                <div className="flex justify-end">
                                                                    <button type="submit" disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded flex items-center gap-2">
                                                                        {uploading && <Loader2 size={14} className="animate-spin" />}
                                                                        Upload
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        ) : (
                                                            <form onSubmit={(e) => handleAddLecture(e, week.WeekID)} className="space-y-4">
                                                                <input type="text" placeholder="Lecture Title" required value={lectureForm.title} onChange={e => setLectureForm({...lectureForm, title: e.target.value})} className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                                                <div className="grid grid-cols-3 gap-4">
                                                                    <input type="date" required value={lectureForm.date} onChange={e => setLectureForm({...lectureForm, date: e.target.value})} className="text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                                                    <input type="time" value={lectureForm.startTime} onChange={e => setLectureForm({...lectureForm, startTime: e.target.value})} className="text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                                                    <input type="time" value={lectureForm.endTime} onChange={e => setLectureForm({...lectureForm, endTime: e.target.value})} className="text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                                                </div>
                                                                <div className="flex justify-end">
                                                                    <button type="submit" disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded flex items-center gap-2">
                                                                        {uploading && <Loader2 size={14} className="animate-spin" />}
                                                                        Schedule
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Materials */}
                                                {week.materials && week.materials.map(mat => {
                                                    const isVideo = mat.FileURL && mat.FileURL.match(/\.(mp4|webm|ogg)$/i);
                                                    return (
                                                        <div key={`mat-${mat.MaterialID}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 group">
                                                            {isVideo ? <Video size={20} className="text-emerald-500" /> : <FileText size={20} className="text-blue-500" />}
                                                            <a href={`${API_URL}${mat.FileURL}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline">{mat.Title}</a>
                                                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded ml-2">{isVideo ? 'Video' : 'PDF'}</span>
                                                            
                                                            <button onClick={() => handleDeleteMaterial(mat.MaterialID)} className="ml-auto text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}

                                                {/* Lectures */}
                                                {week.lectures && week.lectures.map(lec => (
                                                    <div key={`lec-${lec.LectureID}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 group">
                                                        <Calendar size={20} className="text-orange-500" />
                                                        <span className="text-sm font-medium text-slate-800">{lec.Title}</span>
                                                        <span className="text-xs text-slate-500 ml-auto">
                                                            {lec.Date ? new Date(lec.Date).toLocaleDateString() : ''} 
                                                            {lec.Start_Time ? ` at ${lec.Start_Time}` : ''}
                                                        </span>
                                                    </div>
                                                ))}

                                                {(!week.materials?.length && !week.lectures?.length) && (
                                                    <p className="text-sm text-slate-400 italic">No activities or resources available yet.</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}

                    {/* Unassigned Lectures */}
                    {lectures && lectures.length > 0 && (
                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm mt-8 opacity-70">
                            <div className="px-5 py-4 flex items-center bg-slate-50/50">
                                <h2 className="text-sm font-medium text-slate-600 uppercase tracking-wider">Uncategorized Lectures</h2>
                            </div>
                            <div className="px-5 py-4 border-t border-slate-100 space-y-2">
                                {lectures.map(lec => (
                                    <div key={`unlec-${lec.LectureID}`} className="flex items-center gap-3 p-2">
                                        <Calendar size={20} className="text-slate-400" />
                                        <span className="text-sm font-medium text-slate-600">{lec.Title}</span>
                                        <span className="text-xs text-slate-400 ml-auto">
                                            {lec.Date ? new Date(lec.Date).toLocaleDateString() : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InstructorCourseDetails;
