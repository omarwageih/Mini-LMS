import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';

// Reusable Skeleton Loader
export const SkeletonCard = ({ className = '' }) => (
    <div className={`animate-pulse rounded-[2rem] bg-slate-200 dark:bg-white/5 ${className}`}></div>
);

export const SkeletonRow = () => (
    <div className="animate-pulse flex items-center gap-4 p-5">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/5"></div>
        <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-200 dark:bg-white/5 rounded-full w-3/4"></div>
            <div className="h-2 bg-slate-200 dark:bg-white/5 rounded-full w-1/2"></div>
        </div>
    </div>
);

export const SkeletonTable = ({ rows = 4, cols = 5 }) => (
    <div className="glass-card overflow-hidden border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60">
        <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex gap-4 p-3 border-b border-slate-100 dark:border-white/5">
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="h-3 bg-slate-200 dark:bg-white/5 rounded-full flex-1 animate-pulse"></div>
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 p-3">
                    {Array.from({ length: cols }).map((_, j) => (
                        <div key={j} className="h-3 bg-slate-100 dark:bg-white/[0.03] rounded-full flex-1 animate-pulse" style={{ animationDelay: `${(i + j) * 0.1}s` }}></div>
                    ))}
                </div>
            ))}
        </div>
    </div>
);

// Reusable Empty State
export const EmptyState = ({ title = 'No data found', subtitle = 'Nothing to display at the moment.', icon: Icon = ClipboardList }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 space-y-5"
    >
        <div className="w-20 h-20 rounded-[2rem] bg-[#a78bfa]/10 flex items-center justify-center">
            <Icon size={36} className="text-[#a78bfa]" />
        </div>
        <div className="text-center space-y-2">
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{title}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold italic max-w-xs">{subtitle}</p>
        </div>
    </motion.div>
);
