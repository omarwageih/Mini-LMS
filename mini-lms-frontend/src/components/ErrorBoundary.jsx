import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#020617] px-4">
                    <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl p-11 rounded-[3rem] border border-white dark:border-white/5 shadow-2xl text-center space-y-6 max-w-md">
                        <div className="text-6xl">💥</div>
                        <h2 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic">
                            Something Went Wrong
                        </h2>
                        <p className="text-slate-400 text-sm">
                            An unexpected error occurred. Please refresh the page and try again.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 btn-grad rounded-2xl text-white font-black text-[11px] uppercase tracking-widest"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
