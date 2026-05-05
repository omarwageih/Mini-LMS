import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen, TrendingUp, ChevronRight } from 'lucide-react';
import { studentAPI } from '../../services/api';
import { SkeletonTable } from '../../components/Skeletons';

const GradesTab = ({ courseId }) => {
    const [grade, setGrade] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await studentAPI.getGrades();
                // Filter for this specific course
                const courseGrade = data.find(g => String(g.CourseID) === String(courseId));
                setGrade(courseGrade);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [courseId]);

    const getStatus = (score) => {
        if (!score && score !== 0) return 'N/A';
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Very Good';
        if (score >= 70) return 'Good';
        if (score >= 60) return 'Pass';
        return 'Fail';
    };

    if (loading) return <SkeletonTable rows={3} cols={4} />;

    if (!grade) {
        return (
            <div className="p-10 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">No grades posted yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your instructor hasn't published the final grades for this course.</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Card */}
                <div className="md:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Current Performance</p>
                            <h2 className="text-4xl font-black mt-2 italic tracking-tighter">
                                {grade.TotalScore || '0.00'}<span className="text-lg opacity-60 ml-1">/ 100</span>
                            </h2>
                        </div>
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <div className="mt-8 flex items-center gap-4">
                        <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                            <p className="text-[10px] text-indigo-200 font-bold uppercase">Standing</p>
                            <p className="font-bold text-sm">{getStatus(grade.TotalScore)}</p>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Academic Standing</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your performance is based on assignments, quizzes, and attendance.</p>
                    </div>
                    <button className="w-full mt-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                        View Detailed Report <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-50 dark:border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <BookOpen size={18} />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white">Components Breakdown</h3>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-white/5">
                    {[
                        { label: 'Assignments Total', val: grade.AssignmentTotal || 0, color: 'bg-blue-500' },
                        { label: 'Quizzes & Tests', val: grade.QuizTotal || 0, color: 'bg-purple-500' },
                        { label: 'Attendance & Participation', val: grade.AttendanceTotal || 0, color: 'bg-emerald-500' },
                    ].map((item, idx) => (
                        <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.label}</span>
                            <div className="flex items-center gap-4">
                                <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                                    <div className={`h-full ${item.color}`} style={{ width: `${Math.min(100, item.val)}%` }}></div>
                                </div>
                                <span className="text-sm font-black text-slate-800 dark:text-white w-10 text-right">{item.val}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default GradesTab;
