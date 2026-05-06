import React from 'react';
import { motion } from 'framer-motion';
import { Target, Star, Shield, Lock } from 'lucide-react';

const CompetenciesTab = () => {
    const placeholderComp = [
        { name: 'Critical Thinking', level: 'Intermediate', progress: 65 },
        { name: 'Technical Literacy', level: 'Advanced', progress: 85 },
        { name: 'Problem Solving', level: 'Beginner', progress: 30 }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="relative overflow-hidden p-8 rounded-[2rem] bg-slate-900 dark:bg-slate-900/60 text-white shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest">
                            <Star size={12} fill="currentColor" /> Premium Feature
                        </div>
                        <h2 className="text-3xl font-black italic tracking-tighter uppercase">Competency Tracking</h2>
                        <p className="max-w-md text-slate-400 text-sm leading-relaxed">
                            Visualize your skill progression and learning outcomes mapped to international standards. This module is currently being finalized.
                        </p>
                    </div>
                    <div className="flex -space-x-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center">
                                <Shield className="text-blue-500/40" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-40 grayscale pointer-events-none">
                {placeholderComp.map((c, idx) => (
                    <div key={idx} className="p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 flex flex-col justify-between gap-6">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400">
                                <Target size={24} />
                            </div>
                            <Lock size={16} className="text-slate-300 dark:text-slate-700" />
                        </div>
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <h4 className="font-bold text-slate-800 dark:text-white">{c.name}</h4>
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase">{c.level}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${c.progress}%` }}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center py-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Coming Soon in Version 2.0</p>
            </div>
        </motion.div>
    );
};

export default CompetenciesTab;
