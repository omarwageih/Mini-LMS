import { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { Calendar, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';

const AttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const { data } = await api.get('/student/attendance');
        setAttendance(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'Absent': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'Late': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'Excused': return <AlertTriangle className="w-4 h-4 text-blue-400" />;
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      Present: 'bg-emerald-500/10 text-emerald-400',
      Absent: 'bg-red-500/10 text-red-400',
      Late: 'bg-amber-500/10 text-amber-400',
      Excused: 'bg-blue-500/10 text-blue-400',
    };
    return colors[status] || 'bg-white/5 text-gray-400';
  };

  const presentCount = attendance.filter(a => a.Status === 'Present').length;
  const absentCount = attendance.filter(a => a.Status === 'Absent').length;
  const lateCount = attendance.filter(a => a.Status === 'Late').length;

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
            <Calendar className="w-6 h-6 text-must-gold" /> Attendance Record
          </h1>
          <p className="text-gray-400 mt-1">Your lecture attendance history</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
            <p className="text-2xl font-bold text-emerald-400">{presentCount}</p>
            <p className="text-xs text-gray-400 mt-1">Present</p>
          </div>
          <div className="stat-card animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
            <p className="text-2xl font-bold text-amber-400">{lateCount}</p>
            <p className="text-xs text-gray-400 mt-1">Late</p>
          </div>
          <div className="stat-card animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
            <p className="text-2xl font-bold text-red-400">{absentCount}</p>
            <p className="text-xs text-gray-400 mt-1">Absent</p>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="table-header">Date</th>
                  <th className="table-header">Course</th>
                  <th className="table-header">Lecture</th>
                  <th className="table-header">Time</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Score</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record, i) => (
                  <tr key={record.AttendanceID} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="table-cell text-white font-medium">
                      {new Date(record.LectureDate).toLocaleDateString()}
                    </td>
                    <td className="table-cell">{record.CourseName}</td>
                    <td className="table-cell">{record.LectureTitle}</td>
                    <td className="table-cell text-gray-500 text-xs">
                      {record.StartTime?.slice(0, 5)} - {record.EndTime?.slice(0, 5)}
                    </td>
                    <td className="table-cell">
                      <span className={`must-badge ${getStatusBadge(record.Status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(record.Status)} {record.Status}
                      </span>
                    </td>
                    <td className="table-cell font-medium">{record.Score?.toFixed(1)}</td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr>
                    <td colSpan="6" className="table-cell text-center text-gray-500 py-8">No attendance records</td>
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

export default AttendancePage;
