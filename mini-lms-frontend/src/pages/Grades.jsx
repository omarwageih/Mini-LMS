import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { apiGet } from '../services/api';
import { SkeletonTable } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';
import SearchFilter from '../components/SearchFilter';
import Pagination from '../components/Pagination';
import { exportToCSV, exportToPDF } from '../utils/exportData';

const PAGE_SIZE = 8;

const Grades = () => {
    const [grades, setGrades] = useState([]);
    const [dashData, setDashData] = useState({ gpa: 0, courseCount: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterValues, setFilterValues] = useState({});
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const load = async () => {
            try {
                const [g, d] = await Promise.all([
                    apiGet('/student/grades'),
                    apiGet('/student/dashboard')
                ]);
                setGrades(g);
                setDashData(d);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const getStatus = (score) => {
        if (!score && score !== 0) return 'N/A';
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Very Good';
        if (score >= 70) return 'Good';
        if (score >= 60) return 'Pass';
        return 'Fail';
    };

    const filters = [
        {
            label: 'All Standing',
            value: 'standing',
            options: [
                { label: 'Excellent', value: 'Excellent' },
                { label: 'Very Good', value: 'Very Good' },
                { label: 'Good', value: 'Good' },
                { label: 'Pass', value: 'Pass' },
                { label: 'Fail', value: 'Fail' },
            ]
        }
    ];

    // Filtered + searched data
    const filteredGrades = useMemo(() => {
        let result = grades;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(g => g.CourseName?.toLowerCase().includes(q));
        }
        if (filterValues.standing) {
            result = result.filter(g => getStatus(g.TotalScore) === filterValues.standing);
        }
        return result;
    }, [grades, search, filterValues]);

    // Pagination
    const totalPages = Math.ceil(filteredGrades.length / PAGE_SIZE);
    const paginatedGrades = filteredGrades.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1); }, [search, filterValues]);

    const handleExportCSV = () => {
        const data = filteredGrades.map(g => ({
            Course: g.CourseName,
            Assignments: g.AssignmentTotal || 0,
            Quizzes: g.QuizTotal || 0,
            Attendance: g.AttendanceTotal || 0,
            Total: g.TotalScore || 0,
            Standing: getStatus(g.TotalScore)
        }));
        exportToCSV(data, 'grades_transcript');
    };

    const handleExportPDF = () => {
        const data = filteredGrades.map(g => ({
            Course: g.CourseName,
            Assignments: g.AssignmentTotal || 0,
            Quizzes: g.QuizTotal || 0,
            Attendance: g.AttendanceTotal || 0,
            Total: g.TotalScore || 0,
            Standing: getStatus(g.TotalScore)
        }));
        exportToPDF(data, 'Academic Transcript', 'grades_transcript');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen pb-20 pt-10 px-4 sm:px-10 bg-slate-50 dark:bg-slate-950/60"
        >
            <div className="max-w-5xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                            <div className="w-2 h-8 bg-[#a78bfa] rounded-full"></div>
                            Academic Transcript
                        </h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-5">Detailed Course Performance</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-white dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center gap-6 shadow-sm">
                            <div className="text-center px-4 border-r border-slate-100 dark:border-white/10">
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Courses</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">{String(dashData.courseCount).padStart(2, '0')}</p>
                            </div>
                            <div className="text-center px-4">
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Current GPA</p>
                                <p className="text-xl font-black text-[#a78bfa] leading-none mt-1">{dashData.gpa?.toFixed(2) || '0.00'}</p>
                            </div>
                        </div>

                        {/* Export Buttons */}
                        {grades.length > 0 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleExportCSV}
                                    className="p-3 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all hover:scale-105 active:scale-95"
                                    title="Export CSV"
                                >
                                    <FileSpreadsheet size={18} />
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="p-3 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all hover:scale-105 active:scale-95"
                                    title="Export PDF"
                                >
                                    <FileText size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search & Filter Bar */}
                {!loading && grades.length > 0 && (
                    <SearchFilter
                        searchValue={search}
                        onSearchChange={setSearch}
                        placeholder="Search courses..."
                        filters={filters}
                        filterValues={filterValues}
                        onFilterChange={(key, val) => setFilterValues(prev => ({ ...prev, [key]: val }))}
                    />
                )}

                {/* Grades Table Card */}
                {loading ? (
                    <SkeletonTable rows={4} cols={6} />
                ) : filteredGrades.length === 0 ? (
                    <EmptyState type="grades" />
                ) : (
                <div className="glass-card overflow-hidden border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Course Details</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignments</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quizzes</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Attendance</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Final</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Standing</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {paginatedGrades.map((item) => (
                                    <tr key={item.GradeID} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-default">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/10 text-[#a78bfa] flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <BookOpen size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{item.CourseName}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Course #{item.CourseID}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-sm font-bold text-slate-600 dark:text-slate-300 text-center">{item.AssignmentTotal || 0}</td>
                                        <td className="p-6 text-sm font-bold text-slate-600 dark:text-slate-300 text-center">{item.QuizTotal || 0}</td>
                                        <td className="p-6 text-sm font-bold text-slate-600 dark:text-slate-300 text-center">{item.AttendanceTotal || 0}</td>
                                        <td className="p-6 text-center">
                                            <span className="inline-block px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 text-sm font-black text-[#a78bfa]">
                                                {item.TotalScore || 0}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${(item.TotalScore || 0) >= 90 ? 'bg-emerald-400' : 'bg-blue-400'}`}></div>
                                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{getStatus(item.TotalScore)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 pb-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={filteredGrades.length}
                            pageSize={PAGE_SIZE}
                        />
                    </div>
                </div>
                )}

                {/* Footer Info */}
                <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    End of Official Academic Record
                </p>
            </div>
        </motion.div>
    );
};

export default Grades;
