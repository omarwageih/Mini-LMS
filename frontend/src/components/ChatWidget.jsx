import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ChatWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/ai/history');
            if (data.length > 0) {
                setMessages(data);
            } else {
                setMessages([{
                    role: 'model',
                    content: `Hello ${user?.FullName}! I am your MUST ${user?.UserType} AI. How can I assist you today?`
                }]);
            }
        } catch (error) {
            console.error('Failed to fetch chat history', error);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const { data } = await api.post('/ai/chat', { message: input });
            setMessages(prev => [...prev, { role: 'model', content: data.response }]);
        } catch {
            setMessages(prev => [...prev, { role: 'model', content: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            fetchHistory();
        }
    }, [isOpen, messages.length]); // Added messages.length to dependencies

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="glass-card w-[350px] sm:w-[400px] h-[500px] mb-4 flex flex-col shadow-2xl border-white/10 animate-fade-in-up origin-bottom-right">
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-must-gold/20 rounded-xl flex items-center justify-center border border-must-gold/30">
                                <Bot className="w-6 h-6 text-must-gold" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white leading-none">MUST AI {user?.UserType}</h3>
                                <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Online
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white/[0.02]">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center mt-1 border ${
                                        msg.role === 'user' 
                                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' 
                                        : 'bg-must-gold/20 text-must-gold border-must-gold/20'
                                    }`}>
                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm ${
                                        msg.role === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20' 
                                        : 'bg-white/5 text-gray-200 rounded-tl-none border border-white/5'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-must-gold/20 text-must-gold flex items-center justify-center">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                                        <Loader2 className="w-4 h-4 text-must-gold animate-spin" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer */}
                    <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-white/5 rounded-b-2xl">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-must-gold/50 transition-colors"
                            />
                            <button 
                                type="submit" 
                                disabled={!input.trim() || loading}
                                className="absolute right-1 top-1 bottom-1 px-3 bg-must-gold text-must-blue-dark rounded-lg flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 ${
                    isOpen 
                    ? 'bg-must-blue-dark border-2 border-white/10 text-white rotate-90' 
                    : 'bg-must-gold text-must-blue-dark hover:scale-105 active:scale-95'
                }`}
            >
                {isOpen ? <X className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-must-blue-dark animate-pulse" />
                )}
            </button>
        </div>
    );
};

export default ChatWidget;
