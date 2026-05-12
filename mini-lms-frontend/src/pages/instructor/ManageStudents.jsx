import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Trash2, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ManageStudents = () => {
    const { showToast } = useToast();
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [form, setForm] = useState({ fullName: '', email: '', password: '' });
    const [enrollForm, setEnrollForm] = useState({ studentId: '', courseId: '' });
    const [loading, setLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [s, c] = await Promise.all([
                apiGet('/instructor/students'),
                apiGet('/instructor/courses')
            ]);
            setStudents(s);
            setCourses(c);
        } catch (err) { console.error(err); }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiPost('/instructor/students', form);
            showToast('Student added successfully!', 'success');
            setForm({ fullName: '', email: '', password: '' });
            loadData();
        } catch (err) { showToast(err.response?.data?.message || err.message, 'error'); }
        setLoading(false);
    };

    const handleDelete = (studentId) => {
        apiDelete(`/instructor/students/${studentId}`)
            .then(() => {
                showToast('Student deleted successfully!', 'success');
                loadData();
            })
            .catch((error) => {
                console.error('Delete failed:', error);
                const msg = error?.response?.data?.message || error?.message || 'Unknown error occurred';
                showToast(`Delete failed: ${msg}`, 'error');
            })
            .finally(() => {
                setConfirmDelete(null);
            });
    };

    const handleEnroll = async (e) => {
        e.preventDefault();
        try {
            await apiPost('/instructor/students/enroll', enrollForm);
            showToast('Student enrolled successfully!', 'success');
            setEnrollForm({ studentId: '', courseId: '' });
        } catch (err) { showToast(err.message, 'error'); }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen pb-20 pt-10 px-4 sm:px-10">
            <div className="max-w-6xl mx-auto space-y-10">
                {/* 🌌 Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 font-black text-[10px] mb-2 tracking-[0.4em] uppercase">
                            <Users size={14} className="animate-pulse" />
                            Academic Registry
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic">
                            Manage <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Students</span>
                        </h1>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] ml-1 opacity-70">
                            Roster Management • Enrollment Oversight • Academic Control
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* ➕ Add Student Form */}
                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="glass-card p-10 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <UserPlus size={80} className="text-blue-500" />
                        </div>
                        
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3 italic">
                            <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <UserPlus size={18} />
                            </span>
                            Add New Student
                        </h3>
                        
                        <form onSubmit={handleAdd} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
                                <input type="text" placeholder="e.g. Ahmed Ali" required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-[1.5rem] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-bold text-slate-800 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Email Address</label>
                                <input type="email" placeholder="e.g. student@mini.edu" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-[1.5rem] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-bold text-slate-800 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">System Password</label>
                                <input type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" required minLength={8} value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-[1.5rem] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-bold text-slate-800 dark:text-white" />
                                <p className="text-[9px] text-slate-400 ml-2">Must be 8+ chars with at least 1 uppercase letter and 1 number</p>
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all text-[11px] tracking-[0.3em] uppercase mt-4">
                                {loading ? 'Processing Registry...' : 'Register Student'}
                            </button>
                        </form>
                    </motion.div>

                    {/* 🎓 Enroll Student Form */}
                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="glass-card p-10 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <BookOpen size={80} className="text-cyan-500" />
                        </div>

                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3 italic">
                            <span className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                                <BookOpen size={18} />
                            </span>
                            Course Enrollment
                        </h3>

                        <form onSubmit={handleEnroll} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Target Student</label>
                                <select value={enrollForm.studentId} onChange={e => setEnrollForm({...enrollForm, studentId: e.target.value})} required
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-[1.5rem] outline-none focus:border-cyan-500 transition-all text-sm font-bold text-slate-800 dark:text-white appearance-none cursor-pointer">
                                    <option value="">Select Candidate</option>
                                    {students.map(s => <option key={s.StudentID} value={s.StudentID}>{s.FullName}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Academic Course</label>
                                <select value={enrollForm.courseId} onChange={e => setEnrollForm({...enrollForm, courseId: e.target.value})} required
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-[1.5rem] outline-none focus:border-cyan-500 transition-all text-sm font-bold text-slate-800 dark:text-white appearance-none cursor-pointer">
                                    <option value="">Select Module</option>
                                    {courses.map(c => <option key={c.CourseID} value={c.CourseID}>{c.CourseName}</option>)}
                                </select>
                            </div>
                            <button type="submit" className="w-full py-5 bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-500 text-white font-black rounded-2xl shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all text-[11px] tracking-[0.3em] uppercase mt-8">
                                Confirm Enrollment
                            </button>
                        </form>
                    </motion.div>
                </div>

                {/* 📋 Students List */}
                <div className="glass-card overflow-hidden border border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/40 shadow-2xl rounded-[2.5rem]">
                    <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] italic">Active Student Roster</h3>
                        </div>
                        <span className="px-4 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest border border-slate-200 dark:border-white/10">
                            {students.length} Registered
                        </span>
                    </div>
                    
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {students.length === 0 ? (
                            <div className="p-20 text-center space-y-4">
                                <Users size={40} className="mx-auto text-slate-200 dark:text-white/10" />
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">No student records detected in the local database</p>
                            </div>
                        ) : students.map((s, index) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={s.StudentID} 
                                className="flex items-center justify-between p-6 sm:p-8 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-black text-xl border border-blue-500/10 shadow-inner group-hover:scale-105 transition-transform">
                                        {s.FullName?.charAt(0)}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">{s.FullName}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
                                            <p className="text-[11px] text-slate-400 font-bold tracking-tight lowercase">{s.Email}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                    <div className="hidden sm:flex flex-col items-end gap-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Performance</span>
                                        <span className="text-xs font-black text-blue-600 dark:text-cyan-400 uppercase">GPA: {s.GPA || '0.00'}</span>
                                    </div>
                                    
                                    <button 
                                        type="button"
                                        onClick={() => setConfirmDelete({ id: s.UserID, name: s.FullName })}
                                        className="w-12 h-12 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500 rounded-2xl transition-all hover:shadow-lg hover:shadow-red-500/20 active:scale-90"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Custom Confirm Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 mb-6 mx-auto">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-black text-center text-slate-800 dark:text-white mb-2 uppercase italic tracking-tight">Revoke Access</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-8">
                            Are you sure you want to permanently remove <span className="font-bold text-slate-700 dark:text-slate-200">"{confirmDelete.name}"</span>? All their data will be purged.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors uppercase text-xs tracking-widest"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleDelete(confirmDelete.id)}
                                className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors uppercase text-xs tracking-widest shadow-lg shadow-red-500/30"
                            >
                                Purge
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default ManageStudents;
