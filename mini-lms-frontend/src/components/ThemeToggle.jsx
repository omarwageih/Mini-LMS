import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`p-3 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${
                isDarkMode
                    ? 'bg-slate-800 border-white/10 text-yellow-400 hover:bg-slate-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
            } ${className}`}
            aria-label="Toggle theme"
        >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
};

export default ThemeToggle;
