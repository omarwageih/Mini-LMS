import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle2, Clock, AlertCircle, ChevronRight } from 'lucide-react';

const ActivitiesTab = ({ assignments }) => {
    if (!assignments || assignments.length === 0) {
        return (
            <div className="p-20 text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardList size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">No activities listed</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">There are no assignments or quizzes for this course yet.</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Course Activities</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Assignments and interactive tasks</p>
                </div>
            </div>

            <div className="space-y-4">
                {assignments.map((a) => {
                    const isOverdue = a.Deadline && new Date(a.Deadline) < new Date();
                    return (
                        <motion.div
                            key={a.AssignmentID}
                            whileHover={{ scale: 1.01 }}
                            className="p-5 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isOverdue ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'}`}>
                                    <ClipboardList size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{a.Title}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                            <Clock size={12} />
                                            {a.Deadline ? new Date(a.Deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No deadline'}
                                        </span>
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            {a.Max_Score || 10} Points
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-6">
                                <div className="flex flex-col items-end">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                                        {isOverdue ? 'Overdue' : 'Open'}
                                    </span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                                        Pending Submission
                                    </span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default ActivitiesTab;
