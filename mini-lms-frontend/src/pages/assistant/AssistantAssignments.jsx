import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiGet, apiPost } from '../../api';

const AssistantAssignments = () => {
    const [courses, setCourses] = useState([]);
    const [form, setForm] = useState({ courseID: '', title: '', maxScore: '', deadline: '' });
    const [msg, setMsg] = useState({ text: '', type: '' });

    useEffect(() => {
        const load = async () => {
            try { setCourses(await apiGet('/assistant/courses')); } catch (err) { console.error(err); }
        };
        load();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await apiPost('/assistant/assignments', form);
            setMsg({ text: 'Assignment created successfully!', type: 'success' });
            setForm({ courseID: '', title: '', maxScore: '', deadline: '' });
        } catch (err) { setMsg({ text: err.message, type: 'error' }); }
    };

    const inputClass = "w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-white";

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen pb-20 pt-10 px-4 sm:px-10">
            <div className="max-w-3xl mx-auto space-y-10">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                        <ClipboardList className="text-cyan-500" size={32} />
                        Create Assignment
                    </h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-11">For Your Assigned Courses Only</p>
                </div>

                {msg.text && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {msg.text}
                    </motion.div>
                )}

                <div className="glass-card p-8 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <select value={form.courseID} onChange={e => setForm({...form, courseID: e.target.value})} required className={inputClass}>
                            <option value="">Select Course</option>
                            {courses.map(c => <option key={c.CourseID} value={c.CourseID}>{c.CourseName}</option>)}
                        </select>
                        <input type="text" placeholder="Assignment Title" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className={inputClass} />
                        <input type="number" step="0.01" placeholder="Max Score" required value={form.maxScore} onChange={e => setForm({...form, maxScore: e.target.value})} className={inputClass} />
                        <input type="datetime-local" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className={inputClass} />
                        <button type="submit" className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm tracking-widest uppercase">
                            Create Assignment
                        </button>
                    </form>
                </div>
            </div>
        </motion.div>
    );
};

export default AssistantAssignments;
