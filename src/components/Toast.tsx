'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

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
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
};

const colors = {
    success: {
        bg: 'bg-green-500',
        border: 'border-green-400',
        icon: 'text-green-500',
        iconBg: 'bg-green-100',
    },
    error: {
        bg: 'bg-red-500',
        border: 'border-red-400',
        icon: 'text-red-500',
        iconBg: 'bg-red-100',
    },
    warning: {
        bg: 'bg-yellow-500',
        border: 'border-yellow-400',
        icon: 'text-yellow-500',
        iconBg: 'bg-yellow-100',
    },
    info: {
        bg: 'bg-blue-500',
        border: 'border-blue-400',
        icon: 'text-blue-500',
        iconBg: 'bg-blue-100',
    },
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const Icon = icons[toast.type];
    const color = colors[toast.type];

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, toast.duration || 3000);
        return () => clearTimeout(timer);
    }, [toast.duration, onClose]);

    return (
        <div className="animate-slideIn transform transition-all duration-300 ease-out">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 min-w-[320px] max-w-[400px]">
                {/* Icon */}
                <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full ${color.iconBg} flex items-center justify-center mb-4 animate-bounce-once`}>
                        <Icon className={`w-8 h-8 ${color.icon}`} />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                        {toast.title}
                    </h3>

                    {/* Message */}
                    {toast.message && (
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {toast.message}
                        </p>
                    )}

                    {/* OK Button */}
                    <button
                        onClick={onClose}
                        className={`mt-4 px-8 py-2.5 ${color.bg} text-white rounded-lg font-medium hover:opacity-90 transition-all transform hover:scale-105`}
                    >
                        OK
                    </button>
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                    <X className="w-5 h-5" />
                </button>
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

            {/* Toast Container - Sweet Alert Style (Center) */}
            {toasts.length > 0 && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    {toasts.map((toast) => (
                        <ToastItem
                            key={toast.id}
                            toast={toast}
                            onClose={() => removeToast(toast.id)}
                        />
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
}

// Simple inline toast for non-provider usage
export function showAlert(type: ToastType, title: string, message?: string) {
    // Create a temporary container
    const container = document.createElement('div');
    container.id = 'temp-toast';
    document.body.appendChild(container);

    // Render toast
    const Icon = icons[type];
    const color = colors[type];

    container.innerHTML = `
        <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onclick="this.remove()">
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 min-w-[320px] max-w-[400px] animate-pulse">
                <div class="flex flex-col items-center text-center">
                    <div class="w-16 h-16 rounded-full ${color.iconBg} flex items-center justify-center mb-4">
                        <svg class="w-8 h-8 ${color.icon}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            ${type === 'success' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>' : ''}
                            ${type === 'error' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>' : ''}
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-2">${title}</h3>
                    ${message ? `<p class="text-slate-500 text-sm">${message}</p>` : ''}
                    <button onclick="document.getElementById('temp-toast').remove()" class="mt-4 px-8 py-2.5 ${color.bg} text-white rounded-lg font-medium">OK</button>
                </div>
            </div>
        </div>
    `;

    // Auto-remove after 3 seconds
    setTimeout(() => {
        container.remove();
    }, 3000);
}
