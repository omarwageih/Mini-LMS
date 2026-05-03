import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Layers, FileText, Video, Calendar, AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import { apiGet, apiPost } from '../../api';

const ManageCourses = () => {
    const [courses, setCourses] = useState([]);
    const [courseForm, setCourseForm] = useState({ courseName: '', maxMarks: '100' });
    const [weekForm, setWeekForm] = useState({ courseID: '', weekNumber: '', title: '' });
    const [lectureForm, setLectureForm] = useState({ courseID: '', title: '', date: '', startTime: '', endTime: '' });
    const [assignmentForm, setAssignmentForm] = useState({ courseID: '', title: '', maxScore: '', deadline: '' });
    const [materialForm, setMaterialForm] = useState({ weekID: '', title: '' });
    const [msg, setMsg] = useState({ text: '', type: '' });

    useEffect(() => { loadCourses(); }, []);

    const loadCourses = async () => {
        try {
            const data = await apiGet('/instructor/courses');
            setCourses(data);
        } catch (err) { console.error(err); }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            await apiPost('/instructor/courses', courseForm);
            setMsg({ text: 'Course created successfully!', type: 'success' });
            setCourseForm({ courseName: '', maxMarks: '100' });
            loadCourses();
        } catch (err) { setMsg({ text: err.message, type: 'error' }); }
    };

    const handleAddWeek = async (e) => {
        e.preventDefault();
        try {
            await apiPost('/instructor/weeks', weekForm);
            setMsg({ text: 'Week added successfully!', type: 'success' });
            setWeekForm({ courseID: '', weekNumber: '', title: '' });
        } catch (err) { setMsg({ text: err.message, type: 'error' }); }
    };

    const handleAddMaterial = async (e) => {
        e.preventDefault();
        try {
            await apiPost('/instructor/materials', materialForm);
            setMsg({ text: 'Material added successfully!', type: 'success' });
            setMaterialForm({ weekID: '', title: '' });
        } catch (err) { setMsg({ text: err.message, type: 'error' }); }
    };

    const handleAddLecture = async (e) => {
        e.preventDefault();
        try {
            await apiPost('/instructor/lectures', lectureForm);
            setMsg({ text: 'Lecture added successfully!', type: 'success' });
            setLectureForm({ courseID: '', title: '', date: '', startTime: '', endTime: '' });
        } catch (err) { setMsg({ text: err.message, type: 'error' }); }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        try {
            await apiPost('/instructor/assignments', assignmentForm);
            setMsg({ text: 'Assignment created successfully!', type: 'success' });
            setAssignmentForm({ courseID: '', title: '', maxScore: '', deadline: '' });
        } catch (err) { setMsg({ text: err.message, type: 'error' }); }
    };

    const inputClass = "w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-white";

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen pb-20 pt-10 px-4 sm:px-10">
            <div className="max-w-6xl mx-auto space-y-10">
                {/* 🌌 Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-black text-[10px] mb-2 tracking-[0.4em] uppercase">
                            <BookOpen size={14} className="animate-pulse" />
                            Academic Syllabus
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic">
                            Manage <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-500">Courses</span>
                        </h1>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] ml-1 opacity-70">
                            Curriculum Design • Resource Allocation • Module Control
                        </p>
                    </div>
                </div>

                {/* 🔔 Notifications */}
                {msg.text && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`p-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} {msg.text}
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* 🏗️ Create Course */}
                    <motion.div whileHover={{ y: -5 }} className="glass-card p-10 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Plus size={80} className="text-blue-500" /></div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3 italic">
                            <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Plus size={18} /></span>
                            Create New Module
                        </h3>
                        <form onSubmit={handleCreateCourse} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Course Name</label>
                                <input type="text" placeholder="e.g. Advanced Calculus" required value={courseForm.courseName} onChange={e => setCourseForm({...courseForm, courseName: e.target.value})} className={inputClass} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Credit Mass (Max Marks)</label>
                                <input type="number" placeholder="100" required value={courseForm.maxMarks} onChange={e => setCourseForm({...courseForm, maxMarks: e.target.value})} className={inputClass} />
                            </div>
                            <button type="submit" className="w-full py-5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-black rounded-2xl shadow-xl hover:shadow-blue-500/30 transition-all text-[11px] tracking-[0.3em] uppercase mt-4">Initialize Course</button>
                        </form>
                    </motion.div>

                    {/* 📅 Add Week */}
                    <motion.div whileHover={{ y: -5 }} className="glass-card p-10 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Layers size={80} className="text-[#a78bfa]" /></div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3 italic">
                            <span className="w-8 h-8 rounded-lg bg-[#a78bfa]/10 flex items-center justify-center text-[#a78bfa]"><Layers size={18} /></span>
                            Add Study Cycle
                        </h3>
                        <form onSubmit={handleAddWeek} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Target Module</label>
                                <select value={weekForm.courseID} onChange={e => setWeekForm({...weekForm, courseID: e.target.value})} required className={inputClass + " appearance-none cursor-pointer"}>
                                    <option value="">Select Course</option>
                                    {courses.map(c => <option key={c.CourseID} value={c.CourseID}>{c.CourseName}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Index</label>
                                    <input type="number" placeholder="W01" required value={weekForm.weekNumber} onChange={e => setWeekForm({...weekForm, weekNumber: e.target.value})} className={inputClass} />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Cycle Title</label>
                                    <input type="text" placeholder="Introduction to Logic" required value={weekForm.title} onChange={e => setWeekForm({...weekForm, title: e.target.value})} className={inputClass} />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-5 bg-gradient-to-r from-[#a78bfa] to-[#818cf8] text-white font-black rounded-2xl shadow-xl transition-all text-[11px] tracking-[0.3em] uppercase mt-4">Append Study Week</button>
                        </form>
                    </motion.div>

                    {/* 📄 Add Material */}
                    <motion.div whileHover={{ y: -5 }} className="glass-card p-10 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><FileText size={80} className="text-blue-500" /></div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3 italic">
                            <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><FileText size={18} /></span>
                            Upload Resource
                        </h3>
                        <form onSubmit={handleAddMaterial} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Internal Week ID</label>
                                <input type="number" placeholder="Check Week Roster" required value={materialForm.weekID} onChange={e => setMaterialForm({...materialForm, weekID: e.target.value})} className={inputClass} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Resource Label</label>
                                <input type="text" placeholder="Lecture 01 Notes" required value={materialForm.title} onChange={e => setMaterialForm({...materialForm, title: e.target.value})} className={inputClass} />
                            </div>
                            <button type="submit" className="w-full py-5 bg-gradient-to-r from-blue-500 to-sky-500 text-white font-black rounded-2xl shadow-xl transition-all text-[11px] tracking-[0.3em] uppercase mt-4">Inject Material</button>
                        </form>
                    </motion.div>

                    {/* 🎥 Add Lecture */}
                    <motion.div whileHover={{ y: -5 }} className="glass-card p-10 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Video size={80} className="text-emerald-500" /></div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3 italic">
                            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Video size={18} /></span>
                            Schedule Session
                        </h3>
                        <form onSubmit={handleAddLecture} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Module Selection</label>
                                <select value={lectureForm.courseID} onChange={e => setLectureForm({...lectureForm, courseID: e.target.value})} required className={inputClass + " appearance-none cursor-pointer"}>
                                    <option value="">Select Course</option>
                                    {courses.map(c => <option key={c.CourseID} value={c.CourseID}>{c.CourseName}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Session Title</label>
                                <input type="text" placeholder="Live Q&A Session" required value={lectureForm.title} onChange={e => setLectureForm({...lectureForm, title: e.target.value})} className={inputClass} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Timeline</label>
                                    <input type="date" required value={lectureForm.date} onChange={e => setLectureForm({...lectureForm, date: e.target.value})} className={inputClass} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-6">
                                    <input type="time" value={lectureForm.startTime} onChange={e => setLectureForm({...lectureForm, startTime: e.target.value})} className={inputClass} />
                                    <input type="time" value={lectureForm.endTime} onChange={e => setLectureForm({...lectureForm, endTime: e.target.value})} className={inputClass} />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-2xl shadow-xl transition-all text-[11px] tracking-[0.3em] uppercase mt-4">Broadcast Lecture</button>
                        </form>
                    </motion.div>

                    {/* 📝 Create Assignment */}
                    <motion.div whileHover={{ y: -5 }} className="glass-card p-10 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 relative overflow-hidden group lg:col-span-2">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Calendar size={120} className="text-orange-500" /></div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3 italic">
                            <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500"><Calendar size={18} /></span>
                            Define Task Parameter
                        </h3>
                        <form onSubmit={handleCreateAssignment} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Target Course</label>
                                <select value={assignmentForm.courseID} onChange={e => setAssignmentForm({...assignmentForm, courseID: e.target.value})} required className={inputClass + " appearance-none cursor-pointer"}>
                                    <option value="">Select Course</option>
                                    {courses.map(c => <option key={c.CourseID} value={c.CourseID}>{c.CourseName}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Task Descriptor</label>
                                <input type="text" placeholder="Midterm Assignment" required value={assignmentForm.title} onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})} className={inputClass} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Yield Ceiling (Max Pts)</label>
                                <input type="number" step="0.01" placeholder="20.00" required value={assignmentForm.maxScore} onChange={e => setAssignmentForm({...assignmentForm, maxScore: e.target.value})} className={inputClass} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Cutoff Time (Deadline)</label>
                                <input type="datetime-local" value={assignmentForm.deadline} onChange={e => setAssignmentForm({...assignmentForm, deadline: e.target.value})} className={inputClass} />
                            </div>
                            <button type="submit" className="md:col-span-2 w-full py-5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-black rounded-2xl shadow-xl transition-all text-[11px] tracking-[0.3em] uppercase mt-4">Deploy Assignment</button>
                        </form>
                    </motion.div>
                </div>

                {/* Courses List */}
                <div className="glass-card overflow-hidden border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 shadow-xl">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">All Courses ({courses.length})</h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {courses.length === 0 ? (
                            <p className="p-8 text-center text-slate-400 text-sm italic">No courses found</p>
                        ) : courses.map(c => (
                            <div key={c.CourseID} className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                                        <BookOpen size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 dark:text-white">{c.CourseName}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Max: {c.Max_Marks} pts</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-slate-400 italic">{c.InstructorName}</span>
                                    <Link
                                        to={`/instructor/courses/${c.CourseID}`}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 border border-cyan-500/20 hover:border-cyan-500"
                                    >
                                        <Eye size={14} /> View Course
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ManageCourses;
