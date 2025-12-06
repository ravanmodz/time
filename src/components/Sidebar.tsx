'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
    LayoutDashboard,
    Building2,
    Users,
    FileText,
    FolderDown,
    Shield,
    Settings,
    LogOut,
    Menu,
    X,
    Sun,
    Moon,
    ChevronRight,
    User,
    Link2,
    Store,
    Activity
} from 'lucide-react';

// Menu items based on role
const menuConfig = {
    owner: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Buildings', href: '/buildings', icon: Building2 },
        { name: 'Add Shops', href: '/add-shops', icon: Store },
        { name: 'Users', href: '/shopusers', icon: Users },
        { name: 'Assign Shops', href: '/assign-shop', icon: Link2 },
        { name: 'Bills', href: '/bills', icon: FileText },
        { name: 'Import/Export', href: '/export', icon: FolderDown },
        { name: 'Admins', href: '/admins', icon: Shield },
        { name: 'Activity Log', href: '/activity', icon: Activity },
        { name: 'Profile', href: '/profile', icon: User },
        { name: 'Settings', href: '/settings', icon: Settings },
    ],
    admin: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Add Shops', href: '/add-shops', icon: Store },
        { name: 'Users', href: '/shopusers', icon: Users },
        { name: 'Assign Shops', href: '/assign-shop', icon: Link2 },
        { name: 'Bills', href: '/bills', icon: FileText },
        { name: 'Import/Export', href: '/export', icon: FolderDown },
        { name: 'Profile', href: '/profile', icon: User },
        { name: 'Settings', href: '/settings', icon: Settings },
    ],
    user: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Shops', href: '/my-shops', icon: Store },
        { name: 'Bills', href: '/bills', icon: FileText },
        { name: 'Profile', href: '/profile', icon: User },
    ]
};

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const { resolvedTheme } = useTheme();
    const [appName, setAppName] = useState('');
    const [appLogo, setAppLogo] = useState('');
    const [logoType, setLogoType] = useState<'emoji' | 'image'>('emoji');
    const [mounted, setMounted] = useState(false);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    const userRole = (session?.user as any)?.role || 'user';
    const menuItems = menuConfig[userRole as keyof typeof menuConfig] || menuConfig.user;

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setAppName(data.appName || 'BillManager');
                setAppLogo(data.appLogo || '🏢');
                setLogoType(data.logoType || 'emoji');
            }
        } catch (error) {
            setAppName('BillManager');
            setAppLogo('🏢');
        } finally {
            setSettingsLoaded(true);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchSettings();
        const handleSettingsChange = () => fetchSettings();
        window.addEventListener('appSettingsChanged', handleSettingsChange);
        return () => window.removeEventListener('appSettingsChanged', handleSettingsChange);
    }, []);

    if (!mounted || !settingsLoaded) return null;

    const LogoComponent = () => {
        if (logoType === 'image' && appLogo?.startsWith('data:')) {
            return <img src={appLogo} alt="Logo" className="w-full h-full rounded-full object-cover" />;
        }
        return <span className="text-xl">{appLogo || '🏢'}</span>;
    };

    const userName = session?.user?.name || 'User';
    const roleColors = {
        owner: 'from-amber-500 to-amber-600',
        admin: 'from-indigo-500 to-indigo-600',
        user: 'from-green-500 to-green-600'
    };
    const roleColor = roleColors[userRole as keyof typeof roleColors] || roleColors.user;

    return (
        <>
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--bg-sidebar)] border-b border-[var(--border-primary)] px-4 h-16 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                        <LogoComponent />
                    </div>
                    <span className="text-lg font-bold text-indigo-500">{appName}</span>
                </Link>
                <button onClick={() => setIsOpen(!isOpen)} className="p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </header>

            {isOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40 pt-16" onClick={() => setIsOpen(false)} />}

            {/* Mobile Slide Menu */}
            <div className={`lg:hidden fixed top-16 right-0 h-[calc(100vh-4rem)] w-72 bg-[var(--bg-sidebar)] border-l border-[var(--border-primary)] z-50 transform transition-transform flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* User Info - Fixed at top */}
                <div className="p-4 border-b border-[var(--border-primary)] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white bg-gradient-to-br ${roleColor}`}>
                            {userName.charAt(0)}
                        </div>
                        <div>
                            <p className="font-medium text-[var(--text-primary)]">{userName}</p>
                            <p className="text-xs text-[var(--text-muted)] capitalize">{userRole.replace('_', ' ')}</p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Menu */}
                <nav className="flex-1 overflow-y-auto p-4">
                    <ul className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href}>
                                    <Link href={item.href} onClick={() => setIsOpen(false)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-500/10 text-indigo-500 font-medium' : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]'}`}>
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-5 h-5" />
                                            <span>{item.name}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </li>
                            );
                        })}
                        {/* Logout Button */}
                        <li className="pt-4 mt-4 border-t border-[var(--border-primary)]">
                            <div className="flex items-center gap-2 px-4 py-2 mb-2 text-sm text-[var(--text-muted)]">
                                {resolvedTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                                <span className="capitalize">{resolvedTheme} Mode</span>
                            </div>
                            <button onClick={() => signOut({ callbackUrl: '/login' })} className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl">
                                <LogOut className="w-5 h-5" />
                                <span>Logout</span>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col fixed top-0 left-0 h-screen w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-primary)] z-40">
                <div className="p-6 border-b border-[var(--border-primary)]">
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                            <LogoComponent />
                        </div>
                        <span className="text-xl font-bold text-indigo-500">{appName}</span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 overflow-y-auto">
                    <ul className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href}>
                                    <Link href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-500/10 text-indigo-500 font-medium' : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]'}`}>
                                        <Icon className="w-5 h-5" />
                                        <span>{item.name}</span>
                                        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--border-primary)] bg-[var(--bg-sidebar)]">
                    <Link href="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-hover)]">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-white bg-gradient-to-br ${roleColor}`}>
                            {userName.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-[var(--text-primary)]">{userName}</p>
                            <p className="text-xs text-[var(--text-muted)] capitalize">{userRole.replace('_', ' ')}</p>
                        </div>
                    </Link>
                    <button onClick={() => signOut({ callbackUrl: '/login' })} className="flex items-center gap-3 w-full px-4 py-3 mt-2 text-red-500 hover:bg-red-500/10 rounded-xl">
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
