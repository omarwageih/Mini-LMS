import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Phone, MapPin, 
    Camera, Shield, GraduationCap,
    Award, ChevronDown, Check, X,
    Edit3, CreditCard, BookOpen, UserCheck, 
    AtSign, Briefcase, Loader2, Sparkles
} from 'lucide-react';

const Profile = () => {
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    
    // User state
    const initialUser = JSON.parse(localStorage.getItem('user')) || { 
        FullName: 'University User', 
        UserType: 'Student', 
        Email: 'user@must.edu',
        Phone: '01023654765'
    };
    const [userData, setUserData] = useState(initialUser);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setLoading(false);
                    return;
                }
                const res = await fetch('http://localhost:3000/api/dashboard/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const stats = await res.json();
                    const gpaItem = stats.find(s => s.label?.includes('GPA'));
                    const courseItem = stats.find(s => s.label?.includes('Course') || s.label?.includes('Section'));
                    setStatsData({
                        gpa: gpaItem ? parseFloat(gpaItem.val) : 1.8, // Defaulting to something if null for demo
                        courseCount: courseItem ? parseInt(courseItem.val) : 5,
                        rank: 105,
                        class: 4,
                        creditHours: 51,
                        totalCreditsReq: 182,
                        semester: 'Spring-2026'
                    });
                }
            } catch (err) {
                console.error('Profile fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    const handleUpdate = (e) => {
        e.preventDefault();
        // In a real app, you'd call an API here
        localStorage.setItem('user', JSON.stringify(userData));
        setIsEditing(false);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Loader2 size={40} className="text-blue-500" />
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#111111] text-slate-200 pb-20 pt-4 px-4 sm:px-6">
            <div className="max-w-md mx-auto space-y-4">
                
                {/* 🏷️ Header: User Identity Card (Matching Screenshot) */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#2a2a2a] rounded-xl p-5 shadow-xl border border-white/5 relative overflow-hidden"
                >
                    <div className="flex gap-4 items-start relative z-10">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-24 h-28 rounded-xl bg-slate-800 overflow-hidden ring-2 ring-white/10">
                                <div className="w-full h-full bg-gradient-to-br from-blue-600/40 to-indigo-600/40 flex items-center justify-center">
                                    <span className="text-4xl font-black text-white/50">{userData.FullName?.charAt(0)}</span>
                                </div>
                            </div>
                            <button className="absolute -bottom-2 -right-2 p-2 bg-blue-600 rounded-full border-2 border-[#2a2a2a] shadow-lg">
                                <Camera size={14} className="text-white" />
                            </button>
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 space-y-2">
                            <h2 className="text-lg font-bold leading-tight tracking-tight">
                                {userData.FullName}
                            </h2>
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                                <CreditCard size={14} /> ID {userData.UserID || '200025960'}
                            </div>
                            
                            <div className="flex items-center gap-3 pt-1">
                                <div className="px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full flex items-center gap-1.5">
                                    <GraduationCap size={12} className="text-yellow-400" />
                                    <span className="text-[10px] font-black text-yellow-400 uppercase">CGPA {statsData?.gpa?.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500 pt-1">
                                <span><Sparkles size={10} className="inline mr-1 text-yellow-500" /> Rank: {statsData?.rank}</span>
                                <span>Class: {statsData?.class}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                        <MapPin size={12} /> Misr University for Science & Technology
                    </div>
                </motion.div>

                {/* 📘 UG - Engineering Section */}
                <Card title="UG — ENGINEERING" subtitle="Your information & status" icon={<BookOpen size={20} className="text-blue-500" />}>
                    <div className="space-y-4 pt-4">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Credit Hours</span>
                            <span className="text-[10px] font-black text-blue-500">{statsData?.creditHours} / {statsData?.totalCreditsReq}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(statsData?.creditHours / statsData?.totalCreditsReq) * 100}%` }}
                                className="h-full bg-blue-600"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-2 text-[11px] font-bold text-slate-400">
                            <Check size={14} className="text-emerald-500" />
                            Current Semester: <span className="text-white ml-2">{statsData?.semester}</span>
                        </div>
                    </div>
                </Card>

                {/* 💰 Balance Section */}
                <Card title="Balance" icon={<div className="p-2 bg-red-500/20 rounded-lg"><CreditCard size={18} className="text-red-500" /></div>}>
                    <div className="flex justify-between items-center py-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-red-500 leading-none">0.0</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">EGP</span>
                        </div>
                        <button className="px-5 py-2 bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors border border-white/5">
                            Details {'>'}
                        </button>
                    </div>
                </Card>

                {/* 📞 Contacts Toggle Section */}
                <Card title="Contacts" collapsable defaultOpen={true} icon={<AtSign size={18} className="text-blue-500" />}>
                    <div className="space-y-5 pt-6 pb-2">
                         <InfoRow icon={<Phone size={16} />} text={userData.Phone || '01023654765'} />
                         <InfoRow icon={<Mail size={16} />} text={userData.Email} />
                         <InfoRow icon={<UserCheck size={16} />} text="Advisor: mohamed ebrahim wadaa ali" />
                         <InfoRow icon={<Briefcase size={16} />} text="Major: Computer& Software Engineering" />
                         <InfoRow icon={<AtSign size={16} />} text={userData.Email} />
                    </div>
                </Card>

                {/* 🛠️ Action Buttons */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="p-4 bg-blue-600 text-white rounded-xl font-black text-[12px] uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                        <Edit3 size={16} /> Update Info
                    </button>
                    <button className="p-4 bg-[#2a2a2a] text-slate-400 rounded-xl font-black text-[12px] uppercase tracking-widest border border-white/5">
                        Settings
                    </button>
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
                            className="bg-[#2a2a2a] w-full max-w-sm rounded-3xl p-8 shadow-2xl relative z-10 border border-white/10"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-lg font-black uppercase tracking-tighter italic">Update Identity</h3>
                                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={20}/></button>
                            </div>
                            
                            <form onSubmit={handleUpdate} className="space-y-6">
                                <ProfileInput 
                                    label="Full Name" 
                                    value={userData.FullName} 
                                    onChange={(e) => setUserData({...userData, FullName: e.target.value})} 
                                />
                                <ProfileInput 
                                    label="Phone Number" 
                                    value={userData.Phone || ''} 
                                    onChange={(e) => setUserData({...userData, Phone: e.target.value})} 
                                />
                                <ProfileInput 
                                    label="Email Address" 
                                    type="email"
                                    value={userData.Email} 
                                    onChange={(e) => setUserData({...userData, Email: e.target.value})} 
                                />
                                
                                <button 
                                    type="submit"
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black uppercase tracking-[0.3em] text-[11px] shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                                >
                                    Confirm Updates
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Card = ({ title, subtitle, icon, children, collapsable, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-[#2a2a2a] rounded-xl overflow-hidden shadow-lg border border-white/5`}
        >
            <div 
                className={`p-5 flex items-center justify-between cursor-pointer ${collapsable && 'hover:bg-white/5 transition-colors'}`}
                onClick={() => collapsable && setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    {icon}
                    <div className="space-y-0.5">
                        <h3 className="text-sm font-black uppercase tracking-tight">{title}</h3>
                        {subtitle && <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{subtitle}</p>}
                    </div>
                </div>
                {collapsable && <ChevronDown size={18} className={`text-blue-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-5 pb-5 border-t border-white/5"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const InfoRow = ({ icon, text }) => (
    <div className="flex items-start gap-4 group cursor-default">
        <div className="text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity pt-0.5">
            {icon}
        </div>
        <p className="text-[12px] font-bold text-slate-300 tracking-tight leading-none pt-1">
            {text}
        </p>
    </div>
);

const ProfileInput = ({ label, ...props }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">{label}</label>
        <input 
            {...props}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
        />
    </div>
);

export default Profile;