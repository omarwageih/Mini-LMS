import { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { BookOpen, ClipboardList, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const AssistantDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/assistant/dashboard');
        setCourses(data);
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

  const totalPending = courses.reduce((acc, c) => acc + (c.PendingGrading || 0), 0);
  const totalStudents = courses.reduce((acc, c) => acc + (c.EnrolledStudents || 0), 0);

  const stats = [
    { label: 'Assigned Courses', value: courses.length, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Students', value: totalStudents, icon: ClipboardList, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Pending Grading', value: totalPending, icon: Clock, color: totalPending > 0 ? 'text-red-400' : 'text-emerald-400', bg: totalPending > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-white">Assistant Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage submissions and grading</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <div key={stat.label} className={`stat-card animate-fade-in-up stagger-${i + 1}`} style={{ opacity: 0 }}>
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Course List */}
        <div className="space-y-4">
          {courses.map((course, i) => (
            <div key={course.CourseID} className="glass-card p-5 animate-fade-in-up hover:border-must-gold/20 transition-all" style={{ opacity: 0, animationDelay: `${0.2 + i * 0.1}s` }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{course.CourseName}</h3>
                  <p className="text-sm text-gray-400 mt-1">Instructor: {course.InstructorName || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center px-4 py-2 bg-white/3 rounded-xl">
                    <p className="text-lg font-bold text-white">{course.EnrolledStudents}</p>
                    <p className="text-xs text-gray-400">Students</p>
                  </div>
                  <div className={`text-center px-4 py-2 rounded-xl ${course.PendingGrading > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                    <p className={`text-lg font-bold ${course.PendingGrading > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {course.PendingGrading}
                    </p>
                    <p className="text-xs text-gray-400">Pending</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="glass-card p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No courses assigned yet</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AssistantDashboard;
