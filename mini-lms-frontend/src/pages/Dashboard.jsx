import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock, BookOpen, Bell, GraduationCap,
  Sparkles, Activity, ArrowRight, Award,
  ClipboardList, Target, Users, UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { apiGet } from '../services/api';

const Dashboard = () => {
  const [time, setTime] = useState(new Date());
  const [randomQuote, setRandomQuote] = useState("");
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🧠 جلب بيانات المستخدم
  const user = JSON.parse(localStorage.getItem('user')) || { FullName: "Future Engineer", UserType: "Student" };
  const isInstructor = user.UserType === 'Instructor';
  const isAssistant = user.UserType === 'Assistant';
  const isStudent = user.UserType === 'Student';

  const quotes = [
    "Engineers turn dreams into reality.",
    "Small progress is still progress. Keep going!",
    "Your potential is limit-less, just like a diverging series.",
    "Strive for excellence, not just a passing grade.",
    "The best way to predict the future is to create it.",
    "Code is like humor. When you have to explain it, it’s bad."
  ];

  const fetchStats = async () => {
    try {
      const data = await apiGet('/dashboard/stats');
      
      // Map data to include Lucide Icons
      const iconMap = {
        'Users': <Users />,
        'UserPlus': <UserPlus />,
        'BookOpen': <BookOpen />,
        'Award': <Award />,
        'ClipboardList': <ClipboardList />,
        'Activity': <Activity />,
        'Target': <Target />
      };

      const mappedStats = data.map(s => ({
        ...s,
        icon: iconMap[s.icon] || <Activity />
      }));
      setStats(mappedStats);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    fetchStats();
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen pt-10 px-6 transition-all duration-500">
      <div className="max-w-7xl mx-auto space-y-10 pb-20">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-white/10 pb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 text-blue-600 dark:text-[#a78bfa] font-black text-[10px] mb-3 tracking-[0.4em] uppercase">
              <Sparkles size={14} className="animate-pulse" />
              Status: {user.UserType} Account
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              Mini <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-[#a78bfa]">University</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-bold italic uppercase text-xs tracking-widest">Faculty of Engineering • Computer Engineering Dept.</p>
          </motion.div>

          {/* Clock */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#a78bfa] to-blue-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="glass-card relative px-8 py-5 flex items-center gap-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-[2rem]">
              <Clock className="text-blue-600 dark:text-[#a78bfa] animate-[spin_10s_linear_infinite]" size={24} />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 mb-0.5">System Time</span>
                <span className="text-3xl font-mono font-black text-slate-800 dark:text-white tabular-nums tracking-wider flex items-baseline gap-1">
                  {format(time, 'hh:mm')}
                  <span className="text-blue-600 dark:text-[#a78bfa] text-xl animate-pulse">:</span>
                  {format(time, 'ss')}
                  <span className="text-xs ml-1 font-sans text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{format(time, 'a')}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
             [1,2,3].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-white/5 animate-pulse rounded-[2rem]"></div>)
          ) : (
            stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => navigate(stat.path)}
                className="glass-card p-8 flex items-center gap-6 border-l-4 border-l-blue-500 dark:border-l-[#a78bfa] cursor-pointer group transition-all shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/50 dark:bg-slate-900/40 rounded-[2rem]"
              >
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                  {React.cloneElement(stat.icon, { size: 28 })}
                </div>
                <div className="flex flex-col">
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{stat.val}</h3>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="xl:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-10 relative overflow-hidden bg-gradient-to-br from-blue-600/10 via-transparent to-[#a78bfa]/10 border-none shadow-2xl rounded-[3rem]"
            >
              <div className="absolute top-0 right-0 p-10 opacity-5 dark:opacity-10">
                <GraduationCap size={160} className="text-[#a78bfa]" />
              </div>
              <div className="relative z-10 space-y-6">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-tight">
                  Welcome back, <br />
                  <span className="text-blue-600 dark:text-[#a78bfa]">{user.FullName?.split(' ')[0]}</span>
                </h2>
                <div className="flex items-center gap-3 bg-white/40 dark:bg-white/5 w-fit px-4 py-2 rounded-full border border-blue-200/50 dark:border-white/10">
                  <Sparkles size={14} className="text-[#a78bfa]" />
                  <p className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-300">
                    "{randomQuote}"
                  </p>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold max-w-lg leading-relaxed text-sm">
                  {isInstructor && "Your students are making progress. Check the latest submissions below."}
                  {isAssistant && "You have new lab reports to review and sections to manage today."}
                  {isStudent && "Your academic journey is on track. Focus on your goals today."}
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <Link to={isStudent ? "/courses" : isAssistant ? "/assistant/courses" : "/instructor/courses"} className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                    {isStudent ? 'My Courses' : 'Manage Courses'} <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>

            <div className="p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center text-center space-y-3">
              <div className="w-10 h-10 bg-[#a78bfa]/20 rounded-full flex items-center justify-center text-[#a78bfa]">
                <Target size={20} />
              </div>
              <p className="text-slate-500 text-xs italic font-medium">"Precision and logic are the tools of your trade."</p>
            </div>
          </div>

          {/* Right Panel: Activities / Deadlines */}
          <div className="space-y-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white px-2 italic uppercase tracking-tighter flex items-center gap-2">
              <Activity size={20} className="text-[#a78bfa]" />
              {isInstructor ? 'Recent Activity' : isAssistant ? 'Assistant Tasks' : 'Deadlines'}
            </h2>
            <div className="glass-card p-8 space-y-6 border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 rounded-[2.5rem]">
              {[
                {
                  title: isInstructor ? 'Review Signals Labs' : isAssistant ? 'Grade Lab Section 4' : 'Signals Assignment',
                  time: 'Today, 11:59 PM',
                  icon: <Bell />,
                  color: 'text-red-400',
                  bg: 'bg-red-400/10'
                },
                {
                  title: isInstructor ? 'Post Control Quiz' : isAssistant ? 'Update Attendance' : 'Control Systems Quiz',
                  time: 'Tomorrow, 10:00 AM',
                  icon: <ClipboardList />,
                  color: 'text-amber-500',
                  bg: 'bg-amber-500/10'
                }
              ].map((note, idx) => (
                <div key={idx} className="flex gap-5 group items-center p-3 rounded-2xl transition-all border border-transparent">
                  <div className={`w-12 h-12 shrink-0 ${note.bg} ${note.color} rounded-2xl flex items-center justify-center`}>
                    {React.cloneElement(note.icon, { size: 20 })}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase leading-tight tracking-tight">{note.title}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold italic">{note.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
