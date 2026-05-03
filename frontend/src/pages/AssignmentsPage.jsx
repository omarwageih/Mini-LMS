import { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { ClipboardList, CheckCircle2, Clock, XCircle, Upload } from 'lucide-react';

const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const { data } = await api.get('/student/assignments');
        setAssignments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
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

  const submitted = assignments.filter(a => a.IsSubmitted);
  const pending = assignments.filter(a => !a.IsSubmitted && !a.IsMissed);
  const missed = assignments.filter(a => a.IsMissed);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-must-gold" /> Assignments
          </h1>
          <p className="text-gray-400 mt-1">{assignments.length} total — {submitted.length} submitted, {pending.length} pending</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-2xl font-bold text-emerald-400">{submitted.length}</p>
            <p className="text-xs text-gray-400 mt-1">Submitted</p>
          </div>
          <div className="stat-card animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
            <Clock className="w-5 h-5 text-amber-400 mb-2" />
            <p className="text-2xl font-bold text-amber-400">{pending.length}</p>
            <p className="text-xs text-gray-400 mt-1">Pending</p>
          </div>
          <div className="stat-card animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
            <XCircle className="w-5 h-5 text-red-400 mb-2" />
            <p className="text-2xl font-bold text-red-400">{missed.length}</p>
            <p className="text-xs text-gray-400 mt-1">Missed</p>
          </div>
        </div>

        {/* Assignments list */}
        <div className="space-y-3">
          {assignments.map((a, i) => {
            const isSubmitted = a.IsSubmitted;
            const isMissed = a.IsMissed;
            const isGraded = a.MyScore !== null && a.MyScore !== undefined;
            
            return (
              <div
                key={a.AssignmentID}
                className={`glass-card p-5 animate-fade-in-up transition-all ${isMissed ? 'border-red-500/20' : isSubmitted ? 'border-emerald-500/10' : 'hover:border-must-gold/20'}`}
                style={{ opacity: 0, animationDelay: `${0.15 + i * 0.05}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-white">{a.Title}</h3>
                      {isSubmitted && isGraded && (
                        <span className="must-badge bg-emerald-500/10 text-emerald-400">
                          {a.MyScore}/{a.MaxScore}
                        </span>
                      )}
                      {isSubmitted && !isGraded && (
                        <span className="must-badge bg-blue-500/10 text-blue-400">Awaiting Grade</span>
                      )}
                      {isMissed && (
                        <span className="must-badge bg-red-500/10 text-red-400">Missed</span>
                      )}
                      {!isSubmitted && !isMissed && (
                        <span className="must-badge bg-amber-500/10 text-amber-400">Pending</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{a.CourseName}</p>
                    {a.Description && <p className="text-xs text-gray-500 mt-1">{a.Description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Max: {a.MaxScore}</span>
                      <span>Method: {a.GradingMethod}</span>
                      {a.Deadline && <span>Due: {new Date(a.Deadline).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {assignments.length === 0 && (
            <div className="glass-card p-12 text-center">
              <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No assignments found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AssignmentsPage;
