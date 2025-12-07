'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Sparkles } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        // Return a dummy implementation for non-provider usage
        return {
            showToast: () => { },
            success: () => { },
            error: () => { },
            warning: () => { },
            info: () => { },
        };
    }
    return context;
}

const iconConfig = {
    success: {
        Icon: CheckCircle,
        bgGradient: 'from-emerald-500 to-green-600',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        borderColor: 'border-emerald-200',
        glowColor: 'shadow-emerald-500/25',
    },
    error: {
        Icon: XCircle,
        bgGradient: 'from-red-500 to-rose-600',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        borderColor: 'border-red-200',
        glowColor: 'shadow-red-500/25',
    },
    warning: {
        Icon: AlertTriangle,
        bgGradient: 'from-amber-500 to-orange-600',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        borderColor: 'border-amber-200',
        glowColor: 'shadow-amber-500/25',
    },
    info: {
        Icon: Info,
        bgGradient: 'from-blue-500 to-indigo-600',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        borderColor: 'border-blue-200',
        glowColor: 'shadow-blue-500/25',
    },
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const config = iconConfig[toast.type];
    const { Icon } = config;
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // Animate in
        setTimeout(() => setIsVisible(true), 10);

        // Auto close
        const timer = setTimeout(() => {
            handleClose();
        }, toast.duration || 3000);

        return () => clearTimeout(timer);
    }, [toast.duration]);

    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(() => onClose(), 300);
    };

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${isVisible && !isLeaving ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent'
                }`}
            onClick={handleClose}
        >
            <div
                className={`relative transform transition-all duration-300 ${isVisible && !isLeaving
                        ? 'scale-100 opacity-100 translate-y-0'
                        : 'scale-75 opacity-0 translate-y-4'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Main Card */}
                <div className={`bg-white dark:bg-slate-800 rounded-3xl shadow-2xl ${config.glowColor} p-8 min-w-[360px] max-w-[420px] border ${config.borderColor} dark:border-slate-700`}>

                    {/* Decorative gradient top bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${config.bgGradient} rounded-t-3xl`} />

                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Content */}
                    <div className="flex flex-col items-center text-center pt-2">
                        {/* Animated Icon */}
                        <div className={`relative w-20 h-20 rounded-full ${config.iconBg} flex items-center justify-center mb-5`}>
                            {/* Pulse ring animation */}
                            <div className={`absolute inset-0 rounded-full ${config.iconBg} animate-ping opacity-75`} />

                            {/* Icon */}
                            <Icon className={`relative w-10 h-10 ${config.iconColor} animate-bounce-once`} strokeWidth={2.5} />

                            {/* Success sparkle */}
                            {toast.type === 'success' && (
                                <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-500 animate-pulse" />
                            )}
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                            {toast.title}
                        </h3>

                        {/* Message */}
                        {toast.message && (
                            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed max-w-[280px]">
                                {toast.message}
                            </p>
                        )}

                        {/* Action Button */}
                        <button
                            onClick={handleClose}
                            className={`mt-6 px-10 py-3 bg-gradient-to-r ${config.bgGradient} text-white rounded-xl font-semibold text-base hover:shadow-lg hover:scale-105 transition-all duration-200`}
                        >
                            {toast.type === 'success' ? 'Great!' : toast.type === 'error' ? 'Try Again' : 'OK'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (type: ToastType, title: string, message?: string, duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, type, title, message, duration }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const value: ToastContextType = {
        showToast,
        success: (title, message) => showToast('success', title, message),
        error: (title, message) => showToast('error', title, message),
        warning: (title, message) => showToast('warning', title, message),
        info: (title, message) => showToast('info', title, message),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* Render toasts */}
            {toasts.length > 0 && toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </ToastContext.Provider>
    );
}

// Export for use in pages
export default ToastProvider;
