import { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { BookOpen, Users, TrendingUp, ClipboardList, BarChart3, GraduationCap } from 'lucide-react';

const InstructorDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/instructor/dashboard');
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

  const totalStudents = courses.reduce((acc, c) => acc + (c.EnrolledStudents || 0), 0);
  const totalLectures = courses.reduce((acc, c) => acc + (c.TotalLectures || 0), 0);
  const totalAssignments = courses.reduce((acc, c) => acc + (c.TotalAssignments || 0), 0);
  const totalQuizzes = courses.reduce((acc, c) => acc + (c.TotalQuizzes || 0), 0);

  const stats = [
    { label: 'Total Courses', value: courses.length, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Lectures Given', value: totalLectures, icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Assessments', value: totalAssignments + totalQuizzes, icon: ClipboardList, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-white">Instructor Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage your courses and students</p>
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

        {/* Course Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {courses.map((course, i) => (
            <div key={course.CourseID} className="glass-card p-6 animate-fade-in-up hover:border-must-gold/20 transition-all" style={{ opacity: 0, animationDelay: `${0.2 + i * 0.1}s` }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{course.CourseName}</h3>
                  {course.Description && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{course.Description}</p>
                  )}
                </div>
                <div className="w-10 h-10 bg-must-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-must-gold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/3 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Students</p>
                  <p className="text-lg font-bold text-white">{course.EnrolledStudents || 0}</p>
                </div>
                <div className="bg-white/3 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Class Average</p>
                  <p className={`text-lg font-bold ${(course.ClassAverageGrade || 0) >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {course.ClassAverageGrade?.toFixed(1) || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5" /> {course.TotalLectures || 0} Lectures
                </span>
                <span className="flex items-center gap-1">
                  <ClipboardList className="w-3.5 h-3.5" /> {course.TotalAssignments || 0} Assignments
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> {course.TotalQuizzes || 0} Quizzes
                </span>
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

export default InstructorDashboard;
