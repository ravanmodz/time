'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { ToastProvider } from '@/components/Toast';
import { ConfirmDialogProvider } from '@/components/ConfirmDialog';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem={true}
                disableTransitionOnChange={false}
            >
                <ToastProvider>
                    <ConfirmDialogProvider>
                        {children}
                    </ConfirmDialogProvider>
                </ToastProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
