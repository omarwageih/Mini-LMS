import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Trash2, Link2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../../api';

const ManageAssistants = () => {
    const [assistants, setAssistants] = useState([]);
    const [courses, setCourses] = useState([]);
    const [form, setForm] = useState({ fullName: '', email: '', password: '' });
    const [assignForm, setAssignForm] = useState({ assistantID: '', courseID: '' });
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [a, c] = await Promise.all([
                apiGet('/instructor/assistants'),
                apiGet('/instructor/courses')
            ]);
            setAssistants(a);
            setCourses(c);
        } catch (err) { console.error(err); }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiPost('/instructor/assistants', form);
            setMsg({ text: 'Assistant added successfully!', type: 'success' });
            setForm({ fullName: '', email: '', password: '' });
            loadData();
        } catch (err) { setMsg({ text: err.message, type: 'error' }); }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await apiDelete(`/instructor/assistants/${id}`);
            setMsg({ text: 'Assistant deleted successfully!', type: 'success' });
            loadData();
        } catch (err) { setMsg({ text: err.message, type: 'error' }); }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        try {
            await apiPost('/instructor/assistants/assign-course', assignForm);
            setMsg({ text: 'Assistant assigned to course successfully!', type: 'success' });
            setAssignForm({ assistantID: '', courseID: '' });
        } catch (err) { setMsg({ text: err.message, type: 'error' }); }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen pb-20 pt-10 px-4 sm:px-10">
            <div className="max-w-6xl mx-auto space-y-10">
                {/* 🌌 Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-purple-600 dark:text-[#a78bfa] font-black text-[10px] mb-2 tracking-[0.4em] uppercase">
                            <UserPlus size={14} className="animate-pulse" />
                            Faculty Personnel
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic">
                            Manage <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">Assistants</span>
                        </h1>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] ml-1 opacity-70">
                            Teaching Support • Course Alignment • Staff Logistics
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* ➕ Add Assistant Form */}
                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="glass-card p-10 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <UserPlus size={80} className="text-purple-500" />
                        </div>
                        
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3 italic">
                            <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <UserPlus size={18} />
                            </span>
                            Register Assistant
                        </h3>
                        
                        <form onSubmit={handleAdd} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
                                <input type="text" placeholder="e.g. Eng. Sara" required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-[1.5rem] outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all text-sm font-bold text-slate-800 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Email Address</label>
                                <input type="email" placeholder="e.g. sara@must.edu" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-[1.5rem] outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all text-sm font-bold text-slate-800 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Secure Password</label>
                                <input type="password" placeholder="••••••••" required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-[1.5rem] outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all text-sm font-bold text-slate-800 dark:text-white" />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-5 bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 text-white font-black rounded-2xl shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all text-[11px] tracking-[0.3em] uppercase mt-4">
                                {loading ? 'Updating Identity Pool...' : 'Add To Faculty'}
                            </button>
                        </form>
                    </motion.div>

                    {/* 🔗 Assign to Course Form */}
                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="glass-card p-10 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Link2 size={80} className="text-cyan-500" />
                        </div>

                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3 italic">
                            <span className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                                <Link2 size={18} />
                            </span>
                            Course Assignment
                        </h3>

                        <form onSubmit={handleAssign} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Target Assistant</label>
                                <select value={assignForm.assistantID} onChange={e => setAssignForm({...assignForm, assistantID: e.target.value})} required
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-[1.5rem] outline-none focus:border-cyan-500 transition-all text-sm font-bold text-slate-800 dark:text-white appearance-none cursor-pointer">
                                    <option value="">Select Personnel</option>
                                    {assistants.map(a => <option key={a.AssistantID} value={a.AssistantID}>{a.FullName}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Module Integration</label>
                                <select value={assignForm.courseID} onChange={e => setAssignForm({...assignForm, courseID: e.target.value})} required
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-[1.5rem] outline-none focus:border-cyan-500 transition-all text-sm font-bold text-slate-800 dark:text-white appearance-none cursor-pointer">
                                    <option value="">Select Course</option>
                                    {courses.map(c => <option key={c.CourseID} value={c.CourseID}>{c.CourseName}</option>)}
                                </select>
                            </div>
                            <button type="submit" className="w-full py-5 bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-500 text-white font-black rounded-2xl shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all text-[11px] tracking-[0.3em] uppercase mt-8">
                                Link to Syllabus
                            </button>
                        </form>
                    </motion.div>
                </div>

                {/* 📋 Assistants List */}
                <div className="glass-card overflow-hidden border border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/40 shadow-2xl rounded-[2.5rem]">
                    <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] italic">Faculty Support Staff</h3>
                        </div>
                        <span className="px-4 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest border border-slate-200 dark:border-white/10">
                            {assistants.length} Active
                        </span>
                    </div>
                    
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {assistants.length === 0 ? (
                            <div className="p-20 text-center space-y-4">
                                <UserPlus size={40} className="mx-auto text-slate-200 dark:text-white/10" />
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">No personnel records detected</p>
                            </div>
                        ) : assistants.map((a, index) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={a.AssistantID} 
                                className="flex items-center justify-between p-6 sm:p-8 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-xl border border-purple-500/10 shadow-inner group-hover:scale-105 transition-transform">
                                        {a.FullName?.charAt(0)}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">{a.FullName}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
                                            <p className="text-[11px] text-slate-400 font-bold tracking-tight lowercase">{a.Email}</p>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDelete(a.UserID)} 
                                    className="w-12 h-12 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500 rounded-2xl transition-all hover:shadow-lg hover:shadow-red-500/20 active:scale-90"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ManageAssistants;
