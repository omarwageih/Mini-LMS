import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, CheckCircle2, Upload, FileText } from 'lucide-react';
import { studentAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { SkeletonCard } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';
import SearchFilter from '../components/SearchFilter';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 6;

const Assignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(null);
    const [search, setSearch] = useState('');
    const [filterValues, setFilterValues] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const fileInputRef = useRef({});
    const { showToast } = useToast();

    useEffect(() => { loadAssignments(); }, []);

    const loadAssignments = async () => {
        try {
            const response = await studentAPI.getAssignments();
            setAssignments(response.data);
        } catch (err) {
            showToast('Failed to load assignments', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (assignmentId) => {
        const file = fileInputRef.current[assignmentId]?.files[0];
        if (!file) {
            showToast('Please select a file (PDF or JPG)', 'error');
            return;
        }

        setUploading(assignmentId);
        try {
            const formData = new FormData();
            formData.append('assignmentId', assignmentId);
            formData.append('file', file);
            await studentAPI.submitAssignment(formData);
            showToast('Assignment submitted successfully! 🎉', 'success');
            loadAssignments();
        } catch (err) {
            showToast(err.message || 'Submission failed', 'error');
        }
        setUploading(null);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="min-h-screen pb-20 pt-10 px-4 sm:px-10"
        >
            <div className="max-w-5xl mx-auto space-y-8">
                {/* 🌌 Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-purple-600 dark:text-[#a78bfa] font-black text-[10px] mb-2 tracking-[0.4em] uppercase">
                            <ClipboardList size={14} className="animate-pulse" />
                            Academic Tasks
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic">
                            Assignment <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-[#818cf8]">Matrix</span>
                        </h1>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] ml-1 opacity-70">
                            Deliverables • Assessment • Academic Progress
                        </p>
                    </div>
                </div>

                {/* Search & Filter */}
                {!loading && assignments.length > 0 && (
                    <SearchFilter
                        searchValue={search}
                        onSearchChange={(v) => { setSearch(v); setCurrentPage(1); }}
                        placeholder="Search assignments..."
                        filters={[{
                            label: 'Status',
                            value: 'status',
                            options: [
                                { label: 'Pending', value: 'Pending' },
                                { label: 'Submitted', value: 'Submitted' },
                            ]
                        }]}
                        filterValues={filterValues}
                        onFilterChange={(key, val) => { setFilterValues(prev => ({ ...prev, [key]: val })); setCurrentPage(1); }}
                    />
                )}

                {/* Assignments List */}
                <div className="grid grid-cols-1 gap-6">
                    {loading ? (
                        <div className="space-y-4">
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    ) : (() => {
                        let filtered = assignments;
                        if (search) {
                            const q = search.toLowerCase();
                            filtered = filtered.filter(t => t.Title?.toLowerCase().includes(q) || t.CourseName?.toLowerCase().includes(q));
                        }
                        if (filterValues.status) {
                            filtered = filtered.filter(t => t.Status === filterValues.status);
                        }
                        const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
                        const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
                        
                        if (filtered.length === 0) return (
                            <div className="py-20">
                                <EmptyState type="assignments" />
                            </div>
                        );
                        
                        return (
                            <>
                            {paginated.map((task, i) => (
                        <motion.div
                            key={task.AssignmentID}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -5 }}
                            className="glass-card p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-transparent opacity-50" />
                            
                            <div className="flex items-start gap-6">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner ${task.Status === "Submitted"
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10"
                                    : "bg-purple-500/10 text-purple-600 dark:text-[#a78bfa] border border-purple-500/10"
                                    }`}>
                                    {task.Status === "Submitted" ? <CheckCircle2 size={28} /> : <Clock size={28} />}
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter group-hover:text-purple-600 dark:group-hover:text-[#a78bfa] transition-colors leading-none">
                                        {task.Title}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                            {task.CourseName}
                                        </p>
                                        <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/10" />
                                        <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">{task.Max_Score} Points Potential</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-8 lg:gap-12">
                                <div className="space-y-1">
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Temporal Boundary</p>
                                    <p className="text-sm font-black text-slate-700 dark:text-slate-200 flex items-center gap-2 italic">
                                        {task.Deadline ? new Date(task.Deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                    </p>
                                </div>

                                {task.Score !== null && task.Score !== undefined && (
                                    <div className="space-y-1 bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/10">
                                        <p className="text-[9px] text-emerald-600/50 dark:text-emerald-500/50 font-black uppercase tracking-widest">Achieved Score</p>
                                        <p className="text-xl font-black text-emerald-500 tracking-tighter leading-none">{task.Score}</p>
                                    </div>
                                )}

                                {task.Status === "Submitted" ? (
                                    <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                        <CheckCircle2 size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Objective Completed</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg"
                                            ref={el => fileInputRef.current[task.AssignmentID] = el}
                                            className="hidden"
                                            id={`file-${task.AssignmentID}`}
                                        />
                                        <label htmlFor={`file-${task.AssignmentID}`}
                                            className="px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 cursor-pointer hover:border-purple-500 hover:text-purple-500 transition-all flex items-center gap-2 group/btn">
                                            <Upload size={14} className="group-hover/btn:-translate-y-0.5 transition-transform" /> 
                                            Select Asset
                                        </label>
                                        <button
                                            onClick={() => handleSubmit(task.AssignmentID)}
                                            disabled={uploading === task.AssignmentID}
                                            className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 text-white dark:text-slate-950 shadow-xl shadow-slate-900/10 dark:shadow-white/5 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {uploading === task.AssignmentID ? 'Uploading...' : 'Transmit Submission'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={filtered.length}
                                pageSize={PAGE_SIZE}
                            />
                            </>
                        );
                    })()}
                </div>

                {/* Footer Quote */}
                <div className="pt-20 text-center opacity-40">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.6em]">
                        Precision • Dedication • Mini LMS
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default Assignments;
