import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Trash2, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../../api';

const ManageStudents = () => {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [form, setForm] = useState({ fullName: '', email: '', password: '' });
    const [enrollForm, setEnrollForm] = useState({ studentID: '', courseID: '' });
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);

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
            setMsg({ text: 'Student added successfully!', type: 'success' });
            setForm({ fullName: '', email: '', password: '' });
            loadData();
        } catch (err) { setMsg({ text: err.message, type: 'error' }); }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await apiDelete(`/instructor/students/${id}`);
            setMsg({ text: 'Student deleted successfully!', type: 'success' });
            loadData();
        } catch (err) { setMsg({ text: err.message, type: 'error' }); }
    };

    const handleEnroll = async (e) => {
        e.preventDefault();
        try {
            await apiPost('/instructor/students/enroll', enrollForm);
            setMsg({ text: 'Student enrolled successfully!', type: 'success' });
            setEnrollForm({ studentID: '', courseID: '' });
        } catch (err) { setMsg({ text: err.message, type: 'error' }); }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen pb-20 pt-10 px-4 sm:px-10">
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                        <Users className="text-blue-500" size={32} />
                        Manage Students
                    </h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-11">Add, Remove & Enroll Students</p>
                </div>

                {/* Message */}
                {msg.text && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {msg.text}
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Add Student Form */}
                    <div className="glass-card p-8 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                            <UserPlus size={20} className="text-blue-500" /> Add New Student
                        </h3>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <input type="text" placeholder="Full Name" required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})}
                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-white" />
                            <input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-white" />
                            <input type="password" placeholder="Password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-white" />
                            <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm tracking-widest uppercase">
                                {loading ? 'Adding...' : 'Add Student'}
                            </button>
                        </form>
                    </div>

                    {/* Enroll Student Form */}
                    <div className="glass-card p-8 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                            <BookOpen size={20} className="text-cyan-500" /> Enroll in Course
                        </h3>
                        <form onSubmit={handleEnroll} className="space-y-4">
                            <select value={enrollForm.studentID} onChange={e => setEnrollForm({...enrollForm, studentID: e.target.value})} required
                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-white">
                                <option value="">Select Student</option>
                                {students.map(s => <option key={s.StudentID} value={s.StudentID}>{s.FullName}</option>)}
                            </select>
                            <select value={enrollForm.courseID} onChange={e => setEnrollForm({...enrollForm, courseID: e.target.value})} required
                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-white">
                                <option value="">Select Course</option>
                                {courses.map(c => <option key={c.CourseID} value={c.CourseID}>{c.CourseName}</option>)}
                            </select>
                            <button type="submit" className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm tracking-widest uppercase">
                                Enroll Student
                            </button>
                        </form>
                    </div>
                </div>

                {/* Students List */}
                <div className="glass-card overflow-hidden border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 shadow-xl">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">All Students ({students.length})</h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {students.length === 0 ? (
                            <p className="p-8 text-center text-slate-400 text-sm italic">No students found</p>
                        ) : students.map(s => (
                            <div key={s.StudentID} className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-sm">
                                        {s.FullName?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 dark:text-white">{s.FullName}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{s.Email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-[#a78bfa] bg-[#a78bfa]/10 px-3 py-1 rounded-lg">GPA: {s.GPA || 'N/A'}</span>
                                    <button onClick={() => handleDelete(s.UserID)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ManageStudents;
