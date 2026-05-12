import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, ShieldCheck, Mail, BookOpen, ExternalLink, MoreVertical, Search, Filter, Trash2, MessageSquare, UserPlus } from 'lucide-react';
import api from '../../services/api';
import { SkeletonTable } from '../Skeletons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ParticipantsTab = ({ courseId, role = 'student' }) => {
    const navigate = useNavigate();
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Click away listener for dropdown
    useEffect(() => {
        const handleClickAway = (e) => {
            if (activeDropdown && !e.target.closest('.dropdown-container')) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickAway);
        return () => document.removeEventListener('mousedown', handleClickAway);
    }, [activeDropdown]);

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        
        // Static files are served from the root, not the /api prefix
        const base = API_URL
            .replace(/\/api\/?$/, '') // Remove /api if present
            .replace(/\/$/, '');      // Remove trailing slash
            
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${base}${cleanPath}`;
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Use the appropriate role-based endpoint
                const endpoint = `/${role}/courses/${courseId}/participants`;
                const { data } = await api.get(endpoint);
                const list = Array.isArray(data) ? data : (data.data || []);
                setParticipants(list);
            } catch (err) {
                console.error("Failed to load participants:", err);
            } finally {
                setLoading(false);
            }
        };
        if (courseId) load();
    }, [courseId, role]);

    const filteredParticipants = participants.filter(p => {
        const matchesSearch = p.FullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.Email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterRole === 'all' || 
                             (filterRole === 'instructor' && p.IsInstructor) ||
                             (filterRole === 'assistant' && p.IsAssistant) ||
                             (filterRole === 'student' && !p.IsInstructor && !p.IsAssistant);
        return matchesSearch && matchesFilter;
    });

    if (loading) return <SkeletonTable rows={5} cols={4} />;

    const isStaff = role === 'instructor' || role === 'assistant';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        {isStaff ? 'Course Roster' : 'Classmates'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {participants.length} members in this course
                    </p>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            type="text"
                            placeholder="Search members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white w-48 md:w-64"
                        />
                    </div>
                    {isStaff && (
                        <button 
                            onClick={() => navigate('/instructor/students')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center gap-2"
                        >
                            <Users size={14} /> Enroll
                        </button>
                    )}
                </div>
            </div>

            {/* View Selection: Table for Staff, Cards for Students */}
            {isStaff ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm relative">
                    <div className="overflow-x-auto overflow-y-visible">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/5">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Member</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Email</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {filteredParticipants.map((person) => (
                                    <tr key={person.UserID} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-white/10">
                                                        {person.ProfilePicture && person.ProfilePicture.trim() !== '' ? (
                                                            <img 
                                                    src={getImageUrl(person.ProfilePicture)} 
                                                    alt={person.FullName} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.FullName)}&background=random`; }}
                                                />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-950">
                                                                {person.FullName.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {!!person.IsInstructor && (
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                                            <ShieldCheck size={8} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{person.FullName}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{person.StudentCode || (person.IsInstructor ? 'EMP-' + person.UserID : 'N/A')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter ${
                                                person.IsInstructor 
                                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' 
                                                : person.IsAssistant
                                                ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500'
                                            }`}>
                                                {person.IsInstructor ? 'Instructor' : person.IsAssistant ? 'Assistant' : 'Student'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                                <Mail size={12} className="text-slate-400" />
                                                {person.Email}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 relative">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/profile/${person.UserID}`); }}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                                                    title="View Profile"
                                                >
                                                    <ExternalLink size={14} />
                                                </button>
                                                {!person.IsInstructor && (
                                                    <button 
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm(`Are you sure you want to unenroll ${person.FullName}?`)) {
                                                                try {
                                                                    await api.delete(`/instructor/courses/${courseId}/participants/${person.UserID}`);
                                                                    setParticipants(prev => prev.filter(p => p.UserID !== person.UserID));
                                                                } catch (err) {
                                                                    alert("Failed to unenroll participant: " + (err.response?.data?.message || err.message));
                                                                }
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                                                        title="Unenroll"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                                <div className="relative dropdown-container">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === person.UserID ? null : person.UserID); }}
                                                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                                                    >
                                                        <MoreVertical size={14} />
                                                    </button>
                                                    {activeDropdown === person.UserID && (
                                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/5 py-3 z-[60]">
                                                            <button 
                                                                onClick={() => { window.location.href = `mailto:${person.Email}`; setActiveDropdown(null); }}
                                                                className="w-full text-left px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                            >
                                                                <Mail size={14} /> Send Email
                                                            </button>
                                                            <button 
                                                                onClick={() => { navigate('/messages', { state: { userId: person.UserID, fullName: person.FullName } }); setActiveDropdown(null); }}
                                                                className="w-full text-left px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                            >
                                                                <MessageSquare size={14} /> Direct Message
                                                            </button>
                                                            <button 
                                                                onClick={() => { navigator.clipboard.writeText(person.UserID); setActiveDropdown(null); alert('ID Copied!'); }}
                                                                className="w-full text-left px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                            >
                                                                <ShieldCheck size={14} /> Copy User ID
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredParticipants.map((person) => (
                        <motion.div
                            key={person.UserID}
                            whileHover={{ y: -4 }}
                            className="p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
                        >
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 ring-1 ring-slate-100 dark:ring-white/5 cursor-pointer" onClick={() => navigate(`/profile/${person.UserID}`)}>
                                    {person.ProfilePicture && person.ProfilePicture.trim() !== '' ? (
                                        <img src={getImageUrl(person.ProfilePicture)} alt={person.FullName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-950">
                                            {person.FullName.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                {(!!person.IsInstructor || !!person.IsAssistant) && (
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${person.IsInstructor ? 'bg-blue-500' : 'bg-purple-500'} border-2 border-white flex items-center justify-center shadow-sm`}>
                                        <ShieldCheck size={10} className="text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                                    {person.FullName}
                                    {!!person.IsInstructor && (
                                        <span className="text-[9px] font-black bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase">Instructor</span>
                                    )}
                                    {!!person.IsAssistant && (
                                        <span className="text-[9px] font-black bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded uppercase">Assistant</span>
                                    )}
                                </h3>
                                <div className="flex flex-col mt-0.5">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                        <BookOpen size={10} />
                                        {person.IsInstructor ? 'Professor' : person.IsAssistant ? 'Teaching Assistant' : (person.Major || 'Student')}
                                    </span>
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                        <Mail size={10} />
                                        {person.Email}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default ParticipantsTab;
