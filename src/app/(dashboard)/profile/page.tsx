'use client';

import { useSession } from 'next-auth/react';
import { User, Lock } from 'lucide-react';
import { useState } from 'react';

export default function ProfilePage() {
    const { data: session } = useSession();
    const [formData, setFormData] = useState({ fullName: session?.user?.name || '', email: session?.user?.email || '' });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const handleProfileUpdate = async (e: React.FormEvent) => { e.preventDefault(); alert('Profile updated!'); };
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) { alert('Passwords do not match!'); return; }
        alert('Password changed!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-lg shadow-indigo-500/20">
                    {session?.user?.name?.charAt(0) || 'A'}
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">{session?.user?.name}</h1>
                    <span className="px-3 py-1 rounded-full text-sm mt-2 inline-block bg-indigo-500/20 text-indigo-500">
                        {(session?.user as any)?.role?.replace('_', ' ')}
                    </span>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Profile Card */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-[var(--border-primary)] flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-500" />
                        </div>
                        <h3 className="font-semibold text-[var(--text-primary)]">Profile</h3>
                    </div>
                    <form onSubmit={handleProfileUpdate} className="p-4 sm:p-6 space-y-4">
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                            />
                        </div>
                        <button type="submit" className="btn-primary w-full py-2.5 rounded-xl text-white font-medium">
                            Update Profile
                        </button>
                    </form>
                </div>

                {/* Password Card */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-[var(--border-primary)] flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                            <Lock className="w-4 h-4 text-amber-500" />
                        </div>
                        <h3 className="font-semibold text-[var(--text-primary)]">Change Password</h3>
                    </div>
                    <form onSubmit={handlePasswordChange} className="p-4 sm:p-6 space-y-4">
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Current Password</label>
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">New Password</label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Confirm Password</label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                            />
                        </div>
                        <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 rounded-xl text-white font-medium transition-colors">
                            Change Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
