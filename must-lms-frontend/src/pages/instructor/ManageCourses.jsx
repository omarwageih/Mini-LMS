import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Layers, FileText, Video, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
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
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                        <BookOpen className="text-cyan-500" size={32} />
                        Manage Courses
                    </h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-11">Create Courses, Add Content & Assignments</p>
                </div>

                {/* Message */}
                {msg.text && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {msg.text}
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Create Course */}
                    <div className="glass-card p-8 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                            <Plus size={20} className="text-blue-500" /> Create Course
                        </h3>
                        <form onSubmit={handleCreateCourse} className="space-y-4">
                            <input type="text" placeholder="Course Name" required value={courseForm.courseName} onChange={e => setCourseForm({...courseForm, courseName: e.target.value})} className={inputClass} />
                            <input type="number" placeholder="Max Marks (e.g. 100)" required value={courseForm.maxMarks} onChange={e => setCourseForm({...courseForm, maxMarks: e.target.value})} className={inputClass} />
                            <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm tracking-widest uppercase">
                                Create Course
                            </button>
                        </form>
                    </div>

                    {/* Add Week */}
                    <div className="glass-card p-8 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                            <Layers size={20} className="text-[#a78bfa]" /> Add Study Week
                        </h3>
                        <form onSubmit={handleAddWeek} className="space-y-4">
                            <select value={weekForm.courseID} onChange={e => setWeekForm({...weekForm, courseID: e.target.value})} required className={inputClass}>
                                <option value="">Select Course</option>
                                {courses.map(c => <option key={c.CourseID} value={c.CourseID}>{c.CourseName}</option>)}
                            </select>
                            <input type="number" placeholder="Week Number" required value={weekForm.weekNumber} onChange={e => setWeekForm({...weekForm, weekNumber: e.target.value})} className={inputClass} />
                            <input type="text" placeholder="Week Title" required value={weekForm.title} onChange={e => setWeekForm({...weekForm, title: e.target.value})} className={inputClass} />
                            <button type="submit" className="w-full py-4 bg-gradient-to-r from-[#a78bfa] to-[#818cf8] text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm tracking-widest uppercase">
                                Add Week
                            </button>
                        </form>
                    </div>

                    {/* Add Material */}
                    <div className="glass-card p-8 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                            <FileText size={20} className="text-blue-500" /> Add Material
                        </h3>
                        <form onSubmit={handleAddMaterial} className="space-y-4">
                            <input type="number" placeholder="Week ID" required value={materialForm.weekID} onChange={e => setMaterialForm({...materialForm, weekID: e.target.value})} className={inputClass} />
                            <input type="text" placeholder="Material Title" required value={materialForm.title} onChange={e => setMaterialForm({...materialForm, title: e.target.value})} className={inputClass} />
                            <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-500 to-sky-500 text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm tracking-widest uppercase">
                                Add Material
                            </button>
                        </form>
                    </div>

                    {/* Add Lecture */}
                    <div className="glass-card p-8 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                            <Video size={20} className="text-emerald-500" /> Add Lecture
                        </h3>
                        <form onSubmit={handleAddLecture} className="space-y-4">
                            <select value={lectureForm.courseID} onChange={e => setLectureForm({...lectureForm, courseID: e.target.value})} required className={inputClass}>
                                <option value="">Select Course</option>
                                {courses.map(c => <option key={c.CourseID} value={c.CourseID}>{c.CourseName}</option>)}
                            </select>
                            <input type="text" placeholder="Lecture Title" required value={lectureForm.title} onChange={e => setLectureForm({...lectureForm, title: e.target.value})} className={inputClass} />
                            <input type="date" placeholder="Date" required value={lectureForm.date} onChange={e => setLectureForm({...lectureForm, date: e.target.value})} className={inputClass} />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="time" placeholder="Start Time" value={lectureForm.startTime} onChange={e => setLectureForm({...lectureForm, startTime: e.target.value})} className={inputClass} />
                                <input type="time" placeholder="End Time" value={lectureForm.endTime} onChange={e => setLectureForm({...lectureForm, endTime: e.target.value})} className={inputClass} />
                            </div>
                            <button type="submit" className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm tracking-widest uppercase">
                                Add Lecture
                            </button>
                        </form>
                    </div>

                    {/* Create Assignment */}
                    <div className="glass-card p-8 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 lg:col-span-2">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                            <Calendar size={20} className="text-orange-500" /> Create Assignment
                        </h3>
                        <form onSubmit={handleCreateAssignment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select value={assignmentForm.courseID} onChange={e => setAssignmentForm({...assignmentForm, courseID: e.target.value})} required className={inputClass}>
                                <option value="">Select Course</option>
                                {courses.map(c => <option key={c.CourseID} value={c.CourseID}>{c.CourseName}</option>)}
                            </select>
                            <input type="text" placeholder="Assignment Title" required value={assignmentForm.title} onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})} className={inputClass} />
                            <input type="number" step="0.01" placeholder="Max Score" required value={assignmentForm.maxScore} onChange={e => setAssignmentForm({...assignmentForm, maxScore: e.target.value})} className={inputClass} />
                            <input type="datetime-local" value={assignmentForm.deadline} onChange={e => setAssignmentForm({...assignmentForm, deadline: e.target.value})} className={inputClass} />
                            <button type="submit" className="md:col-span-2 w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm tracking-widest uppercase">
                                Create Assignment
                            </button>
                        </form>
                    </div>
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
                                <span className="text-xs font-bold text-slate-400 italic">{c.InstructorName}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ManageCourses;
