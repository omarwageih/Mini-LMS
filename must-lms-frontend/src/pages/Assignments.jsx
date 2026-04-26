import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, CheckCircle2, Upload, FileText } from 'lucide-react';
import { apiGet, apiPost } from '../api';
import { useToast } from '../context/ToastContext';
import { SkeletonRow, EmptyState } from '../components/UIHelpers';

const Assignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(null);
    const fileInputRef = useRef({});
    const { addToast } = useToast();

    useEffect(() => { loadAssignments(); }, []);

    const loadAssignments = async () => {
        try {
            const data = await apiGet('/student/assignments');
            setAssignments(data);
        } catch (err) {
            addToast('Failed to load assignments', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (assignmentID) => {
        const file = fileInputRef.current[assignmentID]?.files[0];
        if (!file) {
            addToast('Please select a file (PDF or JPG)', 'error');
            return;
        }

        setUploading(assignmentID);
        try {
            const formData = new FormData();
            formData.append('assignmentID', assignmentID);
            formData.append('file', file);
            await apiPost('/student/assignments/submit', formData);
            addToast('Assignment submitted successfully! 🎉', 'success');
            loadAssignments();
        } catch (err) {
            addToast(err.message || 'Submission failed', 'error');
        }
        setUploading(null);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="min-h-screen pb-20 pt-10 px-4 sm:px-10"
        >
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                        <ClipboardList className="text-[#a78bfa]" size={32} />
                        Assignments
                    </h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-11">Course Tasks & Submissions</p>
                </div>

                {/* Assignments List */}
                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <>
                            <div className="glass-card"><SkeletonRow /></div>
                            <div className="glass-card"><SkeletonRow /></div>
                            <div className="glass-card"><SkeletonRow /></div>
                        </>
                    ) : assignments.length === 0 ? (
                        <EmptyState
                            title="No assignments yet"
                            subtitle="Your courses haven't posted any assignments yet. Check back soon!"
                            icon={FileText}
                        />
                    ) : assignments.map((task, i) => (
                        <motion.div
                            key={task.AssignmentID}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 hover:border-[#a78bfa]/30 transition-all group shadow-sm hover:shadow-xl hover:shadow-[#a78bfa]/5"
                        >
                            <div className="flex items-start gap-5">
                                <div className={`p-4 rounded-2xl transition-colors duration-300 ${task.Status === "Submitted"
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : "bg-[#a78bfa]/10 text-[#a78bfa]"
                                    }`}>
                                    {task.Status === "Submitted" ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 group-hover:text-[#a78bfa] transition-colors">
                                        {task.Title}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        {task.CourseName} • Max: {task.Max_Score}pts
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-6 md:gap-8">
                                <div className="space-y-1">
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Deadline</p>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                        {task.Deadline ? new Date(task.Deadline).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>

                                {task.Score !== null && task.Score !== undefined && (
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Score</p>
                                        <p className="text-sm font-black text-emerald-500">{task.Score}</p>
                                    </div>
                                )}

                                {task.Status === "Submitted" ? (
                                    <span className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-white/5 text-slate-400 cursor-default">
                                        Submitted ✔
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg"
                                            ref={el => fileInputRef.current[task.AssignmentID] = el}
                                            className="hidden"
                                            id={`file-${task.AssignmentID}`}
                                        />
                                        <label htmlFor={`file-${task.AssignmentID}`}
                                            className="px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 cursor-pointer hover:border-blue-500 transition-all flex items-center gap-2">
                                            <Upload size={14} /> Choose File
                                        </label>
                                        <button
                                            onClick={() => handleSubmit(task.AssignmentID)}
                                            disabled={uploading === task.AssignmentID}
                                            className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {uploading === task.AssignmentID ? 'Uploading...' : 'Submit'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer Quote */}
                <div className="pt-10 text-center">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">
                        Stay focused • Keep building • MUST Engineering
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default Assignments;