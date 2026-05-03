import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, BookOpen, Award, Target, BarChart3,
    PieChart, Activity, Clock, Zap
} from 'lucide-react';
import { apiGet } from '../api';
import { SkeletonCard } from '../components/Skeletons';

const Analytics = () => {
    const [grades, setGrades] = useState([]);
    const [courses, setCourses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [g, c, a] = await Promise.all([
                    apiGet('/student/grades'),
                    apiGet('/student/courses'),
                    apiGet('/student/assignments'),
                ]);
                setGrades(g || []);
                setCourses(c || []);
                setAssignments(a || []);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    // Compute analytics
    const totalCourses = courses.length;
    const totalAssignments = assignments.length;
    const submittedAssignments = assignments.filter(a => a.Status === 'Submitted').length;
    const submissionRate = totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 0;

    const avgScore = grades.length > 0
        ? (grades.reduce((sum, g) => sum + (g.TotalScore || 0), 0) / grades.length).toFixed(1)
        : '0.0';

    const highestScore = grades.length > 0
        ? Math.max(...grades.map(g => g.TotalScore || 0))
        : 0;

    const lowestScore = grades.length > 0
        ? Math.min(...grades.map(g => g.TotalScore || 0))
        : 0;

    // Grade distribution
    const distribution = { Excellent: 0, 'Very Good': 0, Good: 0, Pass: 0, Fail: 0 };
    grades.forEach(g => {
        const s = g.TotalScore || 0;
        if (s >= 90) distribution.Excellent++;
        else if (s >= 80) distribution['Very Good']++;
        else if (s >= 70) distribution.Good++;
        else if (s >= 60) distribution.Pass++;
        else distribution.Fail++;
    });

    const distColors = {
        Excellent: 'bg-emerald-500',
        'Very Good': 'bg-blue-500',
        Good: 'bg-cyan-500',
        Pass: 'bg-amber-500',
        Fail: 'bg-red-500'
    };

    const maxDist = Math.max(...Object.values(distribution), 1);

    // Per-course performance
    const coursePerformance = grades.map(g => ({
        name: g.CourseName || `Course #${g.CourseID}`,
        score: g.TotalScore || 0,
    })).sort((a, b) => b.score - a.score);

    const statsCards = [
        { label: 'Enrolled Courses', value: totalCourses, icon: <BookOpen size={20} />, color: 'from-blue-600 to-indigo-600', shadow: 'shadow-blue-500/20' },
        { label: 'Average Score', value: avgScore, icon: <TrendingUp size={20} />, color: 'from-emerald-600 to-teal-600', shadow: 'shadow-emerald-500/20' },
        { label: 'Submission Rate', value: `${submissionRate}%`, icon: <Target size={20} />, color: 'from-purple-600 to-pink-600', shadow: 'shadow-purple-500/20' },
        { label: 'Total Tasks', value: totalAssignments, icon: <Activity size={20} />, color: 'from-orange-600 to-red-600', shadow: 'shadow-orange-500/20' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen pt-10 px-4 sm:px-10 pb-20 bg-slate-50 dark:bg-slate-950/60">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SkeletonCard /><SkeletonCard />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen pt-10 px-4 sm:px-10 pb-20 bg-slate-50 dark:bg-slate-950/60"
        >
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Header */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">
                        <BarChart3 size={14} className="animate-pulse" /> Performance Overview
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                        Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Analytics</span>
                    </h1>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsCards.map((card, i) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-slate-900/40 rounded-3xl p-6 border border-slate-200 dark:border-white/5 hover:shadow-xl transition-all group"
                        >
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-lg ${card.shadow} group-hover:scale-110 transition-transform mb-4`}>
                                {card.icon}
                            </div>
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">{card.value}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{card.label}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Grade Distribution */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-slate-900/40 rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-xl"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <PieChart size={20} className="text-purple-500" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Grade Distribution</h2>
                        </div>

                        <div className="space-y-5">
                            {Object.entries(distribution).map(([label, count]) => (
                                <div key={label} className="group">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
                                        <span className="text-xs font-black text-slate-400">{count}</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(count / maxDist) * 100}%` }}
                                            transition={{ duration: 1, delay: 0.5, ease: 'circOut' }}
                                            className={`h-full ${distColors[label]} rounded-full`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Course Performance */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white dark:bg-slate-900/40 rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-xl"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <BarChart3 size={20} className="text-blue-500" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Course Scores</h2>
                        </div>

                        {coursePerformance.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-xs text-slate-400 font-bold">No course data available</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {coursePerformance.map((course, i) => {
                                    const pct = Math.min(course.score, 100);
                                    const barColor = pct >= 90 ? 'from-emerald-500 to-teal-500'
                                        : pct >= 70 ? 'from-blue-500 to-cyan-500'
                                        : pct >= 60 ? 'from-amber-500 to-orange-500'
                                        : 'from-red-500 to-pink-500';
                                    return (
                                        <div key={i} className="group">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[70%]">{course.name}</span>
                                                <span className="text-xs font-black text-slate-800 dark:text-white">{course.score}</span>
                                            </div>
                                            <div className="h-2.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 1.2, delay: 0.3 + i * 0.1, ease: 'circOut' }}
                                                    className={`h-full bg-gradient-to-r ${barColor} rounded-full`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Performance Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-6"
                >
                    <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-6 border border-slate-200 dark:border-white/5 text-center">
                        <Zap size={24} className="text-emerald-500 mx-auto mb-3" />
                        <p className="text-2xl font-black text-emerald-500 italic">{highestScore}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Highest Score</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-6 border border-slate-200 dark:border-white/5 text-center">
                        <Award size={24} className="text-blue-500 mx-auto mb-3" />
                        <p className="text-2xl font-black text-blue-500 italic">{avgScore}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Mean Score</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-6 border border-slate-200 dark:border-white/5 text-center">
                        <Clock size={24} className="text-orange-500 mx-auto mb-3" />
                        <p className="text-2xl font-black text-orange-500 italic">{lowestScore}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Lowest Score</p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Analytics;
