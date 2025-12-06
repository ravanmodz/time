'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // App settings
    const [appName, setAppName] = useState('');
    const [appLogo, setAppLogo] = useState('');
    const [logoType, setLogoType] = useState<'emoji' | 'image'>('emoji');
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                username,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid username or password');
                setLoading(false);
            } else if (result?.ok) {
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err) {
            setError('An error occurred');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-[500px] h-[500px] bg-indigo-500 rounded-full filter blur-[80px] opacity-30 -top-[200px] -right-[100px]" />
                <div className="absolute w-[400px] h-[400px] bg-green-500 rounded-full filter blur-[80px] opacity-30 -bottom-[150px] -left-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-8">
                    <div className="text-center mb-8">
                        {settingsLoaded ? (
                            <>
                                {logoType === 'image' && appLogo && appLogo.startsWith('data:') ? (
                                    <img
                                        src={appLogo}
                                        alt="Logo"
                                        className="w-16 h-16 rounded-full object-cover mx-auto mb-4 shadow-lg shadow-indigo-500/30"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30 text-3xl">
                                        {appLogo || '🏢'}
                                    </div>
                                )}
                                <h1 className="text-2xl font-bold text-white mb-1">{appName || 'BillManager'}</h1>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-4 animate-pulse" />
                                <div className="h-7 w-40 bg-slate-700 rounded mx-auto mb-1 animate-pulse" />
                            </>
                        )}
                        <p className="text-slate-400">Sign in to your account</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 mb-6">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                                <User className="w-4 h-4" /> Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                placeholder="Enter username"
                                required
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                                <Lock className="w-4 h-4" /> Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                    placeholder="Enter password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 transition"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-700 text-center text-sm text-slate-500">
                        Default: admin / admin123
                    </div>
                </div>
            </div>
        </div>
    );
}
