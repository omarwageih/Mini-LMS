import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ClipboardList, Plus, Edit2, Trash2, X, Loader2, 
    Clock, AlertCircle, ChevronRight, Search, Filter, Zap 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { instructorAPI, assistantAPI, studentAPI } from '../../services/api';

/**
 * Unified ActivitiesTab component for Student, Instructor, and Assistant portals.
 * Supports task management for staff and task viewing for students.
 */
const ActivitiesTab = ({ 
    assignments: initialAssignments = [], 
    courseId, 
    role = 'student',
    onRefresh 
}) => {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState(initialAssignments);
    const [quizzes, setQuizzes] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        maxScore: 100,
        deadline: ''
    });

    // Load initial data and quizzes
    useEffect(() => {
        setAssignments(initialAssignments);
        const loadQuizzes = async () => {
            if (!courseId) return;
            try {
                const api = role === 'student' ? studentAPI : (role === 'instructor' ? instructorAPI : assistantAPI);
                const { data } = await api.getCourseQuizzes(courseId);
                setQuizzes(data || []);
            } catch (err) {
                console.error("Load Quizzes Error:", err);
            }
        };
        loadQuizzes();
    }, [initialAssignments, courseId, role]);

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const api = role === 'instructor' ? instructorAPI : assistantAPI;
            if (editingAssignment) {
                await api.updateAssignment(editingAssignment.AssignmentID, formData);
            } else {
                await api.createAssignment({ ...formData, courseId });
            }
            
            if (onRefresh) onRefresh();
            setShowAddModal(false);
            setEditingAssignment(null);
            setFormData({ title: '', maxScore: 100, deadline: '' });
        } catch (err) {
            console.error("Assignment Operation Error:", err);
            alert("Protocol Failure: Failed to deploy assignment data.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to decommission this task? This action is irreversible.")) return;
        try {
            const api = role === 'instructor' ? instructorAPI : assistantAPI;
            await api.deleteAssignment(id);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error("Delete Assignment Error:", err);
        }
    };

    const openEdit = (a) => {
        setEditingAssignment(a);
        setFormData({
            title: a.Title,
            maxScore: a.Max_Score || a.MaxScore || 100,
            deadline: a.Deadline ? new Date(a.Deadline).toISOString().slice(0, 16) : ''
        });
        setShowAddModal(true);
    };

    // Merge and filter
    const allActivities = [
        ...(assignments || []).map(a => ({ ...a, type: 'assignment' })),
        ...(quizzes || []).map(q => ({ ...q, type: 'quiz', AssignmentID: `q-${q.QuizID}`, Title: q.Title, Deadline: q.Deadline, MaxScore: q.Max_Score }))
    ].filter(a => 
        (a.Title || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.Deadline || 0) - new Date(a.Deadline || 0));

    const isStaff = role === 'instructor' || role === 'assistant';

    if (allActivities.length === 0) {
        return (
            <div className="p-20 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3rem] bg-white/50 dark:bg-slate-900/20 backdrop-blur-sm mt-6">
                <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 border border-slate-100 dark:border-white/10">
                    <ClipboardList size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic">Zero Tasks Active</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-2 italic">Ready for new deployment protocols</p>
                {isStaff && (
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="mt-8 px-8 py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-500/20 italic flex items-center gap-2 mx-auto"
                    >
                        <Plus size={16} /> Initialize Deployment
                    </button>
                )}
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Operations Hub</h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest italic">{isStaff ? 'Deployment and Task Management' : 'Active Assignments and Evaluations'}</p>
                </div>
                {isStaff && (
                    <button 
                        onClick={() => { setEditingAssignment(null); setFormData({title:'', maxScore:100, deadline:''}); setShowAddModal(true); }}
                        className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-blue-500/20 italic flex items-center gap-2"
                    >
                        <Plus size={14} /> New Deployment
                    </button>
                )}
            </div>

            {/* Filter Bar for Staff */}
            {isStaff && (
                <div className="flex items-center gap-4 bg-white dark:bg-slate-900/40 p-2 rounded-[1.8rem] border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search active tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-transparent border-none rounded-2xl text-sm focus:ring-0 outline-none text-slate-800 dark:text-white italic font-bold"
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {allActivities.map((a) => {
                    const isOverdue = a.Deadline && new Date(a.Deadline) < new Date();
                    return (
                        <motion.div
                            key={a.AssignmentID}
                            whileHover={{ y: -2 }}
                            onClick={() => {
                                if (!isStaff) {
                                    navigate(role === 'assistant' ? '/assistant/assignments' : '/assignments');
                                }
                            }}
                            className={`p-6 rounded-[2.5rem] bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group ${!isStaff ? 'cursor-pointer' : ''}`}
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center border transition-all duration-300 group-hover:scale-110 ${
                                    a.type === 'quiz' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                    (isOverdue ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20')
                                }`}>
                                    {a.type === 'quiz' ? <Zap size={28} /> : <ClipboardList size={28} />}
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight italic group-hover:text-blue-600 transition-colors">{a.Title}</h3>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-2">
                                            <Clock size={12} className="text-slate-400" />
                                            <span className={`text-[10px] font-black uppercase italic ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
                                                {a.Deadline ? new Date(a.Deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Open'}
                                            </span>
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/10"></div>
                                        <div className="flex items-center gap-2">
                                            <AlertCircle size={12} className="text-slate-400" />
                                            <span className="text-[10px] text-blue-500 font-black uppercase italic">{a.Max_Score || a.MaxScore || 100} PTS</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-8">
                                {isStaff ? (
                                    <>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right px-6 border-r border-slate-100 dark:border-white/5">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Submissions</p>
                                                <p className="text-sm font-black text-slate-800 dark:text-white italic mt-1">{a.SubmissionCount || 0}</p>
                                            </div>
                                            <div className="text-right pr-6">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Graded</p>
                                                <p className="text-sm font-black text-emerald-500 italic mt-1">{a.GradedCount || 0}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {a.type === 'assignment' && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/instructor/submissions?assignmentId=${a.AssignmentID}`); }}
                                                    className="px-4 py-2 bg-blue-600/10 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all italic border border-blue-600/20"
                                                >
                                                    Verify
                                                </button>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); openEdit(a); }} className="p-3 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-blue-500 rounded-2xl transition-all border border-transparent hover:border-blue-500/20">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(a.AssignmentID); }} className="p-3 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 rounded-2xl transition-all border border-transparent hover:border-red-500/20">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl italic ${isOverdue ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                            {isOverdue ? 'Overdue' : 'Active'}
                                        </span>
                                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all shadow-sm">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Management Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-[3.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 dark:border-white/5"
                        >
                            <div className="p-12 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{editingAssignment ? 'Task Modification' : 'Task Deployment'}</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3 italic">Terminal Authorization Required</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-4 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 rounded-full transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateOrUpdate} className="p-12 space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 italic">Assignment Designation</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={formData.title}
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                        className="w-full bg-slate-100 dark:bg-white/5 border border-transparent focus:border-blue-500/50 rounded-2xl p-5 text-sm font-bold outline-none transition-all dark:text-white placeholder:text-slate-400 italic"
                                        placeholder="e.g. SYSTEMS ANALYSIS 01"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 italic">Points</label>
                                        <input 
                                            required
                                            type="number" 
                                            value={formData.maxScore}
                                            onChange={e => setFormData({...formData, maxScore: e.target.value})}
                                            className="w-full bg-slate-100 dark:bg-white/5 border border-transparent focus:border-blue-500/50 rounded-2xl p-5 text-sm font-bold outline-none transition-all dark:text-white italic"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 italic">Deadline Index</label>
                                        <input 
                                            required
                                            type="datetime-local" 
                                            value={formData.deadline}
                                            onChange={e => setFormData({...formData, deadline: e.target.value})}
                                            className="w-full bg-slate-100 dark:bg-white/5 border border-transparent focus:border-blue-500/50 rounded-2xl p-5 text-sm font-bold outline-none transition-all dark:text-white italic cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="pt-8 flex gap-6">
                                    <button 
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all italic"
                                    >
                                        Abort
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-3 transition-all italic"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : (editingAssignment ? <Edit2 size={16} /> : <Plus size={16} />)}
                                        {editingAssignment ? 'Update Matrix' : 'Initialize'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ActivitiesTab;
