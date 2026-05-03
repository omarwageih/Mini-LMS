import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, FileText, User, Award, Download, Shield } from 'lucide-react';
import { apiGet } from '../../api';

const InstructorSubmissions = () => {
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => { loadSubmissions(); }, []);

    const loadSubmissions = async () => {
        try {
            const data = await apiGet('/instructor/submissions');
            setSubmissions(data);
        } catch (err) { console.error(err); }
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
                                                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/uploads/submissions/${s.FilePath}`} target="_blank" rel="noreferrer"
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
