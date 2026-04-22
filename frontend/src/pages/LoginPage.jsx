import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-must-blue-light via-must-blue-dark to-[#000810]">
      <div className="glass-card w-full max-w-md p-10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-must-gold/10 blur-3xl -mr-16 -mt-16 rounded-full" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-must-blue-light/20 blur-3xl -ml-16 -mb-16 rounded-full" />

        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-must-gold rounded-2xl flex items-center justify-center shadow-lg shadow-must-gold/20 mb-4 rotate-3">
             <LogIn className="w-8 h-8 text-must-blue-dark" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">University Portal</h1>
          <p className="text-gray-400 mt-2 font-medium">Welcome back, Developer 1</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 animate-in fade-in slide-in-from-top-4 duration-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 ml-1">Email Address</label>
            <div className="relative group">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-must-gold transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="must-input pl-12"
                placeholder="name@must.edu.eg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-must-gold transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="must-input pl-12"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="must-button flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <span className="w-6 h-6 border-2 border-must-blue-dark/30 border-t-must-blue-dark rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400 text-sm relative z-10">
          Don't have an account?{' '}
          <Link to="/register" className="text-must-gold hover:text-must-gold-light font-bold underline-offset-4 hover:underline transition-all">
            Contact Administration
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
