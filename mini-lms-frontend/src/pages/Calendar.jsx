import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Calendar = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/student/calendar`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setEvents(data);
        } catch (err) {
            console.error('Failed to load calendar events:', err);
        } finally {
            setLoading(false);
        }
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const today = new Date();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getEventsForDate = (day) => {
        return events.filter(e => {
            const d = new Date(e.Date);
            return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
        });
    };

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => setCurrentDate(new Date());

    const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isPast = (day) => new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Upcoming deadlines
    const upcoming = events
        .filter(e => new Date(e.Date) >= today && !e.IsSubmitted)
        .slice(0, 5);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                    Academic <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Calendar</span>
                </h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 italic">Assignment Deadlines & Schedule</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar Grid */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-xl">
                    {/* Month navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                            <ChevronLeft size={20} className="text-slate-400" />
                        </button>
                        <div className="text-center">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{monthNames[month]} {year}</h2>
                            <button onClick={goToday} className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline">Today</button>
                        </div>
                        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                            <ChevronRight size={20} className="text-slate-400" />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-2">
                        {dayNames.map(d => (
                            <div key={d} className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest py-2">{d}</div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dayEvents = getEventsForDate(day);
                            const hasDeadline = dayEvents.length > 0;
                            const allSubmitted = dayEvents.every(e => e.IsSubmitted);

                            return (
                                <motion.div
                                    key={day}
                                    whileHover={{ scale: 1.05 }}
                                    className={`relative p-2 rounded-xl text-center min-h-[60px] cursor-default transition-all border
                                        ${isToday(day) ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' :
                                        hasDeadline && !allSubmitted ? 'bg-red-500/5 border-red-500/20 dark:bg-red-500/10' :
                                        hasDeadline && allSubmitted ? 'bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-500/10' :
                                        isPast(day) ? 'border-transparent opacity-40' : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                >
                                    <span className={`text-xs font-black ${isToday(day) ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {day}
                                    </span>
                                    {hasDeadline && (
                                        <div className="flex justify-center gap-0.5 mt-1">
                                            {dayEvents.slice(0, 3).map((e, idx) => (
                                                <div key={idx} className={`w-1.5 h-1.5 rounded-full ${e.Type.toLowerCase() === 'lecture' ? 'bg-purple-500' : e.IsSubmitted ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pending</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Submitted</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Live Broadcast</span>
                        </div>
                    </div>
                </div>

                {/* Upcoming Deadlines Sidebar */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                        <AlertCircle size={16} className="inline mr-2 text-red-500" /> Upcoming Deadlines
                    </h3>
                    {upcoming.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/5 p-6 text-center">
                            <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All caught up!</p>
                        </div>
                    ) : (
                        upcoming.map((e, idx) => {
                            const deadline = new Date(e.Date);
                            const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/5 p-4 shadow-sm"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${daysLeft <= 1 ? 'bg-red-500/10 text-red-500' : daysLeft <= 3 ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                            <Clock size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-slate-800 dark:text-white truncate">{e.Title}</p>
                                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                                                <BookOpen size={10} /> {e.CourseName}
                                            </p>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${daysLeft <= 1 ? 'text-red-500' : daysLeft <= 3 ? 'text-amber-500' : 'text-blue-500'}`}>
                                                {daysLeft === 0 ? 'Due Today' : daysLeft === 1 ? 'Due Tomorrow' : `${daysLeft} days left`}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="pt-10 text-center opacity-40">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.6em]">
                    Academic Calendar • Mini LMS
                </p>
            </div>
        </div>
    );
};

export default Calendar;
