import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Search, User, MoreVertical, Phone, Video,
    Image as ImageIcon, Paperclip, Smile, Shield,
    MessageSquare, Clock, Check, CheckCheck, Loader2, ArrowLeft
} from 'lucide-react';
import { messageAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { format } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const Messages = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileView, setIsMobileView] = useState(false);
    const [showChat, setShowChat] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const { showToast } = useToast();
    const socket = useSocket();
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const emojis = ['😊', '😂', '❤️', '👍', '🔥', '👏', '🙌', '🎉', '💡', '✅'];
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const addEmoji = (emoji) => {
        setNewMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (activeChat) {
            fetchMessages(activeChat.UserID);
            if (isMobileView) setShowChat(true);
        }
    }, [activeChat, isMobileView]);

    // Handle incoming navigation state (Direct Message from other pages)
    useEffect(() => {
        if (!loading && location.state?.userId) {
            const userId = location.state.userId;
            const existingChat = conversations.find(c => c.UserID == userId);

            if (existingChat) {
                setActiveChat(existingChat);
            } else if (location.state.fullName) {
                // Set a placeholder for new conversation
                const placeholder = {
                    UserID: userId,
                    FullName: location.state.fullName,
                    UserType: 'User',
                    IsPlaceholder: true
                };
                setActiveChat(placeholder);
            }
            // Clear location state to prevent re-triggering on refresh or tab switch
            window.history.replaceState({}, document.title);
        }
    }, [location.state, conversations, loading]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (socket) {
            socket.on('receive_message', (message) => {
                // If message is from current active chat
                if (activeChat && (message.SenderID === activeChat.UserID)) {
                    setMessages(prev => [...prev, message]);
                }
                // Refresh conversation list to show last message/unread count
                fetchConversations();
            });

            socket.on('message_sent', (message) => {
                if (activeChat && (message.ReceiverID === activeChat.UserID)) {
                    setMessages(prev => [...prev, message]);
                }
                fetchConversations();
            });

            return () => {
                socket.off('receive_message');
                socket.off('message_sent');
            };
        }
    }, [socket, activeChat]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConversations = async () => {
        try {
            const data = await messageAPI.getConversations();
            setConversations(data.data);
            setLoading(false);
        } catch (err) {
            console.error('Fetch conversations error:', err);
            setLoading(false);
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const data = await messageAPI.getConversation(userId);
            setMessages(data.data);
        } catch (err) {
            console.error('Fetch messages error:', err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat || sending) return;

        setSending(true);
        try {
            await messageAPI.sendMessage({
                receiverId: activeChat.UserID,
                content: newMessage.trim()
            });
            setNewMessage('');
        } catch (err) {
            console.error('Send message error:', err);
            showToast("Failed to send message", "error");
        } finally {
            setSending(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeChat) return;

        setSending(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('receiverId', activeChat.UserID);

            await messageAPI.sendAttachment(formData);
            showToast(`File "${file.name}" sent successfully.`, "success");
        } catch (err) {
            console.error('File upload error:', err);
            showToast("Failed to upload file.", "error");
        } finally {
            setSending(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const initiateCall = (type) => {
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} calling is not available in the developer preview.`, "info");
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${base}${cleanPath}`;
    };

    const allConversations = [...conversations];
    // Add active placeholder to sidebar if it doesn't exist in conversations
    if (activeChat && !conversations.some(c => c.UserID == activeChat.UserID)) {
        allConversations.unshift(activeChat);
    }

    const filteredConversations = allConversations.filter(c =>
        c.FullName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="h-[calc(100vh-100px)] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="h-[calc(100vh-120px)] flex bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5 mx-4 my-2 relative">

            {/* Sidebar: Chat List */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-slate-100 dark:border-white/5 flex flex-col ${isMobileView && showChat ? 'hidden' : 'flex'}`}>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Messages</h2>
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-full text-indigo-600">
                            <MessageSquare size={20} />
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                    {filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 opacity-50">
                            <Clock size={32} />
                            <p className="text-xs font-bold uppercase tracking-widest">No conversations found</p>
                        </div>
                    ) : (
                        filteredConversations.map((chat) => (
                            <motion.button
                                key={chat.UserID}
                                whileHover={{ x: 4 }}
                                onClick={() => setActiveChat(chat)}
                                className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${activeChat?.UserID === chat.UserID
                                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                                        : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                                        {chat.ProfilePicture ? (
                                            <img
                                                src={getImageUrl(chat.ProfilePicture)}
                                                alt={chat.FullName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-lg">
                                                {chat.FullName.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    {chat.UnreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                                            {chat.UnreadCount}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <h4 className="font-bold truncate text-sm">{chat.FullName}</h4>
                                        <span className={`text-[10px] ${activeChat?.UserID === chat.UserID ? 'text-white/70' : 'text-slate-400'}`}>
                                            {chat.LastMessageAt ? format(new Date(chat.LastMessageAt), 'HH:mm') : ''}
                                        </span>
                                    </div>
                                    <p className={`text-xs truncate ${activeChat?.UserID === chat.UserID ? 'text-white/80' : 'text-slate-400'}`}>
                                        {chat.LastMessage || 'No messages yet'}
                                    </p>
                                </div>
                            </motion.button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950/30 ${isMobileView && !showChat ? 'hidden' : 'flex'}`}>
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-20 px-6 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5">
                            <div
                                onClick={() => navigate(`/profile/${activeChat.UserID}`)}
                                className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                {isMobileView && (
                                    <button onClick={(e) => { e.stopPropagation(); setShowChat(false); }} className="p-2 -ml-2 text-slate-500">
                                        <ArrowLeft size={20} />
                                    </button>
                                )}
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700">
                                    {activeChat.ProfilePicture ? (
                                        <img
                                            src={getImageUrl(activeChat.ProfilePicture)}
                                            alt={activeChat.FullName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold">
                                            {activeChat.FullName.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-none mb-1">{activeChat.FullName}</h4>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">{activeChat.UserType}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigate(`/profile/${activeChat.UserID}`)}
                                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all flex items-center gap-2"
                                    title="View Profile"
                                >
                                    <User size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Profile</span>
                                </button>
                                <button
                                    onClick={() => initiateCall('voice')}
                                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                                >
                                    <Phone size={18} />
                                </button>
                                <button
                                    onClick={() => initiateCall('video')}
                                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                                >
                                    <Video size={18} />
                                </button>
                                <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg, i) => {
                                const isMe = msg.SenderID === currentUser.UserID;
                                return (
                                    <div key={msg.MessageID || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`p-4 rounded-3xl text-sm ${isMe
                                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-white/5 rounded-tl-none'
                                                }`}>
                                                {msg.Content.startsWith('[FILE:') ? (
                                                    (() => {
                                                        const urlMatch = msg.Content.match(/\(([^()]+)\)$/);
                                                        const nameMatch = msg.Content.match(/\[FILE:(.*?)\]/);
                                                        const url = urlMatch ? urlMatch[1] : '';
                                                        const name = nameMatch ? nameMatch[1] : 'File';
                                                        return (
                                                            <a
                                                                href={getImageUrl(url)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-3 hover:underline"
                                                            >
                                                                <div className="p-2 bg-black/10 rounded-lg">
                                                                    <Paperclip size={16} />
                                                                </div>
                                                                <span className="font-bold">{name}</span>
                                                            </a>
                                                        );
                                                    })()
                                                ) : (
                                                    msg.Content
                                                )}
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    {format(new Date(msg.CreatedAt), 'HH:mm')}
                                                </span>
                                                {isMe && (
                                                    msg.IsRead ? <CheckCheck size={12} className="text-indigo-400" /> : <Check size={12} className="text-slate-300" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2.5 text-slate-400 hover:text-indigo-600 transition-all"
                                    >
                                        <Paperclip size={20} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2.5 text-slate-400 hover:text-indigo-600 transition-all"
                                    >
                                        <ImageIcon size={20} />
                                    </button>
                                </div>
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Type your message..."
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl py-4 pl-6 pr-12 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-yellow-500 transition-all"
                                    >
                                        <Smile size={20} />
                                    </button>

                                    {showEmojiPicker && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute bottom-full right-0 mb-2 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/5 flex gap-1 z-50"
                                        >
                                            {emojis.map(e => (
                                                <button
                                                    key={e}
                                                    onClick={() => addEmoji(e)}
                                                    className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all"
                                                >
                                                    {e}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending}
                                    className="p-3.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-6">
                        <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center text-indigo-600">
                            <Shield size={48} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Secure Terminal</h3>
                            <p className="text-sm text-slate-400 max-w-xs mx-auto">Select a conversation from the sidebar to begin encrypted messaging with university staff and students.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
