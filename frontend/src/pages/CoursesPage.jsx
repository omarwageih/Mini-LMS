import { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { BookOpen, Users, BarChart3, ClipboardList, FileText } from 'lucide-react';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await api.get('/courses');
        setCourses(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-white">Courses</h1>
          <p className="text-gray-400 mt-1">{courses.length} course{courses.length !== 1 ? 's' : ''} available</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course, i) => (
            <div
              key={course.CourseID}
              className="glass-card p-6 animate-fade-in-up hover:border-must-gold/20 hover:shadow-must-gold/5 hover:shadow-2xl transition-all group"
              style={{ opacity: 0, animationDelay: `${i * 0.08}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-must-gold/10 rounded-xl flex items-center justify-center group-hover:bg-must-gold/20 transition-colors">
                  <BookOpen className="w-6 h-6 text-must-gold" />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-1">{course.CourseName}</h3>
              <p className="text-sm text-gray-400 mb-4">{course.InstructorName || 'No instructor'}</p>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-white/3 rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1 text-blue-400">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-sm font-bold">{course.StudentCount || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Students</p>
                </div>
                <div className="bg-white/3 rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1 text-purple-400">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span className="text-sm font-bold">{course.LectureCount || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Lectures</p>
                </div>
                <div className="bg-white/3 rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1 text-amber-400">
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span className="text-sm font-bold">{course.AssignmentCount || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Assignments</p>
                </div>
                <div className="bg-white/3 rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1 text-emerald-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="text-sm font-bold">{course.QuizCount || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Quizzes</p>
                </div>
              </div>

              {course.CreatedAt && (
                <p className="text-xs text-gray-500 mt-4 text-right">
                  Since {new Date(course.CreatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="glass-card p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No courses found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CoursesPage;
