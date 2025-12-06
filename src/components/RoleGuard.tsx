'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldX } from 'lucide-react';

type Role = 'owner' | 'admin' | 'user';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: Role[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.replace('/login');
            return;
        }

        const userRole = (session.user as any)?.role as Role;

        if (allowedRoles.includes(userRole)) {
            setIsAuthorized(true);
        } else {
            setIsAuthorized(false);
            // Redirect after showing message briefly
            setTimeout(() => {
                router.replace('/dashboard');
            }, 1500);
        }
    }, [session, status, allowedRoles, router]);

    // Loading state
    if (status === 'loading' || isAuthorized === null) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Access denied
    if (isAuthorized === false) {
        return (
            <div className="flex flex-col items-center justify-center h-64 animate-fadeIn">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                    <ShieldX className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Access Denied</h2>
                <p className="text-[var(--text-tertiary)]">You don't have permission to access this page.</p>
                <p className="text-sm text-[var(--text-muted)] mt-2">Redirecting to dashboard...</p>
            </div>
        );
    }

    return <>{children}</>;
}
