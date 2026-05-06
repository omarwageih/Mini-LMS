import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Download, Search, Filter, Mail, ChevronRight, BookOpen } from 'lucide-react';
import { instructorAPI, assistantAPI, studentAPI } from '../../services/api';
import { SkeletonTable } from '../Skeletons';

/**
 * Unified GradesTab component for Student, Instructor, and Assistant portals.
 * Renders a summary card and breakdown for Students, 
 * and a management table with statistics for Staff (Instructor/Assistant).
 */
const GradesTab = ({ courseId, role = 'student' }) => {
    const [grades, setGrades] = useState([]);
    const [grade, setGrade] = useState(null); // For single student view
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                if (role === 'student') {
                    const { data } = await studentAPI.getGrades();
                    // Filter for this specific course
                    const courseGrade = data.find(g => String(g.CourseID) === String(courseId));
                    setGrade(courseGrade);
                } else {
                    const api = role === 'instructor' ? instructorAPI : assistantAPI;
                    const { data } = await api.getCourseGrades(courseId);
                    setGrades(data.data || data || []);
                }
            } catch (err) {
                console.error("Load Grades Error:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [courseId, role]);

    const getStatus = (score) => {
        if (!score && score !== 0) return 'N/A';
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Very Good';
        if (score >= 70) return 'Good';
        if (score >= 60) return 'Pass';
        return 'Fail';
    };

    if (loading) return <SkeletonTable rows={5} cols={5} />;

    // --- Student View ---
    if (role === 'student') {
        if (!grade) {
            return (
                <div className="p-16 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3rem] bg-white/50 dark:bg-slate-900/20 backdrop-blur-sm">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 border border-slate-100 dark:border-white/10">
                        <Award size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic">No Performance Data</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-2 italic">Your final grade index is currently being calibrated.</p>
                </div>
            );
        }

        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Score Card */}
                    <div className="md:col-span-2 p-10 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] italic">Academic standing</p>
                                <h2 className="text-6xl font-black mt-4 italic tracking-tighter">
                                    {grade.TotalScore || '0.00'}<span className="text-2xl opacity-60 ml-2">/ 100</span>
                                </h2>
                            </div>
                            <div className="p-5 bg-white/20 rounded-[2rem] backdrop-blur-md border border-white/20">
                                <TrendingUp size={32} />
                            </div>
                        </div>
                        <div className="mt-12 flex items-center gap-6">
                            <div className="px-6 py-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                <p className="text-[9px] text-blue-200 font-black uppercase tracking-widest">Status</p>
                                <p className="font-black text-lg uppercase italic">{getStatus(grade.TotalScore)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-100 dark:border-white/5 shadow-sm flex flex-col justify-between group">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic">Grade Index</h3>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-2 italic leading-relaxed">Your performance is calculated based on assignments, assessments, and attendance protocols.</p>
                        </div>
                        <button 
                            onClick={() => alert("Audit Request Logged: Your academic index will be reviewed by the registrar.")}
                            className="w-full mt-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 italic shadow-xl"
                        >
                            Request Audit <ChevronRight size={14} />
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-slate-50 dark:border-white/5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                            <BookOpen size={20} />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest italic">Components Breakdown</h3>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-white/5">
                        {[
                            { label: 'Practical Assignments', val: grade.AssignmentTotal || 0, color: 'bg-blue-500' },
                            { label: 'Midterm Assessments', val: grade.QuizTotal || 0, color: 'bg-indigo-500' },
                            { label: 'Attendance & Participation', val: grade.AttendanceTotal || 0, color: 'bg-emerald-500' },
                        ].map((item, idx) => (
                            <div key={idx} className="p-8 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest italic">{item.label}</span>
                                <div className="flex items-center gap-8">
                                    <div className="w-48 h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden hidden sm:block border border-slate-200 dark:border-white/10">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, item.val)}%` }}
                                            transition={{ duration: 1, delay: idx * 0.1 }}
                                            className={`h-full ${item.color}`}
                                        />
                                    </div>
                                    <span className="text-lg font-black text-slate-800 dark:text-white w-12 text-right italic">{item.val}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        );
    }

    // --- Staff View (Instructor/Assistant) ---
    const filteredGrades = grades.filter(g => 
        (g.FullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.Email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        avg: grades.length ? (grades.reduce((acc, curr) => acc + (curr.TotalScore || 0), 0) / grades.length).toFixed(1) : '0.0',
        highest: grades.length ? Math.max(...grades.map(g => g.TotalScore || 0)) : '0',
        lowest: grades.length ? Math.min(...grades.map(g => g.TotalScore || 0)) : '0'
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pt-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] italic">Class Average</p>
                            <h2 className="text-5xl font-black mt-2 italic tracking-tighter">
                                {stats.avg}<span className="text-xl opacity-60 ml-1">%</span>
                            </h2>
                        </div>
                        <div className="p-4 bg-white/20 rounded-[1.5rem] backdrop-blur-md border border-white/20">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                            <Award size={20} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Peak Grade</p>
                    </div>
                    <div className="flex items-end justify-between">
                        <h2 className="text-4xl font-black text-slate-800 dark:text-white italic tracking-tighter">{stats.highest}%</h2>
                        <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full uppercase tracking-widest">Top Tier</span>
                    </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center border border-slate-100 dark:border-white/10">
                            <Award size={20} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Floor Grade</p>
                    </div>
                    <div className="flex items-end justify-between">
                        <h2 className="text-4xl font-black text-slate-800 dark:text-white italic tracking-tighter">{stats.lowest}%</h2>
                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-full uppercase tracking-widest">Baseline</span>
                    </div>
                </div>
            </div>

            {/* Grades Table */}
            <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-50 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Find student performance..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-white/5 border border-transparent focus:border-blue-500/50 rounded-2xl text-sm outline-none transition-all text-slate-800 dark:text-white italic"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-3.5 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-blue-500 rounded-2xl transition-all border border-transparent hover:border-blue-500/20">
                            <Filter size={18} />
                        </button>
                        <button className="px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl italic flex items-center gap-2">
                            <Download size={14} /> Export Report
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Student Terminal</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center italic">Assignments</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center italic">Assessments</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center italic">Attendance</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right italic">Total Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {filteredGrades.map((g, idx) => (
                                <tr key={g.GradeID || g.StudentID || idx} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight italic">{g.FullName}</p>
                                            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                                                <Mail size={10} className="text-slate-300" /> {g.Email}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="text-xs font-black text-slate-600 dark:text-slate-300 italic">{g.AssignmentTotal || 0}</span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="text-xs font-black text-slate-600 dark:text-slate-300 italic">{g.QuizTotal || 0}</span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="text-xs font-black text-slate-600 dark:text-slate-300 italic">{g.AttendanceTotal || 0}%</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-black text-slate-900 dark:text-white italic">{g.TotalScore || 0}%</span>
                                            <div className="w-20 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full mt-2 overflow-hidden border border-slate-200 dark:border-white/5">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${
                                                        (g.TotalScore || 0) >= 60 
                                                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400' 
                                                        : 'bg-gradient-to-r from-red-500 to-pink-500'
                                                    }`}
                                                    style={{ width: `${g.TotalScore || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default GradesTab;
