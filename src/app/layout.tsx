import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import DynamicFavicon from '@/components/DynamicFavicon';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Billing Management System',
    description: 'Modern billing management for commercial buildings',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body className={inter.className}>
                <DynamicFavicon />
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
