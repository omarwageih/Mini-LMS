import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, CheckCircle2, XCircle, Clock, AlertCircle, 
    Search, Filter, ChevronRight, UserCheck, UserX 
} from 'lucide-react';
import { instructorAPI, assistantAPI, studentAPI } from '../../services/api';
import { SkeletonTable } from '../Skeletons';

/**
 * Unified AttendanceTab component.
 * Allows students to view their history and staff to mark student attendance.
 */
const AttendanceTab = ({ courseId, role = 'student' }) => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLectureId, setSelectedLectureId] = useState(null);
    const [showNewSession, setShowNewSession] = useState(false);
    const [newSession, setNewSession] = useState({ title: '', date: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '11:00', weekId: '' });
    const [weeks, setWeeks] = useState([]);

    const loadAttendance = async () => {
        try {
            const api = role === 'student' ? studentAPI : (role === 'instructor' ? instructorAPI : assistantAPI);
            const { data } = await api.getCourseAttendance(courseId);
            setAttendance(data || []);
            
            // If staff, also load weeks for session creation
            if (role !== 'student') {
                const content = await api.getCourseContent(courseId);
                setWeeks(content.data?.weeks || content.weeks || []);
            }
        } catch (err) {
            console.error("Load Attendance Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAttendance();
    }, [courseId, role]);

    const handleMark = async (lectureId, studentId, status) => {
        try {
            const api = role === 'instructor' ? instructorAPI : assistantAPI;
            await api.markAttendance({ lectureId, studentId, status, score: 0 });
            
            // Optimistic update
            setAttendance(prev => prev.map(a => 
                (a.LectureID === lectureId && a.StudentID === studentId) 
                ? { ...a, Status: status } 
                : a
            ));
        } catch (err) {
            console.error("Mark Attendance Error:", err);
        }
    };

    const handleAddSession = async (e) => {
        e.preventDefault();
        try {
            const api = role === 'instructor' ? instructorAPI : assistantAPI;
            await api.addLecture({ ...newSession, courseId });
            setShowNewSession(false);
            loadAttendance();
        } catch (err) {
            console.error("Add Session Error:", err);
        }
    };

    if (loading) return <SkeletonTable rows={5} cols={5} />;

    const isStaff = role === 'instructor' || role === 'assistant';

    // Grouping attendance by lecture for staff view
    const lectures = attendance.reduce((acc, curr) => {
        if (!acc[curr.LectureID]) {
            acc[curr.LectureID] = {
                id: curr.LectureID,
                title: curr.Title,
                date: curr.Date,
                students: []
            };
        }
        if (curr.StudentID) acc[curr.LectureID].students.push(curr);
        return acc;
    }, {});

    const lectureList = Object.values(lectures).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Student View
    if (!isStaff) {
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-3 space-y-4">
                        {attendance.length === 0 ? (
                            <div className="p-20 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3rem] bg-white/50 dark:bg-slate-900/20">
                                <Calendar size={40} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic">No Logs Found</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 italic">Attendance protocol has not been initialized for this session.</p>
                            </div>
                        ) : (
                            attendance.map((a, idx) => (
                                <motion.div
                                    key={a.LectureID || idx}
                                    whileHover={{ x: 4 }}
                                    className="p-6 rounded-[2rem] bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                                            a.Status === 'Present' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                            a.Status === 'Absent' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        }`}>
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase italic tracking-tight">{a.Title || 'Standard Lecture'}</h4>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">
                                                {new Date(a.Date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic ${
                                            a.Status === 'Present' ? 'bg-emerald-500/10 text-emerald-500' : 
                                            a.Status === 'Absent' ? 'bg-red-500/10 text-red-500' :
                                            'bg-amber-500/10 text-amber-500'
                                        }`}>
                                            {a.Status || 'Scheduled'}
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                    
                    <div className="space-y-6">
                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-100 italic">Integrity Index</p>
                            <h2 className="text-5xl font-black mt-3 italic tracking-tighter">
                                {attendance.length ? Math.round((attendance.filter(a => a.Status === 'Present').length / attendance.length) * 100) : 0}%
                            </h2>
                            <p className="text-[10px] font-bold text-blue-200 mt-4 leading-relaxed italic">Your attendance is synchronized with the central academic ledger.</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Staff View
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Attendance Matrix</h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest italic">Verification and Logging Terminal</p>
                </div>
                <button 
                    onClick={() => setShowNewSession(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 italic"
                >
                    <Calendar size={14} /> New Session
                </button>
            </div>

            {showNewSession && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-blue-500/20 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <form onSubmit={handleAddSession} className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Session Title</label>
                            <input type="text" required placeholder="Lecture Title..." value={newSession.title} onChange={e => setNewSession({...newSession, title: e.target.value})} className="w-full p-4 bg-slate-100 dark:bg-white/5 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-bold" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Date</label>
                            <input type="date" required value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} className="w-full p-4 bg-slate-100 dark:bg-white/5 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-bold" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Week</label>
                            <select required value={newSession.weekId} onChange={e => setNewSession({...newSession, weekId: e.target.value})} className="w-full p-4 bg-slate-100 dark:bg-white/5 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-bold">
                                <option value="">Select Week</option>
                                {weeks.map(w => <option key={w.WeekID} value={w.WeekID}>Week {w.WeekNumber}: {w.Title}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 p-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic">Create</button>
                            <button type="button" onClick={() => setShowNewSession(false)} className="p-4 bg-slate-100 dark:bg-white/10 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest italic">Cancel</button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Lectures List */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 mb-2 italic">Session Logs</h3>
                    {lectureList.length === 0 ? (
                        <div className="p-10 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem] opacity-50">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No sessions recorded</p>
                        </div>
                    ) : lectureList.map((l) => (
                        <button
                            key={l.id}
                            onClick={() => setSelectedLectureId(l.id)}
                            className={`w-full text-left p-6 rounded-[2rem] border transition-all flex items-center justify-between group ${
                                selectedLectureId === l.id 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' 
                                : 'bg-white dark:bg-slate-900/40 border-slate-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-500/30'
                            }`}
                        >
                            <div>
                                <h4 className={`text-sm font-black uppercase italic tracking-tight ${selectedLectureId === l.id ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                                    {l.title || 'Lecture Session'}
                                </h4>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 italic ${selectedLectureId === l.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                    {new Date(l.date).toLocaleDateString()}
                                </p>
                            </div>
                            <ChevronRight size={18} className={selectedLectureId === l.id ? 'text-white' : 'text-slate-300'} />
                        </button>
                    ))}
                </div>

                {/* Students Roster for Selected Lecture */}
                <div className="md:col-span-2">
                    {selectedLectureId ? (
                        (() => {
                            const selectedLecture = lectureList.find(l => l.id === selectedLectureId);
                            if (!selectedLecture) return null;
                            return (
                                <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
                                    <div className="p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest italic">{selectedLecture.title} — Roster</h3>
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-4 py-2 rounded-full italic">
                                            {selectedLecture.students.length} Entries
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Student</th>
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center italic">Status</th>
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right italic">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                                {selectedLecture.students.map((s) => (
                                                    <tr key={`${selectedLecture.id}-${s.StudentID}`} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                                        <td className="px-8 py-6">
                                                            <p className="text-sm font-black text-slate-800 dark:text-white uppercase italic">{s.StudentName || 'Unknown Student'}</p>
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic ${
                                                                s.Status === 'Present' ? 'bg-emerald-500/10 text-emerald-500' : 
                                                                s.Status === 'Absent' ? 'bg-red-500/10 text-red-500' :
                                                                'bg-amber-500/10 text-amber-500'
                                                            }`}>
                                                                {s.Status || 'Unmarked'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button 
                                                                    onClick={() => handleMark(selectedLecture.id, s.StudentID, 'Present')}
                                                                    className={`p-2 rounded-lg transition-all ${s.Status === 'Present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-emerald-500'}`}
                                                                >
                                                                    <UserCheck size={16} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleMark(selectedLecture.id, s.StudentID, 'Absent')}
                                                                    className={`p-2 rounded-lg transition-all ${s.Status === 'Absent' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500'}`}
                                                                >
                                                                    <UserX size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        <div className="p-20 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3rem] bg-white/50 dark:bg-slate-900/20">
                            <Filter size={40} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic">No Session Selected</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 italic">Select a session from the list to manage student logging.</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default AttendanceTab;
