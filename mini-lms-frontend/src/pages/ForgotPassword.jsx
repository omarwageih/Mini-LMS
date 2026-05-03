import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            if (!response.ok) {
                setError(data.message || 'Something went wrong');
            } else {
                setSuccess(data.message);
            }
        } catch (err) {
            setError('Server connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#020617] relative overflow-hidden px-4 py-10">
            {/* Aurora */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-blue-600/15 to-purple-600/10 blur-[140px] rounded-full" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tr from-cyan-500/15 to-blue-500/10 blur-[140px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[460px] z-10"
            >
                <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl p-8 md:p-11 rounded-[3rem] border border-white dark:border-white/5 shadow-2xl">
                    
                    <Link to="/login" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-500 transition-colors mb-8">
                        <ArrowLeft size={14} /> Back to Login
                    </Link>

                    <div className="text-center mb-10 space-y-3">
                        <h2 className="text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic leading-none">
                            Forgot Password
                        </h2>
                        <p className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">
                            Enter your email to receive a reset link
                        </p>
                    </div>

                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-3 italic mb-6">
                            <AlertCircle size={18} /> {error}
                        </motion.div>
                    )}

                    {success && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-3 italic mb-6">
                            <CheckCircle2 size={18} /> {success}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2.5 text-left group">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 ml-2 italic group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    placeholder="name@university.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 p-5 pl-14 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-white font-bold text-sm"
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 btn-grad rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl flex items-center justify-center gap-3 transition-all text-white disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
                        </motion.button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-slate-100 dark:border-white/5 text-center">
                        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.2em] italic">
                            Mini LMS Portal <span className="text-blue-500/70 mx-1">•</span> Password Recovery
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
