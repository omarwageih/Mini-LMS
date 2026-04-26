import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen } from 'lucide-react';
import { apiGet } from '../api';
import { SkeletonTable, EmptyState } from '../components/UIHelpers';

const Grades = () => {
    const [grades, setGrades] = useState([]);
    const [dashData, setDashData] = useState({ gpa: 0, courseCount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [g, d] = await Promise.all([
                    apiGet('/student/grades'),
                    apiGet('/student/dashboard')
                ]);
                setGrades(g);
                setDashData(d);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const getStatus = (score) => {
        if (!score && score !== 0) return 'N/A';
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Very Good';
        if (score >= 70) return 'Good';
        if (score >= 60) return 'Pass';
        return 'Fail';
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen pb-20 pt-10 px-4 sm:px-10 bg-slate-50 dark:bg-slate-950/60"
        >
            <div className="max-w-5xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                            <div className="w-2 h-8 bg-[#a78bfa] rounded-full"></div>
                            Academic Transcript
                        </h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-5">Detailed Course Performance</p>
                    </div>

                    <div className="bg-white dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center gap-6 shadow-sm">
                        <div className="text-center px-4 border-r border-slate-100 dark:border-white/10">
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Courses</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">{String(dashData.courseCount).padStart(2, '0')}</p>
                        </div>
                        <div className="text-center px-4">
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Current GPA</p>
                            <p className="text-xl font-black text-[#a78bfa] leading-none mt-1">{dashData.gpa?.toFixed(2) || '0.00'}</p>
                        </div>
                    </div>
                </div>

                {/* Grades Table Card */}
                {loading ? (
                    <SkeletonTable rows={4} cols={6} />
                ) : grades.length === 0 ? (
                    <EmptyState title="No grades yet" subtitle="Your grades will appear here once your courses are graded." icon={Award} />
                ) : (
                <div className="glass-card overflow-hidden border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Course Details</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignments</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quizzes</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Attendance</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Final</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Standing</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {grades.map((item) => (
                                    <tr key={item.GradeID} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-default">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/10 text-[#a78bfa] flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <BookOpen size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{item.CourseName}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Course #{item.CourseID}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-sm font-bold text-slate-600 dark:text-slate-300 text-center">{item.AssignmentTotal || 0}</td>
                                        <td className="p-6 text-sm font-bold text-slate-600 dark:text-slate-300 text-center">{item.QuizTotal || 0}</td>
                                        <td className="p-6 text-sm font-bold text-slate-600 dark:text-slate-300 text-center">{item.AttendanceTotal || 0}</td>
                                        <td className="p-6 text-center">
                                            <span className="inline-block px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 text-sm font-black text-[#a78bfa]">
                                                {item.TotalScore || 0}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${(item.TotalScore || 0) >= 90 ? 'bg-emerald-400' : 'bg-blue-400'}`}></div>
                                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{getStatus(item.TotalScore)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                )}

                {/* Footer Info */}
                <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    End of Official Academic Record
                </p>
            </div>
        </motion.div>
    );
};

export default Grades;