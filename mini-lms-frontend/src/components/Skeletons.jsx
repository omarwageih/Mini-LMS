import React from 'react';

// Skeleton primitives
export const SkeletonPulse = ({ className = '' }) => (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />
);

// Card skeleton for dashboards
export const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-white/5 p-6 space-y-4">
        <div className="flex items-center gap-4">
            <SkeletonPulse className="w-12 h-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
                <SkeletonPulse className="h-3 w-24" />
                <SkeletonPulse className="h-5 w-16" />
            </div>
        </div>
    </div>
);

// Table row skeleton
export const SkeletonRow = ({ cols = 4 }) => (
    <tr className="border-b border-slate-100 dark:border-white/5">
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="p-5">
                <SkeletonPulse className={`h-4 ${i === 0 ? 'w-32' : i === cols - 1 ? 'w-16' : 'w-24'}`} />
            </td>
        ))}
    </tr>
);

// Table skeleton
export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
    <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-white/5">
            <SkeletonPulse className="h-5 w-48" />
        </div>
        <table className="w-full">
            <tbody>
                {Array.from({ length: rows }).map((_, i) => (
                    <SkeletonRow key={i} cols={cols} />
                ))}
            </tbody>
        </table>
    </div>
);

// Full page skeleton
export const SkeletonPage = () => (
    <div className="space-y-8 animate-pulse">
        <div className="space-y-3">
            <SkeletonPulse className="h-10 w-64" />
            <SkeletonPulse className="h-3 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
        </div>
        <SkeletonTable />
    </div>
);

// Course card skeleton
export const SkeletonCourseCard = () => (
    <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-white/5 p-6 space-y-4">
        <SkeletonPulse className="h-32 w-full rounded-2xl" />
        <SkeletonPulse className="h-5 w-3/4" />
        <SkeletonPulse className="h-3 w-1/2" />
        <div className="flex gap-2">
            <SkeletonPulse className="h-8 w-20 rounded-xl" />
            <SkeletonPulse className="h-8 w-20 rounded-xl" />
        </div>
    </div>
);
