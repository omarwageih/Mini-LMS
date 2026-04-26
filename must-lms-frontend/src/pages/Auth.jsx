import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, ShieldCheck, LogIn, ShieldPlus, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

const Auth = () => {
    const location = useLocation();
    const [isLogin, setIsLogin] = useState(location.state?.mode !== 'register');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [userType, setUserType] = useState('Student');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    React.useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const endpoint = isLogin ? 'http://localhost:3000/api/auth/login' : 'http://localhost:3000/api/auth/register';
        const body = isLogin 
            ? { email, password } 
            : { fullName, email, password, userType, phone };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Operation failed");
                return;
            }

            if (isLogin) {
                // Handle Login Success
                localStorage.setItem('token', data.token);
                const payload = JSON.parse(atob(data.token.split('.')[1]));
                const user = {
                    UserID: payload.id,
                    UserType: payload.type,
                    FullName: payload.name,
                    Email: payload.email
                };
                localStorage.setItem('user', JSON.stringify(user));

                // Navigate based on role (standard behavior)
                // We'll just go to the default dashboard which redirects or shows role content
                navigate('/dashboard');
            } else {
                // Handle Register Success
                setSuccess("Registration successful! Switching to login...");
                setTimeout(() => {
                    setIsLogin(true);
                    setSuccess('');
                }, 2000);
            }
        } catch (err) {
            setError("Server connection error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const tabVariants = {
        active: { x: isLogin ? 0 : '100%', transition: { type: "spring", stiffness: 300, damping: 30 } }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#020617] relative overflow-hidden px-4 py-10 selection:bg-blue-500/20">

            {/* 🌌 Aurora Aesthetics */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <motion.div
                    animate={{
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                        rotate: [0, 10, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-blue-600/15 to-purple-600/10 blur-[140px] rounded-full"
                />
                <motion.div
                    animate={{
                        x: [0, -40, 0],
                        y: [0, -20, 0],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tr from-cyan-500/15 to-blue-500/10 blur-[140px] rounded-full"
                />
            </div>

            <motion.div
                layout
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="w-full max-w-[460px] z-10"
            >
                <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl p-8 md:p-11 rounded-[3rem] border border-white dark:border-white/5 shadow-2xl relative overflow-hidden">

                    {/* Pills Tabs */}
                    <div className="relative flex bg-slate-100 dark:bg-black/20 p-1.5 rounded-2xl mb-12 border border-slate-200 dark:border-white/5">
                        <motion.div
                            variants={tabVariants}
                            animate="active"
                            className="absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-800 rounded-xl shadow-md z-0"
                        />

                        <button onClick={() => setIsLogin(true)} className={`relative z-10 flex-1 py-3.5 flex items-center justify-center gap-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${isLogin ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'}`}>
                            <ShieldCheck size={16} /> Sign In
                        </button>
                        <button onClick={() => setIsLogin(false)} className={`relative z-10 flex-1 py-3.5 flex items-center justify-center gap-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${!isLogin ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'}`}>
                            <ShieldPlus size={16} /> Register
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isLogin ? 'login-head' : 'reg-head'}
                            initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                            transition={{ duration: 0.3 }}
                            className="text-center mb-10 space-y-3"
                        >
                            <h2 className="text-4xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic leading-none">
                                {isLogin ? 'Welcome Back' : 'Get Started'}
                            </h2>
                            <p className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                                {isLogin ? <><Sparkles size={12} className="text-blue-500" /> Enter Terminal Access</> : 'Create your academic ID'}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    <form onSubmit={handleAuth} className="space-y-6">

                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-3 italic">
                                <AlertCircle size={18} /> {error}
                            </motion.div>
                        )}

                        {success && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-3 italic">
                                <Sparkles size={18} /> {success}
                            </motion.div>
                        )}

                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="space-y-6">

                                    <div className="space-y-2.5 text-left">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2 italic">Institutional Role</label>
                                        <div className="relative flex p-1.5 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
                                            {['Student', 'Assistant'].map((type) => (
                                                <button 
                                                    key={type} 
                                                    type="button" 
                                                    onClick={() => setUserType(type)} 
                                                    className={`relative z-10 flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all duration-300 ${userType === type ? 'text-white' : 'text-slate-400 dark:text-slate-600'}`}
                                                >
                                                    {userType === type && (
                                                        <motion.div 
                                                            layoutId="roleSelector"
                                                            className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 z-[-1]"
                                                        />
                                                    )}
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <ModernInput icon={<User size={18} />} label="Full Name" placeholder="Enter Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                                    <ModernInput icon={<Phone size={18} />} label="Phone Number" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <ModernInput icon={<Mail size={18} />} label="Institutional Email" placeholder="name@university.edu" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

                        <div className="relative space-y-1.5">
                            <ModernInput icon={<Lock size={18} />} label="Security Password" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            {isLogin && (
                                <button type="button" className="absolute right-4 bottom-4 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest italic hover:underline">Forgot?</button>
                            )}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading}
                            type="submit"
                            className="w-full py-5 mt-6 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3.5 tracking-[0.3em] text-[12px] uppercase italic disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? <><LogIn size={20} /> Authorize Access</> : <><ShieldPlus size={20} /> Confirm Identity</>)}
                        </motion.button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-slate-100 dark:border-white/5 text-center">
                        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.2em] italic">
                            MUST Engineering Portal <span className="text-blue-500/70 mx-1">•</span> Secure Access v3.0
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const ModernInput = ({ icon, label, placeholder, ...props }) => (
    <div className="space-y-2.5 text-left group">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 ml-2 italic group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">{label}</label>
        <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" >
                {icon}
            </div>
            <input
                {...props}
                placeholder={placeholder}
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 p-5 pl-14 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-white font-bold text-sm"
            />
        </div>
    </div>
);

export default Auth;
