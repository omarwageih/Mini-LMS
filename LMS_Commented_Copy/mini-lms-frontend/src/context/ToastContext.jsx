/**
 * TOAST NOTIFICATION SYSTEM
 * This context provides a way to show "pop-up" alerts (toasts) from anywhere in the app.
 * For example: "Login successful" or "Assignment submitted".
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // For smooth animations
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react'; // Icons

// Create the context
const ToastContext = createContext();

/**
 * PROVIDER COMPONENT
 * Manages a list of active toasts and renders them in a fixed container.
 */
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    /**
     * showToast()
     * The primary function used by other components to trigger an alert.
     * @param {string} message - The text to display
     * @param {string} type - 'success', 'error', or 'info'
     */
    const showToast = useCallback((message, type = 'success') => {
        const id = Math.random().toString(36).substr(2, 9); // Unique ID for each toast
        
        // 1. Add the new toast to the list
        setToasts(prev => [...prev, { id, message, type }]);
        
        // 2. Auto-remove the toast after 4 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            
            {/* TOAST CONTAINER: Positioned in the bottom-right corner */}
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
                            {/* Icon Section */}
                            <div className={`p-2 rounded-xl ${toast.type === 'success' ? 'bg-emerald-500/20' : toast.type === 'error' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                                {toast.type === 'success' && <CheckCircle2 size={18} />}
                                {toast.type === 'error' && <AlertCircle size={18} />}
                                {toast.type === 'info' && <Info size={18} />}
                            </div>
                            
                            {/* Text Section */}
                            <div className="flex-1">
                                <p className="text-[11px] font-black uppercase tracking-widest leading-none">
                                    {toast.type === 'success' ? 'Operation Success' : toast.type === 'error' ? 'System Error' : 'System Note'}
                                </p>
                                <p className="text-sm font-bold mt-1 text-slate-800 dark:text-white/90">{toast.message}</p>
                            </div>

                            {/* Manual Close Button */}
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

/**
 * Custom Hook: useToast()
 * Allows any component to call showToast("hello")
 */
export const useToast = () => useContext(ToastContext);
