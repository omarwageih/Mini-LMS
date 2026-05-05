import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Download, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiGet, apiPost } from '../../services/api';

const AssistantSubmissions = () => {
    const [submissions, setSubmissions] = useState([]);
    const [gradeForm, setGradeForm] = useState({ submissionID: '', score: '' });
    const [msg, setMsg] = useState({ text: '', type: '' });

    useEffect(() => { loadSubmissions(); }, []);

    const loadSubmissions = async () => {
        try { setSubmissions(await apiGet('/assistant/submissions')); } catch (err) { console.error(err); }
    };

    const handleGrade = async (e) => {
        e.preventDefault();
        try {
            await apiPost('/assistant/submissions/grade', {
                submissionID: parseInt(gradeForm.submissionID),
                score: parseFloat(gradeForm.score)
            });
            setMsg({ text: 'Graded successfully!', type: 'success' });
            setGradeForm({ submissionID: '', score: '' });
            loadSubmissions();
        } catch (err) { setMsg({ text: err.message, type: 'error' }); }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen pb-20 pt-10 px-4 sm:px-10">
            <div className="max-w-6xl mx-auto space-y-10">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                        <ClipboardList className="text-[#a78bfa]" size={32} />
                        Grade Submissions
                    </h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-11">Review & Score Student Work</p>
                </div>

                {msg.text && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {msg.text}
                    </motion.div>
                )}

                {/* Grade Form */}
                <div className="glass-card p-6 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60">
                    <form onSubmit={handleGrade} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 mb-1 block">Submission ID</label>
                            <select value={gradeForm.submissionID} onChange={e => setGradeForm({...gradeForm, submissionID: e.target.value})} required
                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-white">
                                <option value="">Select Submission</option>
                                {submissions.map(s => (
                                    <option key={s.SubmissionID} value={s.SubmissionID}>#{s.SubmissionID} — {s.StudentName} ({s.AssignmentTitle}) {s.Score !== null ? `[Current: ${s.Score}]` : '[Pending]'}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full md:w-40">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 mb-1 block">Score</label>
                            <input type="number" step="0.1" min="0" max="100" placeholder="Score" required value={gradeForm.score} onChange={e => setGradeForm({...gradeForm, score: e.target.value})}
                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-white" />
                        </div>
                        <button type="submit" className="px-8 py-4 bg-gradient-to-r from-[#a78bfa] to-[#818cf8] text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm tracking-widest uppercase whitespace-nowrap">
                            Submit Grade
                        </button>
                    </form>
                </div>

                {/* Submissions Table */}
                <div className="glass-card overflow-hidden border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ID</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignment</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Course</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">File</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Score</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Corrected By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {submissions.length === 0 ? (
                                    <tr><td colSpan={8} className="p-8 text-center text-slate-400 text-sm italic">No submissions yet</td></tr>
                                ) : submissions.map(s => (
                                    <tr key={s.SubmissionID} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="p-5 text-xs font-bold text-slate-500">#{s.SubmissionID}</td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center"><User size={14} /></div>
                                                <span className="text-sm font-bold text-slate-800 dark:text-white">{s.StudentName}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-sm font-bold text-slate-600 dark:text-slate-300">{s.AssignmentTitle}</td>
                                        <td className="p-5 text-xs font-bold text-slate-400 uppercase">{s.CourseName}</td>
                                        <td className="p-5">
                                            {s.FilePath ? (
                                                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${s.FilePath}`} target="_blank" rel="noreferrer"
                                                    className="flex items-center gap-1 text-blue-500 text-xs font-bold hover:underline">
                                                    <Download size={14} /> View
                                                </a>
                                            ) : '—'}
                                        </td>
                                        <td className="p-5">
                                            {s.Score !== null ? (
                                                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm font-black">{s.Score}</span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 shadow-inner">Pending</span>
                                            )}
                                        </td>
                                        <td className="p-5 text-xs font-bold text-slate-500">{s.CorrectedByName || '—'}</td>
                                        <td className="p-5 text-right">
                                            <button 
                                                onClick={() => setGradeForm({ submissionID: s.SubmissionID.toString(), score: s.Score?.toString() || '' })}
                                                className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200 dark:border-white/10 opacity-0 group-hover:opacity-100"
                                            >
                                                {s.Score !== null ? 'Modify Grade' : 'Grade Now'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AssistantSubmissions;
