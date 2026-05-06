import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, X, Award, Megaphone, ClipboardList, MessageSquare, Info } from 'lucide-react';
import { apiGet, apiPut } from '../services/api';

import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';

const typeIcons = {
    grade: <Award size={16} className="text-purple-500" />,
    announcement: <Megaphone size={16} className="text-blue-500" />,
    assignment: <ClipboardList size={16} className="text-orange-500" />,
    discussion: <MessageSquare size={16} className="text-emerald-500" />,
    system: <Info size={16} className="text-slate-400" />,
};

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const bellRef = useRef(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const navigate = useNavigate();
    const socket = useSocket();
    const { showToast } = useToast();

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 60000); // Poll less frequently since we have sockets
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            showToast(`New Notification: ${notification.Title}`, 'info');
        };

        socket.on('notification', handleNewNotification);
        return () => socket.off('notification', handleNewNotification);
    }, [socket]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                bellRef.current && !bellRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const data = await apiGet('/notifications/unread-count');
            setUnreadCount(data.count);
        } catch (err) {
            // Silently ignore — likely background polling or auth error
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await apiGet('/notifications');
            setNotifications(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) fetchNotifications();
    };

    const handleMarkRead = async (id) => {
        try {
            await apiPut(`/notifications/read/${id}`);
            setNotifications(prev => prev.map(n => n.NotificationID === id ? { ...n, IsRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await apiPut('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, IsRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const handleClick = (notification) => {
        if (!notification.IsRead) handleMarkRead(notification.NotificationID);
        if (notification.Link) {
            navigate(notification.Link);
            setIsOpen(false);
        }
    };

    const timeAgo = (date) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                ref={bellRef}
                onClick={() => {
                    if (!isOpen && bellRef.current) {
                        const rect = bellRef.current.getBoundingClientRect();
                        setDropdownPos({ top: rect.bottom + 8, left: rect.left });
                    }
                    handleOpen();
                }}
                className="relative p-2.5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-blue-500 transition-all hover:border-blue-500/30"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-red-500/30"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown — rendered via Portal to escape sidebar overflow/backdrop-filter */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            style={{ top: dropdownPos.top, left: dropdownPos.left }}
                            className="fixed w-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none z-[200] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Notifications</h3>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-600 flex items-center gap-1"
                                        >
                                            <CheckCheck size={12} /> Mark all read
                                        </button>
                                    )}
                                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">
                                        <X size={14} className="text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="max-h-96 overflow-y-auto">
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-10 text-center">
                                        <Bell size={32} className="text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                                        <p className="text-xs font-bold text-slate-400">No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div
                                            key={n.NotificationID}
                                            onClick={() => handleClick(n)}
                                            className={`px-6 py-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-slate-50 dark:border-white/5 last:border-0 ${
                                                !n.IsRead ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''
                                            }`}
                                        >
                                            <div className="mt-0.5 shrink-0">
                                                {typeIcons[n.Type] || typeIcons.system}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-bold leading-tight ${!n.IsRead ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    {n.Title}
                                                </p>
                                                {n.Message && (
                                                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{n.Message}</p>
                                                )}
                                                <p className="text-[9px] text-slate-400 mt-1.5 font-bold">{timeAgo(n.CreatedAt)}</p>
                                            </div>
                                            {!n.IsRead && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5"></div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default NotificationBell;
