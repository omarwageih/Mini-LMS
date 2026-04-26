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
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                        <UserPlus className="text-[#a78bfa]" size={32} />
                        Manage Assistants
                    </h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-11">Add, Remove & Assign to Courses</p>
                </div>

                {/* Message */}
                {msg.text && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {msg.text}
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Add Assistant Form */}
                    <div className="glass-card p-8 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                            <UserPlus size={20} className="text-[#a78bfa]" /> Add New Assistant
                        </h3>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <input type="text" placeholder="Full Name" required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})}
                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-white" />
                            <input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-white" />
                            <input type="password" placeholder="Password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-white" />
                            <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-[#a78bfa] to-[#818cf8] text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm tracking-widest uppercase">
                                {loading ? 'Adding...' : 'Add Assistant'}
                            </button>
                        </form>
                    </div>

                    {/* Assign to Course */}
                    <div className="glass-card p-8 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                            <Link2 size={20} className="text-cyan-500" /> Assign to Course
                        </h3>
                        <form onSubmit={handleAssign} className="space-y-4">
                            <select value={assignForm.assistantID} onChange={e => setAssignForm({...assignForm, assistantID: e.target.value})} required
                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-white">
                                <option value="">Select Assistant</option>
                                {assistants.map(a => <option key={a.AssistantID} value={a.AssistantID}>{a.FullName}</option>)}
                            </select>
                            <select value={assignForm.courseID} onChange={e => setAssignForm({...assignForm, courseID: e.target.value})} required
                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-white">
                                <option value="">Select Course</option>
                                {courses.map(c => <option key={c.CourseID} value={c.CourseID}>{c.CourseName}</option>)}
                            </select>
                            <button type="submit" className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm tracking-widest uppercase">
                                Assign to Course
                            </button>
                        </form>
                    </div>
                </div>

                {/* Assistants List */}
                <div className="glass-card overflow-hidden border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 shadow-xl">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">All Assistants ({assistants.length})</h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {assistants.length === 0 ? (
                            <p className="p-8 text-center text-slate-400 text-sm italic">No assistants found</p>
                        ) : assistants.map(a => (
                            <div key={a.AssistantID} className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#a78bfa]/10 text-[#a78bfa] flex items-center justify-center font-black text-sm">
                                        {a.FullName?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 dark:text-white">{a.FullName}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{a.Email}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(a.UserID)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ManageAssistants;
