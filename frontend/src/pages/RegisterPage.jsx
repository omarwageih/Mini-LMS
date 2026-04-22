import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, Phone, Trophy, AlertCircle } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    userType: 'Student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-must-blue-light via-must-blue-dark to-[#000810]">
      <div className="glass-card w-full max-w-lg p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-must-gold/10 blur-3xl -mr-16 -mt-16 rounded-full" />

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-must-gold rounded-2xl flex items-center justify-center shadow-lg mb-4">
             <UserPlus className="w-8 h-8 text-must-blue-dark" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-gray-400 mt-2 font-medium">Join MUST University LMS</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 animate-in fade-in slide-in-from-top-4 duration-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-300 mb-2 ml-1">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-must-gold transition-colors" />
              <input
                name="fullName"
                type="text"
                onChange={handleChange}
                className="must-input pl-12"
                placeholder="Ahmed Mohamed"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-must-gold transition-colors" />
              <input
                name="email"
                type="email"
                onChange={handleChange}
                className="must-input pl-12"
                placeholder="ahmed@must.edu.eg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 ml-1">Phone</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-must-gold transition-colors" />
              <input
                name="phone"
                type="text"
                onChange={handleChange}
                className="must-input pl-12"
                placeholder="+20 123 456 7890"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-must-gold transition-colors" />
              <input
                name="password"
                type="password"
                onChange={handleChange}
                className="must-input pl-12"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 ml-1">Role</label>
            <div className="relative group">
              <Trophy className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-must-gold transition-colors" />
              <select
                name="userType"
                onChange={handleChange}
                className="must-input pl-12 appearance-none h-[50px]"
                required
              >
                <option value="Student">Student</option>
                <option value="Instructor">Instructor</option>
                <option value="Assistant">Assistant</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="must-button flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="w-6 h-6 border-2 border-must-blue-dark/30 border-t-must-blue-dark rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-gray-400 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-must-gold hover:text-must-gold-light font-bold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
