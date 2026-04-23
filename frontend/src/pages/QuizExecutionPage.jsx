import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { Timer, Send, HelpCircle, ChevronRight, CheckCircle2 } from 'lucide-react';

const QuizExecutionPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(1800); // 30 mins default
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSelect = (index) => {
        if (submitted) return;
        setAnswers(prev => ({ ...prev, [questions[currentIndex].QuestionID]: index }));
    };

    const handleSubmit = async () => {
        if (submitted) return;
        setLoading(true);
        try {
            const { data } = await api.post(`/student/quizzes/${id}/submit`, { answers });
            setScore(data.score);
            setSubmitted(true);
        } catch (error) {
            console.error('Quiz submission failed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const { data } = await api.get(`/student/quizzes/${id}/questions`);
                setQuestions(data);
            } catch {
                navigate('/quizzes');
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [id, navigate]);

    useEffect(() => {
        if (timeLeft <= 0 && !submitted) {
            handleSubmit();
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, submitted]);

    if (loading && !submitted) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="w-10 h-10 border-3 border-must-gold/30 border-t-must-gold rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (submitted) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 animate-fade-in-up">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-white">Quiz Completed!</h2>
                        <p className="text-gray-400 mt-2">Your submission has been recorded.</p>
                    </div>
                    <div className="glass-card p-8 min-w-[300px] text-center">
                        <p className="text-sm text-gray-400 uppercase tracking-widest font-bold">Your Score</p>
                        <p className="text-5xl font-black text-must-gold mt-2">{score?.toFixed(1)}</p>
                    </div>
                    <button 
                        onClick={() => navigate('/quizzes')}
                        className="btn-primary px-8"
                    >
                        Back to Quizzes
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    const currentQ = questions[currentIndex];

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                {/* Quiz Header */}
                <div className="flex items-center justify-between glass-card p-4 sticky top-6 z-10 animate-fade-in-down">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-must-gold/20 rounded-xl flex items-center justify-center">
                            <HelpCircle className="w-6 h-6 text-must-gold" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Question</p>
                            <p className="text-lg font-bold text-white leading-none">{currentIndex + 1} / {questions.length}</p>
                        </div>
                    </div>

                    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-colors ${timeLeft < 300 ? 'bg-red-500/10 text-red-400 animate-pulse' : 'bg-white/5 text-gray-300'}`}>
                        <Timer className="w-5 h-5" />
                        <span className="text-xl font-mono font-bold">{formatTime(timeLeft)}</span>
                    </div>
                </div>

                {/* Question Area */}
                <div className="glass-card p-8 animate-fade-in-up">
                    <h2 className="text-xl text-white font-medium mb-8 leading-relaxed">
                        {currentQ?.QuestionText}
                    </h2>

                    <div className="grid grid-cols-1 gap-3">
                        {currentQ?.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSelect(idx)}
                                className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between group ${
                                    answers[currentQ.QuestionID] === idx
                                    ? 'bg-must-gold/10 border-must-gold/50 text-white'
                                    : 'bg-white/3 border-white/5 text-gray-400 hover:bg-white/5 hover:border-white/10'
                                }`}
                            >
                                <span className="flex items-center gap-4">
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${
                                        answers[currentQ.QuestionID] === idx
                                        ? 'bg-must-gold text-must-blue-dark border-must-gold'
                                        : 'bg-white/5 border-white/10'
                                    }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    {option}
                                </span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                    answers[currentQ.QuestionID] === idx
                                    ? 'bg-must-gold border-must-gold text-must-blue-dark scale-110'
                                    : 'border-white/20 group-hover:border-white/40'
                                }`}>
                                    {answers[currentQ.QuestionID] === idx && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <button 
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:bg-white/10 disabled:opacity-30 transition-all font-medium"
                    >
                        Previous
                    </button>

                    {currentIndex < questions.length - 1 ? (
                        <button 
                            onClick={() => setCurrentIndex(prev => prev + 1)}
                            className="btn-primary px-8 group"
                        >
                            Next Question <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <button 
                            onClick={handleSubmit}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Send className="w-4 h-4" /> Submit Quiz
                        </button>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default QuizExecutionPage;
