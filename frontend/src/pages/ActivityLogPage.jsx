import { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { Activity, Filter, User, Clock } from 'lucide-react';

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get('/activity-log');
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionColor = (action) => {
    if (action?.includes('DELETE')) return 'text-red-400 bg-red-500/10';
    if (action?.includes('CREATE') || action?.includes('REGISTER')) return 'text-emerald-400 bg-emerald-500/10';
    if (action?.includes('GRADE')) return 'text-purple-400 bg-purple-500/10';
    if (action?.includes('LOGIN')) return 'text-blue-400 bg-blue-500/10';
    return 'text-gray-400 bg-white/5';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-10 h-10 border-3 border-must-gold/30 border-t-must-gold rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-must-gold" /> Activity Log
          </h1>
          <p className="text-gray-400 mt-1">System-wide activity history</p>
        </div>

        <div className="glass-card overflow-hidden animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="table-header">User</th>
                  <th className="table-header">Action</th>
                  <th className="table-header">Details</th>
                  <th className="table-header">Table</th>
                  <th className="table-header">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.LogID} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{log.UserName}</p>
                          <p className="text-xs text-gray-500">{log.UserType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`must-badge ${getActionColor(log.Action)}`}>
                        {log.Action}
                      </span>
                    </td>
                    <td className="table-cell text-gray-400 max-w-xs truncate">{log.Details || '—'}</td>
                    <td className="table-cell text-gray-500 text-xs font-mono">{log.TargetTable || '—'}</td>
                    <td className="table-cell text-gray-500 text-xs whitespace-nowrap">
                      {new Date(log.Timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="table-cell text-center text-gray-500 py-8">No activity recorded yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ActivityLogPage;
