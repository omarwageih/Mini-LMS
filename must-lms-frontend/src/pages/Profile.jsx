import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    User, Mail, Calendar, Award,
    Settings, Camera, Shield, GraduationCap,
    Zap, Target, Heart, Edit2, Loader2
} from 'lucide-react';
import { apiGet } from '../api';

const Profile = () => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Get user from localStorage (always available)
    const user = JSON.parse(localStorage.getItem('user')) || {};

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await apiGet('/student/dashboard');
                setProfileData(data);
            } catch (err) {
                console.error('Profile fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const userData = {
        FullName: user.FullName || 'University User',
        Email: user.Email || 'user@must.edu',
        Role: user.UserType || 'Student',
        Department: 'Computer Engineering',
        Level: 'Level 4',
        GPA: profileData?.gpa || 0,
        TotalCredits: profileData?.courseCount ? profileData.courseCount * 3 : 0,
        JoinDate: 'Sep 2024'
    };

    const radius = 75;
    const circumference = 2 * Math.PI * radius;
    const gpaValue = Math.min(userData.GPA, 4.0);
    const progressOffset = circumference - (gpaValue / 4.0) * circumference;

    const getGpaLabel = (gpa) => {
        if (gpa >= 3.7) return 'Excellent';
        if (gpa >= 3.0) return 'Very Good';
        if (gpa >= 2.0) return 'Good';
        if (gpa >= 1.0) return 'Pass';
        return 'N/A';
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    <Loader2 size={40} className="text-[#a78bfa]" />
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="min-h-screen pb-20 pt-4 px-4 sm:px-10 selection:bg-[#c084fc]/30 bg-slate-50 dark:bg-slate-950/60"
        >
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Header */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 pt-10 border-b border-slate-100 dark:border-white/5 pb-10">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                        <div className="relative group">
                            <div className="absolute inset-[-10px] bg-gradient-to-r from-[#d8b4fe] via-[#a78bfa] to-[#818cf8] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity rounded-full"></div>

                            <div className="relative w-40 h-40 rounded-full bg-white dark:bg-slate-900 p-2 shadow-xl ring-1 ring-slate-200/50 dark:ring-white/5">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center overflow-hidden">
                                    <span className="text-5xl font-black text-white uppercase">
                                        {userData.FullName?.charAt(0)}
                                    </span>
                                </div>
                            </div>
                            <button className="absolute bottom-2 right-2 p-3.5 bg-white dark:bg-slate-800 text-slate-500 hover:text-[#a78bfa] rounded-full shadow-lg border border-slate-100 dark:border-white/10 hover:scale-110 active:scale-95 transition-all">
                                <Camera size={18} />
                            </button>
                        </div>

                        <div className="space-y-2.5 pb-2">
                            <h1 className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic">
                                {userData.FullName}
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                                <span className="flex items-center gap-2 text-xs font-black text-[#a78bfa] uppercase tracking-widest bg-[#a78bfa]/10 px-4 py-1.5 rounded-full border border-[#a78bfa]/20 shadow-inner">
                                    <Zap size={14} fill="currentColor" /> {userData.Role}
                                </span>
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 italic">
                                    <Target size={14} className="text-orange-300" fill="currentColor" /> {userData.Department}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button className="flex items-center gap-2.5 px-6 py-4 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-200 font-bold rounded-2xl text-[11px] uppercase tracking-widest shadow-lg hover:shadow-xl hover:border-slate-200 dark:hover:border-white/10 border border-slate-100 dark:border-white/5 transition-all active:scale-95">
                        <Edit2 size={16} /> Update Info
                    </button>
                </motion.div>

                {/* Stats & Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* GPA Circle Card */}
                    <motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col gap-10">
                        <div className="glass-card p-10 flex flex-col items-center justify-center shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 relative bg-white/70 dark:bg-slate-900/60">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2">
                                <Heart size={12} className="text-red-400" /> Academic Health
                            </h3>

                            <div className="relative">
                                <svg className="w-52 h-52 transform -rotate-90">
                                    <circle cx="104" cy="104" r={radius} className="stroke-slate-100 dark:stroke-white/5" strokeWidth="12" fill="transparent" />
                                    <motion.circle
                                        initial={{ strokeDashoffset: circumference }}
                                        animate={{ strokeDashoffset: progressOffset }}
                                        transition={{ duration: 2, delay: 0.5, ease: "circOut" }}
                                        cx="104" cy="104" r={radius} stroke="url(#gpa_aurora)" strokeWidth="12" fill="transparent"
                                        strokeDasharray={circumference} strokeLinecap="round"
                                    />
                                    <defs>
                                        <linearGradient id="gpa_aurora" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#d8b4fe" />
                                            <stop offset="100%" stopColor="#818cf8" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-6xl font-black text-slate-950 dark:text-white italic tracking-tighter leading-none">{userData.GPA.toFixed(2)}</span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1.5">GPA SCORE</span>
                                </div>
                            </div>
                            <div className="mt-8 px-5 py-2 bg-gradient-to-r from-[#d8b4fe] to-[#818cf8] text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#818cf8]/20">
                                {getGpaLabel(userData.GPA)}
                            </div>
                        </div>
                    </motion.div>

                    {/* Detailed Info */}
                    <motion.div variants={itemVariants} className="lg:col-span-7 flex flex-col gap-6 h-full">
                        <div className="glass-card p-10 flex-1 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60">
                            <div className="flex items-center justify-between mb-12">
                                <h2 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                    <Shield className="text-[#a78bfa]" size={22} /> Identity details
                                </h2>
                                <button className="p-3 bg-slate-50 dark:bg-white/5 rounded-full text-slate-300 hover:text-slate-600 dark:hover:text-slate-100 transition-all shadow-inner border border-slate-100 dark:border-white/5">
                                    <Settings size={18} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                                <ModernInfoItem icon={<Mail size={20} />} label="University email" value={userData.Email} />
                                <ModernInfoItem icon={<GraduationCap size={20} />} label="Role" value={userData.Role} />
                                <ModernInfoItem icon={<Calendar size={20} />} label="Registration" value={userData.JoinDate} />
                                <ModernInfoItem icon={<Award size={20} />} label="Enrolled courses" value={`${profileData?.courseCount || 0} Courses`} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

const ModernInfoItem = ({ icon, label, value }) => (
    <div className="flex items-center gap-5 group cursor-default">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/50 text-slate-400 group-hover:text-[#a78bfa] group-hover:scale-110 transition-all duration-300 shadow-lg border border-slate-100 dark:border-white/10 ring-1 ring-slate-100 dark:ring-white/5 shadow-slate-100 dark:shadow-none">
            {icon}
        </div>
        <div className="space-y-0.5">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{label}</p>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-none pt-0.5">{value}</p>
        </div>
    </div>
);

export default Profile;