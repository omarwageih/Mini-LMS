import { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { FileText, CheckCircle2, Clock, Timer } from 'lucide-react';

const QuizzesPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data } = await api.get('/student/quizzes');
        setQuizzes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
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

  const completed = quizzes.filter(q => q.IsCompleted);
  const upcoming = quizzes.filter(q => !q.IsCompleted);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-must-gold" /> Quizzes
          </h1>
          <p className="text-gray-400 mt-1">{completed.length} completed, {upcoming.length} upcoming</p>
        </div>

        {/* Quiz cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((q, i) => (
            <div
              key={q.QuizID}
              className={`glass-card p-5 animate-fade-in-up hover:border-must-gold/20 transition-all ${q.IsCompleted ? 'border-emerald-500/10' : ''}`}
              style={{ opacity: 0, animationDelay: `${i * 0.08}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{q.Title}</h3>
                  <p className="text-sm text-gray-400">{q.CourseName}</p>
                </div>
                {q.IsCompleted ? (
                  <div className="flex items-center gap-1 must-badge bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Done
                  </div>
                ) : (
                  <div className="flex items-center gap-1 must-badge bg-amber-500/10 text-amber-400">
                    <Clock className="w-3.5 h-3.5" /> Upcoming
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-3 text-sm">
                {q.IsCompleted && q.MyScore !== null && (
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${q.MyScore >= q.MaxScore * 0.5 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {q.MyScore}
                    </span>
                    <span className="text-gray-500">/ {q.MaxScore}</span>
                  </div>
                )}
                {!q.IsCompleted && (
                  <span className="text-gray-400">Max Score: {q.MaxScore}</span>
                )}
                {q.DurationMinutes && (
                  <span className="flex items-center gap-1 text-gray-500 text-xs">
                    <Timer className="w-3.5 h-3.5" /> {q.DurationMinutes} min
                  </span>
                )}
                {q.QuizType && (
                  <span className="must-badge bg-white/5 text-gray-400 text-xs">{q.QuizType}</span>
                )}
              </div>

              {q.CompletedAt && (
                <p className="text-xs text-gray-500 mt-3">
                  Completed: {new Date(q.CompletedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>

        {quizzes.length === 0 && (
          <div className="glass-card p-12 text-center">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No quizzes found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QuizzesPage;
