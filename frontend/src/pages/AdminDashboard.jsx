import { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { Users, GraduationCap, School, ShieldCheck, Activity, UsersRound } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await api.get('/admin/stats');
        const logsRes = await api.get('/admin/activity-log');
        setStats(statsRes.data);
        setActivities(logsRes.data);
      } catch (err) {
        console.error('Failed to fetch admin data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-10 h-10 border-3 border-must-gold/30 border-t-must-gold rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.TotalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Instructors', value: stats?.TotalInstructors, icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Courses', value: stats?.TotalCourses, icon: School, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'System Active', value: '100%', icon: ShieldCheck, color: 'text-must-gold', bg: 'bg-must-gold/10' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-white">System Admin Control Center</h1>
          <p className="text-gray-400 mt-1">Global oversight and university infrastructure management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <div key={stat.label} className="stat-card animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Stats */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <UsersRound className="w-5 h-5 text-must-gold" /> User Breakdown
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Students', value: stats?.TotalStudents, total: stats?.TotalUsers, color: 'bg-blue-500' },
                  { label: 'Instructors', value: stats?.TotalInstructors, total: stats?.TotalUsers, color: 'bg-purple-500' },
                  { label: 'Assistants', value: stats?.TotalAssistants, total: stats?.TotalUsers, color: 'bg-emerald-500' }
                ].map(item => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-white font-medium">{item.value}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full`} 
                        style={{ width: `${(item.value / item.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-must-gold" /> Global Activity Audit
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {activities.map((log, i) => (
                  <div key={log.LogID} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/3 transition-colors border border-transparent hover:border-white/5">
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                      log.UserType === 'Instructor' ? 'bg-purple-500/20 text-purple-400' : 
                      log.UserType === 'Student' ? 'bg-blue-500/20 text-blue-400' : 'bg-must-gold/20 text-must-gold'
                    }`}>
                      {log.FullName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">
                        {log.FullName} <span className="text-gray-500 font-normal">performed</span> {log.Action}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{log.Details}</p>
                    </div>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap mt-1">
                      {new Date(log.Timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No recent activities found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
