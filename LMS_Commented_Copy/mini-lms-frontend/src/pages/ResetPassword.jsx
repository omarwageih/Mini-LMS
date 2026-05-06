import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const token = searchParams.get('token');
    const id = searchParams.get('id');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, token, newPassword })
            });

            const data = await response.json();
            if (!response.ok) {
                setError(data.message || 'Something went wrong');
            } else {
                setSuccess('Password reset successfully! Redirecting to login...');
                setTimeout(() => navigate('/login'), 2500);
            }
        } catch (err) {
            setError('Server connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!token || !id) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#020617] px-4">
                <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl p-11 rounded-[3rem] border border-white dark:border-white/5 shadow-2xl text-center space-y-4">
                    <AlertCircle size={48} className="text-red-500 mx-auto" />
                    <h2 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic">Invalid Link</h2>
                    <p className="text-slate-400 text-sm">This password reset link is invalid or has expired.</p>
                    <button onClick={() => navigate('/login')} className="mt-4 px-8 py-3 btn-grad rounded-2xl text-white font-black text-[11px] uppercase tracking-widest">
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

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
                    
                    <div className="text-center mb-10 space-y-3">
                        <h2 className="text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic leading-none">
                            New Password
                        </h2>
                        <p className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">
                            Create a strong new password
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
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 ml-2 italic">New Password</label>
                            <div className="relative">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 p-5 pl-14 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 dark:text-white font-bold text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5 text-left group">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 ml-2 italic">Confirm Password</label>
                            <div className="relative">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 p-5 pl-14 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 dark:text-white font-bold text-sm"
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
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Reset Password'}
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

export default ResetPassword;
