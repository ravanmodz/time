'use client';

import { useState, useEffect } from 'react';
import { Activity, Plus, Edit, Trash2, LogIn, LogOut, RefreshCw, Filter, Clock, User, Target, ChevronDown } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';

interface ActivityLogItem {
    _id: string;
    action: string;
    actionType: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'other';
    userName: string;
    userRole: string;
    targetType?: string;
    targetName?: string;
    details?: string;
    createdAt: string;
}

const actionIcons = {
    create: { icon: Plus, color: 'text-green-500', bg: 'bg-green-500/10' },
    update: { icon: Edit, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    delete: { icon: Trash2, color: 'text-red-500', bg: 'bg-red-500/10' },
    login: { icon: LogIn, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    logout: { icon: LogOut, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    other: { icon: Activity, color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

const actionLabels = {
    create: 'Added',
    update: 'Updated',
    delete: 'Deleted',
    login: 'Logged In',
    logout: 'Logged Out',
    other: 'Action',
};

export default function ActivityPage() {
    const [logs, setLogs] = useState<ActivityLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('');
    const [limit, setLimit] = useState(50);

    useEffect(() => {
        fetchLogs();
    }, [filter, limit]);

    const fetchLogs = async () => {
        try {
            let url = `/api/activity?limit=${limit}`;
            if (filter) url += `&actionType=${filter}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        // Less than 1 minute
        if (diff < 60000) return 'Just now';
        // Less than 1 hour
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
        // Less than 24 hours
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        // Less than 7 days
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;

        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRoleBadge = (role: string) => {
        const badges: Record<string, string> = {
            owner: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            admin: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
            user: 'bg-green-500/10 text-green-500 border-green-500/20',
        };
        return badges[role] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <RoleGuard allowedRoles={['owner']}>
            <div className="space-y-6 animate-fadeIn">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Activity Log</h1>
                        <p className="text-[var(--text-tertiary)] mt-1">Track all system activities and changes</p>
                    </div>
                    <button
                        onClick={() => { setLoading(true); fetchLogs(); }}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {['all', 'create', 'update', 'delete', 'login', 'logout'].map((type) => {
                        const count = type === 'all'
                            ? logs.length
                            : logs.filter(l => l.actionType === type).length;
                        const config = type === 'all'
                            ? { icon: Activity, color: 'text-slate-500', bg: 'bg-slate-500/10' }
                            : actionIcons[type as keyof typeof actionIcons];
                        const Icon = config.icon;

                        return (
                            <button
                                key={type}
                                onClick={() => setFilter(type === 'all' ? '' : type)}
                                className={`p-4 rounded-2xl border transition-all ${(filter === type || (type === 'all' && !filter))
                                        ? 'bg-indigo-500/10 border-indigo-500/30'
                                        : 'bg-[var(--bg-card)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
                                    }`}
                            >
                                <div className={`w-8 h-8 ${config.bg} rounded-lg flex items-center justify-center mb-2`}>
                                    <Icon className={`w-4 h-4 ${config.color}`} />
                                </div>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{count}</p>
                                <p className="text-xs text-[var(--text-muted)] capitalize">{type === 'all' ? 'Total' : type}</p>
                            </button>
                        );
                    })}
                </div>

                {/* Activity Timeline */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            <h2 className="font-semibold text-[var(--text-primary)]">Recent Activity</h2>
                        </div>
                        <div className="relative">
                            <select
                                value={limit}
                                onChange={(e) => setLimit(parseInt(e.target.value))}
                                className="px-3 py-1.5 pr-8 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] appearance-none"
                            >
                                <option value={25}>Last 25</option>
                                <option value={50}>Last 50</option>
                                <option value={100}>Last 100</option>
                                <option value={200}>Last 200</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        </div>
                    </div>

                    {logs.length === 0 ? (
                        <div className="p-12 text-center">
                            <Activity className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)] opacity-50" />
                            <p className="text-[var(--text-muted)]">No activity logs found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--border-primary)]">
                            {logs.map((log, index) => {
                                const config = actionIcons[log.actionType] || actionIcons.other;
                                const Icon = config.icon;

                                return (
                                    <div
                                        key={log._id}
                                        className="p-4 hover:bg-[var(--bg-hover)] transition-colors"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                                <Icon className={`w-5 h-5 ${config.color}`} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="font-medium text-[var(--text-primary)]">
                                                            {log.action}
                                                        </p>
                                                        {log.details && (
                                                            <p className="text-sm text-[var(--text-muted)] mt-0.5">
                                                                {log.details}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-[var(--text-muted)] whitespace-nowrap flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(log.createdAt)}
                                                    </span>
                                                </div>

                                                {/* Meta info */}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                                        <User className="w-3 h-3" />
                                                        {log.userName}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadge(log.userRole)}`}>
                                                        {log.userRole}
                                                    </span>
                                                    {log.targetName && (
                                                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                                            <Target className="w-3 h-3" />
                                                            {log.targetType}: {log.targetName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </RoleGuard>
    );
}
