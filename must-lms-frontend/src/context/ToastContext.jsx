import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            
            {/* Toast Container */}
            <div className="fixed bottom-10 right-10 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                            className={`
                                pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-4 min-w-[300px]
                                ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                                  toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
                                  'bg-blue-500/10 border-blue-500/20 text-blue-500'}
                            `}
                        >
                            <div className={`p-2 rounded-xl ${toast.type === 'success' ? 'bg-emerald-500/20' : toast.type === 'error' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                                {toast.type === 'success' && <CheckCircle2 size={18} />}
                                {toast.type === 'error' && <AlertCircle size={18} />}
                                {toast.type === 'info' && <Info size={18} />}
                            </div>
                            
                            <div className="flex-1">
                                <p className="text-[11px] font-black uppercase tracking-widest leading-none">
                                    {toast.type === 'success' ? 'Operation Success' : toast.type === 'error' ? 'System Error' : 'System Note'}
                                </p>
                                <p className="text-sm font-bold mt-1 text-slate-800 dark:text-white/90">{toast.message}</p>
                            </div>

                            <button 
                                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
