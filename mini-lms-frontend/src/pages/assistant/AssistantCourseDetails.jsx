import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, FileText, Video, ClipboardList,
    ChevronRight, Layers, Monitor, Calendar,
    Users, Inbox, Loader2, Upload, X, CheckCircle2, AlertCircle
} from 'lucide-react';
import { apiGet, apiPost } from '../../services/api';
import EmptyState from '../../components/EmptyState';

const AssistantCourseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [courseData, setCourseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState({ title: '', description: '', file: null, fileType: 'document' });
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [materials, setMaterials] = useState([]);

    const loadData = async () => {
        try {
            const [details, materialsData] = await Promise.all([
                apiGet(`/assistant/courses/${id}/details`),
                apiGet(`/assistant/courses/${id}/materials`)
            ]);
            setCourseData(details);
            setMaterials(materialsData);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const handleUploadMaterial = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('courseId', id);
            formData.append('title', uploadForm.title);
            formData.append('description', uploadForm.description);
            formData.append('fileType', uploadForm.fileType);
            if (uploadForm.file) formData.append('file', uploadForm.file);

            await apiPost('/assistant/courses/materials', formData);
            
            setMsg({ text: 'Resource deployed successfully!', type: 'success' });
            setUploadForm({ title: '', description: '', file: null, fileType: 'document' });
            loadData();
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        } catch (err) {
            setMsg({ text: err.message, type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteMaterial = async (mId) => {
        if (!window.confirm("Are you sure you want to decommission this resource?")) return;
        try {
            await apiPost(`/assistant/courses/materials/${mId}/delete`, {});
            setMsg({ text: 'Resource removed.', type: 'success' });
            loadData();
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        } catch (err) {
            setMsg({ text: err.message, type: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Loader2 size={40} className="text-[#a78bfa]" />
                </motion.div>
            </div>
        );
    }

    if (!courseData || !courseData.course) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <EmptyState icon={Inbox} title="Course Terminal Offline" description="This course data is currently inaccessible or decommissioned." />
            </div>
        );
    }

    const { course, weeks, lectures, assignments, enrolledCount } = courseData;

    return (
        <div className="min-h-screen pt-10 px-6 pb-20 selection:bg-[#a78bfa]/30">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* 🌌 Navigation & Header Area */}
                <div className="relative">
                    <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
                    
                    <div className="relative space-y-8">
                        <button
                            onClick={() => navigate('/assistant/courses')}
                            className="flex items-center gap-2 text-slate-500 hover:text-purple-600 dark:hover:text-[#a78bfa] transition-all group w-fit bg-white/50 dark:bg-white/5 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-purple-500/30 backdrop-blur-md"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Course Fleet</span>
                        </button>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="px-4 py-1.5 bg-purple-600 text-white text-[10px] font-black rounded-xl tracking-widest uppercase shadow-lg shadow-purple-500/20">
                                        ID {course.CourseID}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-70 italic">Assistant Access</span>
                                    </div>
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.8] italic">
                                    {course.CourseName}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                    <span className="opacity-80 px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-full text-[9px] border border-slate-200 dark:border-white/10 uppercase font-black">Lead Instructor</span>
                                    <span className="text-slate-900 dark:text-white">{course.InstructorName}</span>
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* 📚 Course Architecture */}
                    <div className="lg:col-span-2 space-y-12">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                                <span className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500"><Layers size={20} /></span>
                                Course Matrix
                            </h2>
                        </div>

                        {weeks.length === 0 ? (
                            <EmptyState icon={Inbox} title="No Study Cycles Found" description="The syllabus structure is currently empty." />
                        ) : (
                            <div className="space-y-6">
                                {weeks.map((week) => (
                                    <motion.div key={week.Week_ID} whileHover={{ x: 5 }} className="glass-card p-8 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/40 relative group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-purple-500 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">Week {String(week.Week_Number).padStart(2, '0')}</span>
                                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mt-2">{week.Title}</h3>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {week.materials && week.materials.map(m => (
                                                <div key={m.Material_ID} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 group/item">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center"><FileText size={16} /></div>
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{m.Title}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 💎 Asset Manager (CourseMaterials) */}
                    <div className="space-y-10">
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                                <span className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><Upload size={20} /></span>
                                Asset Manager
                            </h2>

                            {/* Upload Form */}
                            <div className="glass-card p-8 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/50 via-indigo-500/50 to-purple-500/50" />
                                
                                {msg.text && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mb-6 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                        {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {msg.text}
                                    </motion.div>
                                )}

                                <form onSubmit={handleUploadMaterial} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Asset Label</label>
                                        <input type="text" placeholder="e.g. Solution Key PDF" required value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} 
                                            className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-purple-500 transition-all text-xs font-bold text-slate-800 dark:text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Description</label>
                                        <textarea placeholder="Brief description of the asset..." value={uploadForm.description} onChange={e => setUploadForm({...uploadForm, description: e.target.value})}
                                            className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-purple-500 transition-all text-xs font-bold text-slate-800 dark:text-white min-h-[80px]" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Category</label>
                                            <select value={uploadForm.fileType} onChange={e => setUploadForm({...uploadForm, fileType: e.target.value})}
                                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-purple-500 transition-all text-xs font-bold text-slate-800 dark:text-white appearance-none cursor-pointer">
                                                <option value="document">PDF / Doc</option>
                                                <option value="video">Video Lecture</option>
                                                <option value="image">Graphic / Image</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Payload</label>
                                            <div className="relative">
                                                <input type="file" onChange={e => setUploadForm({...uploadForm, file: e.target.files[0]})} required
                                                    className="w-full opacity-0 absolute inset-0 cursor-pointer z-10" />
                                                <div className="w-full bg-slate-100 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 p-4 rounded-2xl text-[10px] font-black text-slate-400 text-center uppercase tracking-widest overflow-hidden truncate">
                                                    {uploadForm.file ? uploadForm.file.name : 'Select File'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={uploading} className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-black rounded-2xl shadow-lg transition-all text-[11px] tracking-[0.3em] uppercase active:scale-95 flex items-center justify-center gap-3">
                                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                        {uploading ? 'Processing...' : 'Deploy Asset'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Materials List */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest italic opacity-60">Deployed Assets</h3>
                            <div className="space-y-4">
                                {materials.length === 0 ? (
                                    <p className="p-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] glass-card border-dashed">Empty Repository</p>
                                ) : materials.map(m => (
                                    <div key={m.MaterialID} className="glass-card p-5 border border-slate-100 dark:border-white/5 bg-white/40 dark:bg-white/5 group relative overflow-hidden transition-all hover:border-purple-500/30">
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                                                    m.FileType === 'video' ? 'bg-amber-500/10 text-amber-500' : 
                                                    m.FileType === 'image' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-purple-500/10 text-purple-500'
                                                }`}>
                                                    {m.FileType === 'video' ? <Video size={18} /> : <FileText size={18} />}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{m.Title}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                                        {m.UploaderName} • {new Date(m.CreatedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${m.FileUrl}`} target="_blank" rel="noreferrer"
                                                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all">
                                                    <ChevronRight size={16} />
                                                </a>
                                                <button onClick={() => handleDeleteMaterial(m.MaterialID)}
                                                    className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Trace */}
                <div className="pt-20 text-center opacity-40">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.6em]">
                        Command Interface Trace • Session ID {new Date().getTime().toString(16)} • Assistant Terminal
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AssistantCourseDetails;
