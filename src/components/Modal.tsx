'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    icon?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', icon }: ModalProps) {
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setIsClosing(false);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 150);
    };

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay with fade animation */}
            <div
                className={`absolute inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'animate-backdropFadeIn'
                    }`}
                onClick={handleClose}
            />

            {/* Modal with scale animation */}
            <div className={`
                relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden
                bg-[var(--bg-modal)] border border-[var(--border-primary)] rounded-2xl
                shadow-2xl shadow-black/20
                transition-all duration-200
                ${isClosing ? 'opacity-0 scale-95' : 'animate-scaleIn'}
            `}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[var(--border-primary)]">
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                {icon}
                            </div>
                        )}
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-hover)] transition-all group"
                    >
                        <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                    {children}
                </div>
            </div>
        </div>
    );
}
