'use client';

import { useState, useEffect } from 'react';
import { Activity, Trash2, Edit, Plus, LogIn, LogOut, RefreshCw } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';

interface ActivityLog {
    _id: string;
    action: string;
    actionType: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'other';
    userName: string;
    userRole: string;
    targetType?: string;
    targetName?: string;
    createdAt: string;
}

export default function ActivityPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const url = filter === 'all' ? '/api/activity' : `/api/activity?actionType=${filter}`;
            const res = await fetch(url);
            const data = await res.json();
            setLogs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (type: string) => {
        switch (type) {
            case 'create': return <Plus className="w-4 h-4 text-green-500" />;
            case 'update': return <Edit className="w-4 h-4 text-blue-500" />;
            case 'delete': return <Trash2 className="w-4 h-4 text-red-500" />;
            case 'login': return <LogIn className="w-4 h-4 text-indigo-500" />;
            case 'logout': return <LogOut className="w-4 h-4 text-orange-500" />;
            default: return <Activity className="w-4 h-4 text-gray-500" />;
        }
    };

    const getActionColor = (type: string) => {
        switch (type) {
            case 'create': return 'bg-green-500/10 text-green-500';
            case 'update': return 'bg-blue-500/10 text-blue-500';
            case 'delete': return 'bg-red-500/10 text-red-500';
            case 'login': return 'bg-indigo-500/10 text-indigo-500';
            case 'logout': return 'bg-orange-500/10 text-orange-500';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Activity Log</h1>
                        <p className="text-[var(--text-tertiary)] mt-1">Track all admin activities and changes</p>
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-5 h-5 text-[var(--text-tertiary)]" />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {['all', 'create', 'update', 'delete', 'login', 'logout'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === type
                                ? 'bg-indigo-500 text-white'
                                : 'bg-[var(--bg-card)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]'
                                }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Activity List */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
                    {logs.length === 0 ? (
                        <div className="text-center py-12 text-[var(--text-muted)]">
                            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No activity logs found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--border-primary)]">
                            {logs.map((log) => (
                                <div key={log._id} className="p-4 hover:bg-[var(--bg-hover)] transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActionColor(log.actionType)}`}>
                                            {getActionIcon(log.actionType)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[var(--text-primary)] font-medium">{log.action}</p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-sm text-[var(--text-tertiary)]">
                                                    by <span className="font-medium">{log.userName}</span>
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${log.userRole === 'owner'
                                                    ? 'bg-amber-500/20 text-amber-500'
                                                    : 'bg-indigo-500/20 text-indigo-500'
                                                    }`}>
                                                    {log.userRole.replace('_', ' ')}
                                                </span>
                                                {log.targetType && (
                                                    <span className="text-xs text-[var(--text-muted)]">
                                                        → {log.targetType}: {log.targetName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">
                                            {formatDate(log.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </RoleGuard>
    );
}
