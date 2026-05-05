import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, FileText, Video, ClipboardList,
    ChevronRight, Layers, Monitor, Calendar,
    Users, Inbox, Loader2, Upload, X, CheckCircle2, AlertCircle, Award, Target, BookOpen
} from 'lucide-react';
import { apiGet, apiPost, assistantAPI } from '../../services/api';
import EmptyState from '../../components/EmptyState';

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
    const [uploading, setUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState({ title: '', description: '', file: null, fileType: 'document' });
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [materials, setMaterials] = useState([]);
    const [activeTab, setActiveTab] = useState('course'); // 'course' | 'participants' | 'grades' | 'activities' | 'competencies'

    const loadData = async () => {
        try {
            const [details, materialsData] = await Promise.all([
                assistantAPI.getCourseDetails(id),
                assistantAPI.getCourseMaterials(id)
            ]);
            setCourseData(details.data || details); // Handle both wrapped and unwrapped data
            setMaterials(materialsData.data || materialsData);
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

            await assistantAPI.uploadCourseMaterial(formData);
            
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
            await assistantAPI.deleteCourseMaterial(mId);
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
                    <Loader2 size={40} className="text-blue-500" />
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

    const { course, weeks, assignments } = courseData;

    const tabs = [
        { id: 'matrix', label: 'Matrix', icon: <Target size={16} /> },
        { id: 'participants', label: 'Roster', icon: <Users size={16} /> },
        { id: 'attendance', label: 'Attendance', icon: <Calendar size={16} /> },
        { id: 'grades', label: 'Index', icon: <Award size={16} /> },
        { id: 'activities', label: 'Tasks', icon: <ClipboardList size={16} /> },
        { id: 'competencies', label: 'Targets', icon: <Target size={16} /> }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'matrix':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-6">
                        {/* 📚 Course Architecture */}
                        <div className="lg:col-span-2 space-y-12">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500"><Layers size={20} /></span>
                                    Course Matrix
                                </h2>
                            </div>

                            {weeks.length === 0 ? (
                                <EmptyState icon={Inbox} title="No Study Cycles Found" description="The syllabus structure is currently empty." />
                            ) : (
                                <div className="space-y-6">
                                    {weeks.map((week) => (
                                        <motion.div key={week.Week_ID} whileHover={{ x: 5 }} className="glass-card p-8 border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/40 relative group overflow-hidden rounded-[2rem]">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors duration-500"></div>
                                            <div className="flex justify-between items-start mb-6 relative z-10">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 italic">Week {String(week.Week_Number).padStart(2, '0')}</span>
                                                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mt-2">{week.Title}</h3>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                                {week.materials && week.materials.map(m => (
                                                    <div key={m.Material_ID} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 group/item hover:border-blue-500/30 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><FileText size={16} /></div>
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{m.Title}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!week.materials || week.materials.length === 0) && (
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic opacity-60">No local resources deployed</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 💎 Asset Manager */}
                        <div className="space-y-10">
                            <div className="space-y-6">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><Upload size={20} /></span>
                                    Asset Manager
                                </h2>

                                <div className="glass-card p-8 border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/60 shadow-xl relative overflow-hidden rounded-[2.5rem]">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 via-indigo-500/50 to-blue-500/50" />
                                    
                                    {msg.text && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mb-6 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                            {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {msg.text}
                                        </motion.div>
                                    )}

                                    <form onSubmit={handleUploadMaterial} className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 italic">Asset Designation</label>
                                            <input type="text" placeholder="e.g. TECHNICAL SCHEMATIC" required value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} 
                                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-xs font-bold text-slate-800 dark:text-white italic" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 italic">Intelligence Data</label>
                                            <textarea placeholder="Metadata for this resource..." value={uploadForm.description} onChange={e => setUploadForm({...uploadForm, description: e.target.value})}
                                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-xs font-bold text-slate-800 dark:text-white min-h-[80px] italic" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 italic">Class</label>
                                                <select value={uploadForm.fileType} onChange={e => setUploadForm({...uploadForm, fileType: e.target.value})}
                                                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-xs font-bold text-slate-800 dark:text-white appearance-none cursor-pointer italic">
                                                    <option value="document">PDF MODULE</option>
                                                    <option value="video">VIDEO FEED</option>
                                                    <option value="image">VISUAL ASSET</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 italic">Payload</label>
                                                <div className="relative">
                                                    <input type="file" onChange={e => setUploadForm({...uploadForm, file: e.target.files[0]})} required
                                                        className="w-full opacity-0 absolute inset-0 cursor-pointer z-10" />
                                                    <div className="w-full bg-slate-100 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 p-4 rounded-2xl text-[10px] font-black text-slate-400 text-center uppercase tracking-widest overflow-hidden truncate italic">
                                                        {uploadForm.file ? uploadForm.file.name : 'SELECT PACKET'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button type="submit" disabled={uploading} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all text-[11px] tracking-[0.3em] uppercase active:scale-95 flex items-center justify-center gap-3 italic">
                                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                            {uploading ? 'UPLOADING...' : 'DEPLOY ASSET'}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Materials List */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-[0.3em] italic opacity-40 ml-4">Registry Records</h3>
                                <div className="space-y-4">
                                    {materials.length === 0 ? (
                                        <div className="p-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] glass-card border-dashed border-slate-200 dark:border-white/10 rounded-[2rem]">Empty Storage Node</div>
                                    ) : materials.map(m => (
                                        <div key={m.MaterialID} className="glass-card p-6 border border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 group relative overflow-hidden transition-all hover:border-blue-500/30 rounded-3xl shadow-sm">
                                            <div className="flex items-center justify-between relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center shadow-lg ${
                                                        m.FileType === 'video' ? 'bg-amber-500/10 text-amber-500' : 
                                                        m.FileType === 'image' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-blue-500/10 text-blue-500'
                                                    }`}>
                                                        {m.FileType === 'video' ? <Video size={20} /> : <FileText size={20} />}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight italic">{m.Title}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 italic">
                                                            {m.UploaderName} • {new Date(m.CreatedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <a href={`${API_URL}${m.FileUrl}`} target="_blank" rel="noreferrer"
                                                        className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm">
                                                        <ChevronRight size={18} />
                                                    </a>
                                                    <button onClick={() => handleDeleteMaterial(m.MaterialID)}
                                                        className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'participants':
                return <ParticipantsTab courseId={id} role="assistant" />;
            case 'attendance':
                return <AttendanceTab courseId={id} role="assistant" />;
            case 'grades':
                return <GradesTab courseId={id} role="assistant" />;
            case 'activities':
                return <ActivitiesTab assignments={assignments} courseId={id} role="assistant" onRefresh={loadData} />;
            case 'competencies':
                return (
                    <div className="pt-20 flex flex-col items-center justify-center text-center space-y-4">
                        <Target size={60} className="text-slate-200 dark:text-slate-800" />
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Strategic Benchmarks</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-2 italic">Target metrics currently being calibrated for this course Matrix.</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen pt-10 px-6 pb-20 selection:bg-blue-500/30">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* 🌌 Navigation & Header Area */}
                <div className="relative">
                    <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
                    
                    <div className="relative space-y-12">
                        <button
                            onClick={() => navigate('/assistant/courses')}
                            className="flex items-center gap-3 text-slate-500 hover:text-blue-600 transition-all group w-fit bg-white dark:bg-white/5 px-6 py-3 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-blue-500/30 backdrop-blur-xl shadow-sm"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Command Fleet Hub</span>
                        </button>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <span className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black rounded-2xl tracking-[0.2em] uppercase shadow-xl italic">
                                        MATRIX {course.CourseID}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50" />
                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-80 italic">Authorized Assistant Terminal</span>
                                    </div>
                                </div>
                                <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.8] italic drop-shadow-2xl">
                                    {course.CourseName}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-4 italic">
                                    <span className="px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-[9px] uppercase font-black">Designated Commander</span>
                                    <span className="text-slate-900 dark:text-white underline decoration-blue-500/30 underline-offset-4">{course.InstructorName}</span>
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* 🛡️ Modern Tabbed Navigation */}
                <div className="flex items-center gap-1.5 p-1.5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[1.8rem] w-fit shadow-sm overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2.5 px-7 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-[1.4rem] transition-all italic ${
                                activeTab === tab.id 
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 scale-[1.02]' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-white/5'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 🌀 Main Content Area */}
                <div className="min-h-[500px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderTabContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* 🏁 Footer Trace */}
                <div className="pt-24 text-center opacity-30">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.8em] italic">
                        Terminal Sync Stable • Protocol v3.1.2 • Assistant Authorization Confirmed
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AssistantCourseDetails;
