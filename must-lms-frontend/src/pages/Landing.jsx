import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, BookOpen, GraduationCap } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    React.useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            navigate('/dashboard');
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] relative overflow-hidden flex flex-col items-center justify-center px-6 selection:bg-blue-500/20">
            
            {/* 🌌 Background Aurora */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-blue-600/10 blur-[130px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-purple-600/10 blur-[130px] rounded-full"></div>
            </div>

            <main className="relative z-10 max-w-5xl mx-auto text-center space-y-12">
                
                {/* Badge */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-3 px-6 py-2.5 bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white dark:border-white/10 rounded-full shadow-2xl"
                >
                    <Sparkles size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                        Next-Gen Academic Terminal
                    </span>
                </motion.div>

                {/* Hero Title */}
                <div className="space-y-6">
                    <motion.h1 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none italic"
                    >
                        MUST <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">Learning</span> System
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-slate-500 dark:text-slate-400 font-bold max-w-2xl mx-auto leading-relaxed text-sm uppercase tracking-widest italic"
                    >
                        Precision. Logic. Excellence. <br />
                        The ultimate LMS experience for MUST University Engineers.
                    </motion.p>
                </div>

                {/* Action Buttons */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6"
                >
                    <Link 
                        to="/login"
                        className="btn-grad px-12 py-5 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center gap-3"
                    >
                        Start Journey <ArrowRight size={18} />
                    </Link>
                    
                    <Link 
                        to="/login"
                        state={{ mode: 'register' }}
                        className="px-12 py-5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] hover:bg-white dark:hover:bg-slate-700/50 transition-all active:scale-95 shadow-lg"
                    >
                        Register ID
                    </Link>
                </motion.div>

                {/* Features Recap */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20">
                    {[
                        { icon: <ShieldCheck size={24} />, title: "Secure", desc: "Military grade data protection" },
                        { icon: <BookOpen size={24} />, title: "Fluid", desc: "Dynamic course management" },
                        { icon: <GraduationCap size={24} />, title: "Smart", desc: "AI-powered grading insights" }
                    ].map((f, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 + (i * 0.1) }}
                            className="p-8 rounded-3xl bg-white/30 dark:bg-white/5 border border-white dark:border-white/10 backdrop-blur-sm text-left group hover:bg-white/60 dark:hover:bg-white/10 transition-all"
                        >
                            <div className="text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white mb-1.5">{f.title}</h4>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter italic">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* Footer Label */}
            <div className="absolute bottom-10 left-0 right-0 text-center">
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] italic">
                    Faculty of Engineering • Computer Science Dept • v3.0 Stable
                </p>
            </div>
        </div>
    );
};

export default Landing;
