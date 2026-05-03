import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet, apiPost } from '../api';
import {
    User, Mail, Calendar, Award,
    Settings, Camera, Shield, GraduationCap,
    Zap, Target, Heart, Edit2, Loader2, X, Sparkles, BookOpen, ShieldCheck, Activity
} from 'lucide-react';

const Profile = () => {
    const [isEditing, setIsEditing] = useState(false);
    
    // Get user from localStorage
    const initialUser = JSON.parse(localStorage.getItem('user')) || { FullName: 'University User', UserType: 'Student', Email: 'user@mini.edu' };
    const [userData, setUserData] = useState(initialUser);
    const user = userData; 
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const handleUpdate = (e) => {
        e.preventDefault();
        localStorage.setItem('user', JSON.stringify(userData));
        window.dispatchEvent(new Event('userUpdated'));
        setIsEditing(false);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show instant preview
        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);

        setUploading(true);
        const formData = new FormData();
        formData.append('profilePic', file);

        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${API_URL}/api/auth/profile-picture`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                const updatedUser = { ...userData, ProfilePicture: data.profilePicture };
                setUserData(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                window.dispatchEvent(new Event('userUpdated'));
                setAvatarPreview(null);
            }
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        const loadStats = async () => {
            try {
                const stats = await apiGet('/dashboard/stats');
                const gpaItem = stats.find(s => s.label?.includes('GPA'));
                const courseItem = stats.find(s => s.label?.includes('Course') || s.label?.includes('Section'));
                setStatsData({
                    gpa: gpaItem ? parseFloat(gpaItem.val) : 0,
                    courseCount: courseItem ? parseInt(courseItem.val) : 0
                });
            } catch (err) {
                console.error('Profile fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    const profileDetails = {
        Department: "Computer Engineering",
        Level: "Level 4",
        JoinDate: "Sep 2024",
        TotalCredits: (statsData?.courseCount || 0) * 3
    };

    const radius = 75;
    const circumference = 2 * Math.PI * radius;
    const gpaValue = statsData?.gpa || 0;
    const progressOffset = circumference - (Math.min(gpaValue, 4.0) / 4.0) * circumference;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Loader2 size={40} className="text-[#a78bfa]" />
            </motion.div>
        </div>
    );

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="min-h-screen pb-20 pt-4 px-4 sm:px-10 selection:bg-indigo-500/30 bg-slate-50 dark:bg-[#0f172a]"
        >
            <div className="max-w-6xl mx-auto space-y-12">

                {/* 1. Elegant Header */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 pt-10 border-b border-slate-100 dark:border-white/5 pb-10">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                        <div className="relative group">
                            <div className="absolute inset-[-10px] bg-gradient-to-r from-[#d8b4fe] via-[#a78bfa] to-[#818cf8] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity rounded-full"></div>

                            <div className="relative w-40 h-40 rounded-full bg-white dark:bg-slate-900 p-2 shadow-xl ring-1 ring-slate-200/50 dark:ring-white/5">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center overflow-hidden relative">
                                    {(avatarPreview || userData.ProfilePicture) ? (
                                        <img 
                                            src={avatarPreview || `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${userData.ProfilePicture}`} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-6xl font-black text-white uppercase italic">
                                            {userData.FullName?.charAt(0)}
                                        </span>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <Loader2 size={30} className="text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <label className="absolute bottom-2 right-2 p-3.5 bg-white dark:bg-slate-800 text-slate-500 hover:text-[#a78bfa] rounded-full shadow-lg border border-slate-100 dark:border-white/10 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                                <Camera size={18} />
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>

                        <div className="space-y-2.5 pb-2">
                            <h1 className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic">
                                {user.FullName}
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                                <span className="flex items-center gap-2 text-[10px] font-black text-[#a78bfa] uppercase tracking-widest bg-[#a78bfa]/10 px-4 py-1.5 rounded-full border border-[#a78bfa]/20 shadow-inner">
                                    <Zap size={14} fill="currentColor" /> {user.UserType}
                                </span>
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 italic">
                                    <Target size={14} className="text-orange-300" fill="currentColor" /> {profileDetails.Department}
                                </span>
                            </div>
                        </div>
                    </div>

                    <motion.button 
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsEditing(true)}
                        className="btn-grad px-8 py-4 text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 flex items-center gap-3"
                    >
                        <Sparkles size={16} /> Update Info
                    </motion.button>
                </motion.div>

                {/* 2. Stats & Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left Column: Academic Health / Performance */}
                    <motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col gap-10">
                        <div className="glass-card p-10 flex flex-col items-center justify-center border border-white dark:border-white/5 shadow-2xl relative">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2">
                                {user.UserType === 'Student' ? (
                                    <><Heart size={12} className="text-red-400" /> Academic Health</>
                                ) : (
                                    <><Shield size={12} className="text-blue-400" /> Faculty Excellence</>
                                )}
                            </h3>
                            
                            <div className="absolute top-6 right-6">
                                <motion.div 
                                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="w-16 h-16 bg-indigo-500/10 blur-xl rounded-full"
                                />
                            </div>

                            {user.UserType === 'Student' ? (
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
                                                <stop offset="0%" stopColor="#6366f1" />
                                                <stop offset="100%" stopColor="#8b5cf6" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-6xl font-black text-slate-800 dark:text-slate-100 italic tracking-tighter leading-none">{gpaValue.toFixed(2)}</span>
                                        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.3em] mt-1.5">GPA SCORE</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative flex flex-col items-center">
                                    <div className="w-48 h-48 rounded-full border-2 border-dashed border-indigo-500/20 flex items-center justify-center relative">
                                        <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-3xl" />
                                        <Award size={80} className="text-indigo-500/80 relative z-10" />
                                    </div>
                                    <div className="mt-8 text-center space-y-1">
                                        <span className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter">{statsData?.courseCount || 0}</span>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Modules Managed</p>
                                    </div>
                                </div>
                            )}
                            
                            <div className="mt-8 px-6 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-[#a78bfa] italic">
                                {user.UserType === 'Student' 
                                    ? (gpaValue >= 3.7 ? 'Excellent Standing' : 'Active Enrollment')
                                    : 'Verified Faculty Member'
                                }
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Identity details */}
                    <motion.div variants={itemVariants} className="lg:col-span-7 flex flex-col gap-6 h-full">
                        <div className="glass-card p-10 flex-1 border border-white dark:border-white/5 rounded-[2.5rem] shadow-2xl">
                            <div className="flex items-center justify-between mb-12">
                                <h2 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tighter flex items-center gap-3 italic">
                                    <Shield className="text-[#a78bfa]" size={22} /> Identity Terminal
                                </h2>
                                <button className="p-3 bg-slate-50 dark:bg-white/5 rounded-full text-slate-300 hover:text-[#a78bfa] transition-all shadow-inner border border-slate-100 dark:border-white/5">
                                    <Settings size={18} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                                <ModernInfoItem icon={<Mail size={20} />} label="Terminal Email" value={user.Email} />
                                <ModernInfoItem 
                                    icon={<GraduationCap size={20} />} 
                                    label={user.UserType === 'Student' ? "Academic Level" : "Designation"} 
                                    value={user.UserType === 'Student' ? profileDetails.Level : user.UserType} 
                                />
                                <ModernInfoItem icon={<Calendar size={20} />} label="Join Session" value={profileDetails.JoinDate} />
                                <ModernInfoItem 
                                    icon={<BookOpen size={20} />} 
                                    label={user.UserType === 'Student' ? "Earned Units" : "Course Load"} 
                                    value={user.UserType === 'Student' ? `${profileDetails.TotalCredits} Credits` : `${statsData?.courseCount || 0} Open Courses`} 
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* 📝 Update Info Modal */}
            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsEditing(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-8 shadow-2xl relative z-10 border border-slate-200 dark:border-white/10"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">Update Identity</h3>
                                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"><X size={20}/></button>
                            </div>
                            
                            <form onSubmit={handleUpdate} className="space-y-6">
                                <ProfileInput 
                                    label="Full Name" 
                                    value={userData.FullName} 
                                    onChange={(e) => setUserData({...userData, FullName: e.target.value})} 
                                />
                                <ProfileInput 
                                    label="Email Address" 
                                    type="email"
                                    value={userData.Email} 
                                    onChange={(e) => setUserData({...userData, Email: e.target.value})} 
                                />
                                
                                <button 
                                    type="submit"
                                    className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-95 transition-all mt-4"
                                >
                                    Confirm Updates
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const ProfileInput = ({ label, ...props }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1 italic">{label}</label>
        <input 
            {...props}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#a78bfa]/20 focus:border-[#a78bfa] dark:text-white outline-none transition-all"
        />
    </div>
);

const ModernInfoItem = ({ icon, label, value }) => (
    <div className="flex items-center gap-5 group cursor-default">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 text-slate-400 group-hover:text-[#a78bfa] group-hover:scale-110 transition-all duration-300 shadow-lg border border-slate-100 dark:border-white/10 ring-1 ring-slate-100 dark:ring-white/5 shadow-slate-100 dark:shadow-none">
            {icon}
        </div>
        <div className="space-y-0.5">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{label}</p>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-none pt-0.5">{value}</p>
        </div>
    </div>
);

export default Profile;
