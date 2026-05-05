import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, FileText, Video, ClipboardList, Target,
    ChevronRight, ChevronDown, X, Calendar, BookOpen, Users, Award
} from 'lucide-react';
import { apiGet } from '../services/api';
import ReactPlayer from 'react-player';
import ParticipantsTab from '../components/common/ParticipantsTab';
import GradesTab from '../components/common/GradesTab';
import ActivitiesTab from '../components/common/ActivitiesTab';
import AttendanceTab from '../components/common/AttendanceTab';
import CompetenciesTab from './course-tabs/CompetenciesTab';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CourseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [courseData, setCourseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeVideo, setActiveVideo] = useState(null);
    const [expandedWeeks, setExpandedWeeks] = useState({});
    const [activeTab, setActiveTab] = useState('course'); // 'course' | 'participants' | 'grades' | 'activities' | 'competencies'

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiGet(`/student/courses/${id}/content`);
                setCourseData(data);
                
                // Expand all weeks by default or just the first one
                const initialExpanded = {};
                if (data.weeks) {
                    data.weeks.forEach(w => { initialExpanded[w.WeekID] = true });
                }
                setExpandedWeeks(initialExpanded);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        load();
    }, [id]);

    const toggleWeek = (weekId) => {
        setExpandedWeeks(prev => ({
            ...prev,
            [weekId]: !prev[weekId]
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#020617] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] italic">Accessing Terminal...</p>
                </div>
            </div>
        );
    }

    if (!courseData || !courseData.course) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-slate-500 font-medium">Course not found.</p>
            </div>
        );
    }

    const { course, weeks, lectures, assignments } = courseData;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'course':
                return (
                    <div className="space-y-6 pt-6">
                        {/* General Section */}
                        <div className="border border-slate-200 dark:border-white/5 rounded-2xl bg-white dark:bg-slate-900/40 overflow-hidden shadow-sm">
                            <div className="px-6 py-5 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                                <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">General Resources</h2>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setExpandedWeeks({})}
                                        className="text-[10px] font-black text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-tighter transition-colors"
                                    >
                                        Collapse all
                                    </button>
                                </div>
                            </div>
                            <div className="px-6 py-5 border-t border-slate-100 dark:border-white/5 space-y-4">
                                <Link to={`/discussions/${course.CourseID}`} className="flex items-center gap-4 group p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-500/20">
                                    <div className="p-2.5 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                                        <BookOpen size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-bold text-slate-800 dark:text-white block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Course Announcements & Discussions</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Join the conversation and stay updated</span>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                
                                {assignments && assignments.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Critical Deadlines</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {assignments.map(a => (
                                                <div key={a.AssignmentID} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                                                            <ClipboardList size={16} />
                                                        </div>
                                                        <span className="text-sm text-slate-800 dark:text-white font-bold truncate max-w-[120px]">{a.Title}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase">Due Date</span>
                                                        <span className="text-[11px] text-red-500 dark:text-red-400 font-bold">{a.Deadline ? new Date(a.Deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Weeks Accordions */}
                        {weeks.map((week) => {
                            const isExpanded = expandedWeeks[week.WeekID];
                            let dateString = week.Title || `Week ${week.WeekNumber}`;
                            if (week.StartDate && week.EndDate) {
                                const start = new Date(week.StartDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
                                const end = new Date(week.EndDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
                                dateString = `${start} - ${end}`;
                            }

                            return (
                                <div key={week.WeekID} className="border border-slate-200 dark:border-white/5 rounded-2xl bg-white dark:bg-slate-900/40 overflow-hidden shadow-sm">
                                    <div 
                                        onClick={() => toggleWeek(week.WeekID)}
                                        className="w-full px-6 py-5 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer"
                                    >
                                        <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </div>
                                        <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{dateString}</h2>
                                    </div>
                                    
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 py-5 border-t border-slate-100 dark:border-white/5 space-y-3 pl-16">
                                                    {week.materials && week.materials.map(mat => {
                                                        const isVideo = mat.FileURL && mat.FileURL.match(/\.(mp4|webm|ogg)$/i);
                                                        return (
                                                            <div 
                                                                key={`mat-${mat.MaterialID}`} 
                                                                onClick={() => isVideo ? setActiveVideo(mat) : window.open(`${API_URL}${mat.FileURL}`, '_blank')}
                                                                className="flex items-center justify-between group p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-2 rounded-lg ${isVideo ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'}`}>
                                                                        {isVideo ? <Video size={16} /> : <FileText size={16} />}
                                                                    </div>
                                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{mat.Title}</span>
                                                                </div>
                                                                <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-600 dark:text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">
                                                                    {isVideo ? 'Play Video' : 'Download'}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}

                                                    {week.lectures && week.lectures.map(lec => (
                                                        <div key={`lec-${lec.LectureID}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                                            <div className="p-2 bg-orange-50 dark:bg-orange-500/10 text-orange-500 rounded-lg">
                                                                <Calendar size={16} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="text-sm font-bold text-slate-800 dark:text-white block">{lec.Title}</span>
                                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                                                                    {lec.Date ? new Date(lec.Date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : ''} 
                                                                    {lec.Start_Time ? ` • ${lec.Start_Time}` : ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {(!week.materials?.length && !week.lectures?.length) && (
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">No activities or resources available yet.</p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                );
            case 'participants':
                return <ParticipantsTab courseId={id} role="student" />;
            case 'attendance':
                return <AttendanceTab courseId={id} role="student" />;
            case 'grades':
                return <GradesTab courseId={id} role="student" />;
            case 'activities':
                return <ActivitiesTab assignments={assignments} courseId={id} role="student" />;
            case 'competencies':
                return <CompetenciesTab />;
            default:
                return null;
        }
    };

    const tabs = [
        { id: 'course', label: 'Syllabus', icon: <BookOpen size={18} /> },
        { id: 'activities', label: 'Activities', icon: <ClipboardList size={18} /> },
        { id: 'grades', label: 'Grades', icon: <Award size={18} /> },
        { id: 'attendance', label: 'Attendance', icon: <Calendar size={18} /> },
        { id: 'participants', label: 'Participants', icon: <Users size={18} /> },
        { id: 'competencies', label: 'Competencies', icon: <Target size={16} /> }
    ];

    return (
        <div className="min-h-screen bg-slate-50/30 dark:bg-transparent text-slate-900 dark:text-white pb-20">
            {/* Top Navigation Bar area */}
            <div className="border-b border-slate-200 dark:border-white/5 px-6 py-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate('/courses')}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-bold uppercase tracking-widest transition-colors"
                    >
                        <ArrowLeft size={16} />
                        My Workspace
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded uppercase tracking-tighter">Student View</span>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 mt-12 space-y-8">
                {/* Course Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase leading-none">
                            {course.CourseName}
                        </h1>
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-[0.3em] ml-1">Academic Content Hub</p>
                    </div>
                </div>

                {/* Modern Tabs */}
                <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl w-fit shadow-sm overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                                activeTab === tab.id 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderTabContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Background Aurora Effects */}
            <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20 dark:opacity-30 transition-opacity duration-1000">
                <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-600/10 dark:bg-blue-500/10 blur-[130px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-indigo-500/10 dark:bg-indigo-400/10 blur-[130px] rounded-full"></div>
            </div>

            {/* Video Player Modal */}
            <AnimatePresence>
                {activeVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
                    >
                        <div className="absolute inset-0" onClick={() => setActiveVideo(null)}></div>
                        <div className="relative w-full max-w-4xl bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
                            <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-center">
                                <h3 className="text-white font-black italic tracking-widest uppercase text-sm">
                                    {activeVideo.Title}
                                </h3>
                                <button
                                    onClick={() => setActiveVideo(null)}
                                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="aspect-video w-full">
                                <ReactPlayer
                                    url={`${API_URL}${activeVideo.FileURL}`}
                                    width="100%"
                                    height="100%"
                                    controls
                                    playing
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CourseDetails;