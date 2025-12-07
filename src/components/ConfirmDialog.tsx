'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface ConfirmDialogOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

interface ConfirmDialogContextType {
    confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export function useConfirmDialog() {
    const context = useContext(ConfirmDialogContext);
    if (!context) {
        return {
            confirm: async () => false,
        };
    }
    return context;
}

interface DialogState {
    isOpen: boolean;
    options: ConfirmDialogOptions;
    resolve: ((value: boolean) => void) | null;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
    const [dialog, setDialog] = useState<DialogState>({
        isOpen: false,
        options: { title: '', message: '' },
        resolve: null,
    });

    const confirm = (options: ConfirmDialogOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setDialog({
                isOpen: true,
                options,
                resolve,
            });
        });
    };

    const handleConfirm = () => {
        dialog.resolve?.(true);
        setDialog((prev) => ({ ...prev, isOpen: false }));
    };

    const handleCancel = () => {
        dialog.resolve?.(false);
        setDialog((prev) => ({ ...prev, isOpen: false }));
    };

    const typeConfig = {
        danger: {
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            confirmBg: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700',
            Icon: Trash2,
        },
        warning: {
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            confirmBg: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
            Icon: AlertTriangle,
        },
        info: {
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            confirmBg: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
            Icon: AlertTriangle,
        },
    };

    const config = typeConfig[dialog.options.type || 'danger'];
    const { Icon } = config;

    return (
        <ConfirmDialogContext.Provider value={{ confirm }}>
            {children}

            {/* Confirm Dialog */}
            {dialog.isOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
                    onClick={handleCancel}
                >
                    <div
                        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 min-w-[380px] max-w-[450px] mx-4 border border-slate-200 dark:border-slate-700 transform animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={handleCancel}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Content */}
                        <div className="flex flex-col items-center text-center">
                            {/* Icon */}
                            <div className={`w-20 h-20 rounded-full ${config.iconBg} flex items-center justify-center mb-5`}>
                                <Icon className={`w-10 h-10 ${config.iconColor}`} strokeWidth={2} />
                            </div>

                            {/* Title */}
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
                                {dialog.options.title}
                            </h3>

                            {/* Message */}
                            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed mb-6">
                                {dialog.options.message}
                            </p>

                            {/* Buttons */}
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                                >
                                    {dialog.options.cancelText || 'Cancel'}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`flex-1 px-6 py-3 ${config.confirmBg} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200`}
                                >
                                    {dialog.options.confirmText || 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmDialogContext.Provider>
    );
}

export default ConfirmDialogProvider;
