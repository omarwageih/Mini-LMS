import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, FileText, User, Award, Download } from 'lucide-react';
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
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                        <ClipboardList className="text-[#a78bfa]" size={32} />
                        All Submissions
                    </h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-11">Review Student Submissions & Grades</p>
                </div>

                {/* Submissions Table */}
                <div className="glass-card overflow-hidden border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
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
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-400 text-sm italic">No submissions yet</td></tr>
                                ) : submissions.map(s => (
                                    <tr key={s.SubmissionID} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                                    <User size={14} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-800 dark:text-white">{s.StudentName}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-sm font-bold text-slate-600 dark:text-slate-300">{s.AssignmentTitle}</td>
                                        <td className="p-5 text-xs font-bold text-slate-400 uppercase">{s.CourseName}</td>
                                        <td className="p-5">
                                            {s.FilePath ? (
                                                <a href={`http://localhost:3000/uploads/submissions/${s.FilePath}`} target="_blank" rel="noreferrer"
                                                    className="flex items-center gap-1 text-blue-500 text-xs font-bold hover:underline">
                                                    <Download size={14} /> View
                                                </a>
                                            ) : <span className="text-xs text-slate-400">—</span>}
                                        </td>
                                        <td className="p-5">
                                            {s.Score !== null ? (
                                                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm font-black">{s.Score}</span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase">Pending</span>
                                            )}
                                        </td>
                                        <td className="p-5 text-xs font-bold text-slate-500">{s.CorrectedByName || '—'}</td>
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

export default InstructorSubmissions;
