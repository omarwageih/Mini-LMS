import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ShieldCheck, LogIn, AlertCircle } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            setError(data.message || "Login failed");
            return;
        }

        // ✅ خزّن التوكن
        localStorage.setItem('token', data.token);

        // ✅ (اختياري) هات بيانات المستخدم من التوكن
        const payload = JSON.parse(atob(data.token.split('.')[1]));

        const user = {
            UserID: payload.id,
            UserType: payload.type,
            FullName: payload.name,
            Email: payload.email
        };

        localStorage.setItem('user', JSON.stringify(user));

        // ✅ Redirect حسب role
        if (payload.type === "Instructor") {
            navigate('/instructor');
        } else if (payload.type === "Assistant") {
            navigate('/assistant');
        } else {
            navigate('/student');
        }

    } catch (err) {
        setError("Server error. Try again.");
    }
};

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] relative overflow-hidden px-4">

            {/* الخلفية الجمالية (Glow Effects) */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[440px] z-10"
            >
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white dark:border-white/5 shadow-2xl shadow-blue-500/10">

                    {/* Logo Section */}
                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <ShieldCheck size={40} className="text-white" />
                        </div>
                    </div>

                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            MINI <span className="text-blue-600">LMS</span>
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-2 italic">
                            Please enter your
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs font-bold flex items-center gap-2"
                            >
                                <AlertCircle size={16} /> {error}
                            </motion.div>
                        )}

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 pl-12 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-800 dark:text-white font-medium"
                                    placeholder="admin@lms.com"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Password</label>
                                <button type="button" className="text-[10px] font-black text-blue-500 uppercase hover:underline">Forgot?</button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 pl-12 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-800 dark:text-white font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 tracking-widest text-sm"
                        >
                            <LogIn size={20} />
                            AUTHORIZE ACCESS
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 text-center">
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                            Facing issues? <span className="text-blue-500 cursor-pointer hover:underline">Support Center</span>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;