import { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { BookOpen, TrendingUp, Calendar, Award, Clock, FileText } from 'lucide-react';

const StudentDashboard = () => {
  const [dashboard, setDashboard] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, assignRes] = await Promise.all([
          api.get('/student/dashboard'),
          api.get('/student/assignments')
        ]);
        setDashboard(dashRes.data);
        setAssignments(assignRes.data);
      } catch (err) {
        console.error(err);
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

  const totalCourses = dashboard.length;
  const avgGrade = dashboard.length > 0
    ? (dashboard.reduce((acc, d) => acc + (d.CourseGrade || 0), 0) / dashboard.length).toFixed(1)
    : 0;
  const totalAttended = dashboard.reduce((acc, d) => acc + (d.LecturesAttended || 0), 0);
  const totalLectures = dashboard.reduce((acc, d) => acc + (d.TotalLectures || 0), 0);
  const pendingAssignments = assignments.filter(a => !a.IsSubmitted && !a.IsMissed).length;

  const stats = [
    { label: 'Enrolled Courses', value: totalCourses, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Average Grade', value: avgGrade, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Attendance', value: totalLectures > 0 ? `${totalAttended}/${totalLectures}` : '0', icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Pending Work', value: pendingAssignments, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-white">Student Dashboard</h1>
          <p className="text-gray-400 mt-1">
            {dashboard[0]?.StudentName && `Welcome back, ${dashboard[0].StudentName}`}
            {dashboard[0]?.Major && ` — ${dashboard[0].Major}, Year ${dashboard[0].AcademicYear}`}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={stat.label} className={`stat-card animate-fade-in-up stagger-${i + 1}`} style={{ opacity: 0 }}>
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

        {/* Courses Table */}
        <div className="glass-card overflow-hidden animate-fade-in-up stagger-5" style={{ opacity: 0 }}>
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-must-gold" /> Course Progress
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="table-header">Course</th>
                  <th className="table-header">Assignments</th>
                  <th className="table-header">Quizzes</th>
                  <th className="table-header">Attendance</th>
                  <th className="table-header">Grade</th>
                  <th className="table-header">Progress</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.map((course, i) => {
                  const grade = course.CourseGrade || 0;
                  const progressPercent = Math.min((grade / 100) * 100, 100);
                  return (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="table-cell font-medium text-white">{course.CourseName}</td>
                      <td className="table-cell">{course.AssignmentTotal?.toFixed(1) || '0.0'}</td>
                      <td className="table-cell">{course.QuizTotal?.toFixed(1) || '0.0'}</td>
                      <td className="table-cell">
                        <span className="must-badge bg-purple-500/10 text-purple-400">
                          {course.LecturesAttended}/{course.TotalLectures}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`font-bold ${grade >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {grade.toFixed(1)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="w-full bg-white/5 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-must-gold-dark to-must-gold transition-all duration-700"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {dashboard.length === 0 && (
                  <tr>
                    <td colSpan="6" className="table-cell text-center text-gray-500 py-8">
                      No courses enrolled yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Assignments */}
        {pendingAssignments > 0 && (
          <div className="glass-card p-5 animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.3s' }}>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-amber-400" /> Pending Assignments
            </h2>
            <div className="space-y-3">
              {assignments.filter(a => !a.IsSubmitted && !a.IsMissed).map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">{a.Title}</p>
                    <p className="text-xs text-gray-400">{a.CourseName} — Max: {a.MaxScore}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-amber-400 font-medium">
                      {a.Deadline ? new Date(a.Deadline).toLocaleDateString() : 'No deadline'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
