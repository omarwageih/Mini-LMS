import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, FileText, User, Award, Download, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { apiGet, apiPost } from '../../services/api';

const InstructorSubmissions = () => {
    const [searchParams] = useSearchParams();
    const assignmentIdFilter = searchParams.get('assignmentId');
    const [submissions, setSubmissions] = useState([]);
    const [gradeForm, setGradeForm] = useState({ submissionId: '', score: '', feedback: '' });
    const [msg, setMsg] = useState({ text: '', type: '' });

    useEffect(() => { loadSubmissions(); }, [assignmentIdFilter]);

    const loadSubmissions = async () => {
        try {
            let data = await apiGet('/instructor/submissions');
            if (assignmentIdFilter) {
                data = data.filter(s => s.AssignmentID.toString() === assignmentIdFilter);
            }
            setSubmissions(data);
        } catch (err) { console.error(err); }
    };

    const handleGrade = async (e) => {
        e.preventDefault();
        try {
            await apiPost('/instructor/submissions/grade', {
                submissionId: parseInt(gradeForm.submissionId),
                score: parseFloat(gradeForm.score),
                feedback: gradeForm.feedback
            });
            setMsg({ text: 'Evaluation recorded successfully!', type: 'success' });
            setGradeForm({ submissionId: '', score: '', feedback: '' });
            loadSubmissions();
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        } catch (err) { setMsg({ text: err.message, type: 'error' }); }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen pb-20 pt-10 px-4 sm:px-10">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* 🌌 Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[#a78bfa] font-black text-[10px] mb-2 tracking-[0.4em] uppercase">
                            <ClipboardList size={14} className="animate-pulse" />
                            Academic Registry
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic">
                            Submission <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-[#818cf8]">Overview</span>
                        </h1>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] ml-1 opacity-70">
                            Deliverables • Grading • Evaluation Performance
                        </p>
                    </div>
                </div>

                {/* Evaluation Portal */}
                <div className="glass-card p-8 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-950/60 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity rotate-12"><Shield size={120} className="text-purple-500" /></div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3 italic">
                        <span className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner"><Award size={20} /></span>
                        Evaluation Terminal
                    </h3>
                    
                    {msg.text && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`mb-8 p-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                            {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} {msg.text}
                        </motion.div>
                    )}

                    <form onSubmit={handleGrade} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Target Submission</label>
                            <select value={gradeForm.submissionId} onChange={e => setGradeForm({...gradeForm, submissionId: e.target.value})} required
                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-3xl outline-none focus:border-purple-500 transition-all text-sm font-bold text-slate-800 dark:text-white appearance-none cursor-pointer">
                                <option value="">Select Candidate</option>
                                {submissions.map(s => (
                                    <option key={s.SubmissionID} value={s.SubmissionID}>#{s.SubmissionID} — {s.StudentName} ({s.AssignmentTitle}) {s.Score !== null ? `[Current: ${s.Score}]` : '[Pending]'}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Evaluation Score</label>
                            <input type="number" step="0.1" min="0" max="100" placeholder="0.00" required value={gradeForm.score} onChange={e => setGradeForm({...gradeForm, score: e.target.value})}
                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-3xl outline-none focus:border-purple-500 transition-all text-sm font-bold text-slate-800 dark:text-white" />
                        </div>
                        <button type="submit" className="w-full py-5 bg-gradient-to-r from-purple-600 to-[#818cf8] text-white font-black rounded-3xl shadow-xl hover:shadow-purple-500/30 transition-all text-[11px] tracking-[0.3em] uppercase active:scale-95">
                            Post Evaluation
                        </button>
                        <div className="md:col-span-4 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Academic Feedback (Optional)</label>
                            <textarea placeholder="Provide detailed feedback for the candidate..." value={gradeForm.feedback} onChange={e => setGradeForm({...gradeForm, feedback: e.target.value})}
                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-3xl outline-none focus:border-purple-500 transition-all text-sm font-bold text-slate-800 dark:text-white min-h-[100px]" />
                        </div>
                    </form>
                </div>

                {/* Submissions Table Overlay */}
                <div className="glass-card overflow-hidden border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-950/60 shadow-2xl relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/5">
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Student Asset</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Objective</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Cluster</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Vault</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Status/Score</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Evaluator</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {submissions.length === 0 ? (
                                    <tr><td colSpan={6} className="p-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic opacity-50">No academic deliverables detected</td></tr>
                                ) : submissions.map(s => (
                                    <tr key={s.SubmissionID} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300">
                                        <td className="p-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-500 flex items-center justify-center border border-blue-500/10 group-hover:scale-110 transition-transform shadow-inner">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">{s.StudentName}</p>
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Verified Member</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-600 dark:text-slate-300 tracking-tight">{s.AssignmentTitle}</span>
                                                <span className="text-[9px] text-purple-500/70 font-black uppercase tracking-[0.2em] mt-1">Assignment Task</span>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200 dark:border-white/5">
                                                {s.CourseName}
                                            </span>
                                        </td>
                                        <td className="p-8">
                                            {s.FilePath ? (
                                                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${s.FilePath}`} target="_blank" rel="noreferrer"
                                                    className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-widest hover:text-cyan-400 transition-colors group/link p-2 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                                    <Download size={14} className="group-hover/link:-translate-y-0.5 transition-transform" /> Access Data
                                                </a>
                                            ) : <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-30">— Empty —</span>}
                                        </td>
                                        <td className="p-8">
                                            {s.Score !== null ? (
                                                <div className="flex flex-col">
                                                    <span className="text-2xl font-black text-emerald-500 tracking-tighter leading-none">{s.Score}</span>
                                                    <span className="text-[8px] text-emerald-600/50 font-black uppercase tracking-widest mt-1">Merit Points</span>
                                                </div>
                                            ) : (
                                                <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-500/20 shadow-inner">Evaluation Pending</span>
                                            )}
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest italic opacity-70">
                                                <Shield size={12} className="text-slate-400" />
                                                {s.CorrectedByName || 'Awaiting Review'}
                                            </div>
                                        </td>
                                        <td className="p-8 text-right">
                                            <button 
                                                onClick={() => setGradeForm({ submissionId: s.SubmissionID.toString(), score: s.Score?.toString() || '', feedback: s.Feedback || '' })}
                                                className="px-6 py-3 bg-slate-100 dark:bg-white/5 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border border-slate-200 dark:border-white/10 opacity-0 group-hover:opacity-100 whitespace-nowrap"
                                            >
                                                {s.Score !== null ? 'Modify Evaluation' : 'Evaluate Now'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Quote */}
                <div className="pt-20 text-center opacity-40">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.6em]">
                        Standardized Evaluation • Academic Integrity • Mini LMS
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default InstructorSubmissions;
