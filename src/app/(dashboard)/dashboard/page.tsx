'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
    Building2,
    Users,
    FileText,
    IndianRupee,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    Calendar,
    CreditCard,
    AlertTriangle,
    CheckCircle2,
    Clock,
    BarChart3,
    PieChart,
    Activity,
    Link2,
    Store
} from 'lucide-react';

interface DashboardStats {
    buildings: number;
    users: number;
    totalBills: number;
    pendingBills: number;
    paidBills: number;
    totalRevenue: number;
    pendingAmount: number;
    collectionRate: number;
    recentPayments: Array<{
        _id: string;
        amount: number;
        paymentMethod: string;
        createdAt: string;
        billId?: { billNumber: string };
    }>;
    monthlyData: Array<{
        month: string;
        revenue: number;
        pending: number;
    }>;
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<DashboardStats>({
        buildings: 0,
        users: 0,
        totalBills: 0,
        pendingBills: 0,
        paidBills: 0,
        totalRevenue: 0,
        pendingAmount: 0,
        collectionRate: 0,
        recentPayments: [],
        monthlyData: []
    });
    const [loading, setLoading] = useState(true);

    const userRole = (session?.user as any)?.role || 'user';
    const isOwner = userRole === 'owner';
    const isAdmin = userRole === 'admin';
    const isUser = userRole === 'user';
    const assignedShops = (session?.user as any)?.assignedShops || [];

    useEffect(() => {
        // Wait for session to be loaded before fetching data
        if (session) {
            fetchDashboardData();
        }
    }, [session]);

    const fetchDashboardData = async () => {
        try {
            // For users, fetch only their data
            const shopParam = isUser && assignedShops.length > 0 ? `?shopIds=${assignedShops.join(',')}` : '';

            const [buildingsRes, usersRes, billsRes, paymentsRes] = await Promise.all([
                !isUser ? fetch('/api/buildings') : Promise.resolve({ json: () => [] }),
                !isUser ? fetch('/api/shopusers') : Promise.resolve({ json: () => [] }),
                fetch(`/api/bills${shopParam}`),
                fetch(`/api/payments${shopParam}`)
            ]);

            const buildings = await buildingsRes.json();
            const users = await usersRes.json();
            const bills = await billsRes.json();
            const payments = await paymentsRes.json();

            const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
            const pendingBills = bills.filter((b: any) => b.status === 'pending' || b.status === 'partial');
            const paidBills = bills.filter((b: any) => b.status === 'paid');
            const pendingAmount = pendingBills.reduce((sum: number, b: any) => sum + (b.balanceAmount || 0), 0);
            const totalBillAmount = bills.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0);
            const collectionRate = totalBillAmount > 0 ? (totalRevenue / totalBillAmount) * 100 : 0;

            // Generate monthly data for last 6 months
            const monthlyData = generateMonthlyData(bills, payments);

            setStats({
                buildings: buildings.length,
                users: users.length,
                totalBills: bills.length,
                pendingBills: pendingBills.length,
                paidBills: paidBills.length,
                totalRevenue,
                pendingAmount,
                collectionRate,
                recentPayments: payments.slice(0, 5),
                monthlyData
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateMonthlyData = (bills: any[], payments: any[]) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const data = [];

        for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            const monthPayments = payments.filter((p: any) => {
                const date = new Date(p.createdAt);
                return date.getMonth() === monthIndex;
            });
            const monthBills = bills.filter((b: any) => {
                return months.indexOf(b.billMonth?.substring(0, 3)) === monthIndex;
            });

            data.push({
                month: months[monthIndex],
                revenue: monthPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
                pending: monthBills.reduce((sum: number, b: any) => sum + (b.balanceAmount || 0), 0)
            });
        }

        return data;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-[var(--bg-card)] rounded-2xl" />
                    ))}
                </div>
                <div className="h-80 bg-[var(--bg-card)] rounded-2xl" />
            </div>
        );
    }

    const maxRevenue = Math.max(...stats.monthlyData.map(d => d.revenue), 1);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Dashboard</h1>
                    <p className="text-[var(--text-tertiary)] mt-1">Welcome back! Here's your overview</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <Calendar className="w-4 h-4" />
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Main Stats */}
            <div className={`grid ${isUser ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}>
                {/* Buildings - Only for Admin/SuperAdmin */}
                {!isUser && (
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-4 sm:p-5 hover:border-indigo-500/50 transition-all group">
                        <div className="flex items-start justify-between">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Building2 className="w-5 h-5 text-indigo-500" />
                            </div>
                            <Link href="/buildings" className="text-indigo-500 hover:text-indigo-400">
                                <ArrowUpRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-3">{stats.buildings}</p>
                        <p className="text-sm text-[var(--text-tertiary)]">Buildings</p>
                    </div>
                )}

                {/* My Shops - For Users */}
                {isUser && (
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-4 sm:p-5 hover:border-teal-500/50 transition-all group">
                        <div className="flex items-start justify-between">
                            <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Store className="w-5 h-5 text-teal-500" />
                            </div>
                            <Link href="/my-shops" className="text-teal-500 hover:text-teal-400">
                                <ArrowUpRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-3">{assignedShops.length}</p>
                        <p className="text-sm text-[var(--text-tertiary)]">My Shops</p>
                    </div>
                )}

                {/* Users - Only for Admin/SuperAdmin */}
                {!isUser && (
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-4 sm:p-5 hover:border-green-500/50 transition-all group">
                        <div className="flex items-start justify-between">
                            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Users className="w-5 h-5 text-green-500" />
                            </div>
                            <Link href="/shopusers" className="text-green-500 hover:text-green-400">
                                <ArrowUpRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-3">{stats.users}</p>
                        <p className="text-sm text-[var(--text-tertiary)]">Users</p>
                    </div>
                )}

                {/* Bills - For All */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-4 sm:p-5 hover:border-amber-500/50 transition-all group">
                    <div className="flex items-start justify-between">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5 text-amber-500" />
                        </div>
                        <Link href="/bills" className="text-amber-500 hover:text-amber-400">
                            <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-3">{stats.totalBills}</p>
                    <p className="text-sm text-[var(--text-tertiary)]">{isUser ? 'My Bills' : 'Total Bills'}</p>
                </div>

                {/* Total Amount / Pending */}
                <div className={`${isUser ? 'bg-[var(--bg-card)] border border-[var(--border-primary)]' : 'bg-gradient-to-br from-indigo-500 to-indigo-600'} rounded-2xl p-4 sm:p-5 ${isUser ? 'hover:border-red-500/50' : ''} ${isUser ? '' : 'text-white'}`}>
                    <div className="flex items-start justify-between">
                        <div className={`w-10 h-10 ${isUser ? 'bg-red-500/10' : 'bg-white/20'} rounded-xl flex items-center justify-center`}>
                            <IndianRupee className={`w-5 h-5 ${isUser ? 'text-red-500' : ''}`} />
                        </div>
                        {!isUser && (
                            <div className="flex items-center gap-1 text-green-300 text-sm">
                                <TrendingUp className="w-4 h-4" />
                                {stats.collectionRate.toFixed(1)}%
                            </div>
                        )}
                    </div>
                    <p className={`text-2xl sm:text-3xl font-bold mt-3 ${isUser ? 'text-red-500' : ''}`}>
                        {formatCurrency(isUser ? stats.pendingAmount : stats.totalRevenue)}
                    </p>
                    <p className={`text-sm ${isUser ? 'text-[var(--text-tertiary)]' : 'text-indigo-100'}`}>
                        {isUser ? 'Pending Amount' : 'Total Revenue'}
                    </p>
                </div>
            </div>

            {/* Secondary Stats - Only for Admin/SuperAdmin */}
            {!isUser && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.paidBills}</p>
                            <p className="text-sm text-[var(--text-tertiary)]">Paid Bills</p>
                        </div>
                    </div>

                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.pendingBills}</p>
                            <p className="text-sm text-[var(--text-tertiary)]">Pending Bills</p>
                        </div>
                    </div>

                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-500">{formatCurrency(stats.pendingAmount)}</p>
                            <p className="text-sm text-[var(--text-tertiary)]">Pending Amount</p>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Charts Row - Only for Admin/SuperAdmin */}
            {
                !isUser && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue Chart */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                                        <BarChart3 className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <h3 className="font-semibold text-[var(--text-primary)]">Revenue Trend</h3>
                                </div>
                                <span className="text-xs text-[var(--text-muted)]">Last 6 months</span>
                            </div>

                            <div className="flex items-end justify-between gap-2 h-40">
                                {stats.monthlyData.map((data, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                        <div className="w-full flex flex-col items-center gap-1">
                                            <div
                                                className="w-full bg-indigo-500 rounded-t-lg transition-all hover:bg-indigo-400"
                                                style={{ height: `${(data.revenue / maxRevenue) * 120}px`, minHeight: '4px' }}
                                            />
                                        </div>
                                        <span className="text-xs text-[var(--text-muted)]">{data.month}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Collection Rate Donut */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                                        <PieChart className="w-4 h-4 text-green-500" />
                                    </div>
                                    <h3 className="font-semibold text-[var(--text-primary)]">Collection Overview</h3>
                                </div>
                            </div>

                            <div className="flex items-center justify-center">
                                <div className="relative w-40 h-40">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="80" cy="80" r="60" fill="none" stroke="var(--bg-tertiary)" strokeWidth="16" />
                                        <circle cx="80" cy="80" r="60" fill="none" stroke="url(#gradient)" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${stats.collectionRate * 3.77} 377`} />
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#22c55e" />
                                                <stop offset="100%" stopColor="#10b981" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-[var(--text-primary)]">{stats.collectionRate.toFixed(0)}%</span>
                                        <span className="text-xs text-[var(--text-muted)]">Collected</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <span className="text-sm text-[var(--text-tertiary)]">Collected</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[var(--bg-tertiary)]" />
                                    <span className="text-sm text-[var(--text-tertiary)]">Pending</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Recent Payments & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Payments */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-[var(--border-primary)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-4 h-4 text-green-500" />
                            </div>
                            <h3 className="font-semibold text-[var(--text-primary)]">Recent Payments</h3>
                        </div>
                        <Link href="/bills" className="text-sm text-indigo-500 hover:underline">View All</Link>
                    </div>
                    <div className="divide-y divide-[var(--border-primary)]">
                        {stats.recentPayments.length > 0 ? stats.recentPayments.map((payment) => (
                            <div key={payment._id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-hover)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                                        <IndianRupee className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--text-primary)]">{formatCurrency(payment.amount)}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{payment.billId?.billNumber || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 capitalize">{payment.paymentMethod}</span>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">{new Date(payment.createdAt).toLocaleDateString('en-IN')}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-[var(--text-muted)]">No recent payments</div>
                        )}
                    </div>
                </div>

                {/* Quick Actions - Role Based */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                            <Activity className="w-4 h-4 text-indigo-500" />
                        </div>
                        <h3 className="font-semibold text-[var(--text-primary)]">Quick Actions</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {/* User Quick Actions */}
                        {isUser ? (
                            <>
                                <Link href="/my-shops" className="p-4 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-hover)] transition-all text-center group">
                                    <Store className="w-6 h-6 mx-auto text-teal-500 group-hover:scale-110 transition-transform" />
                                    <p className="text-sm text-[var(--text-primary)] mt-2">My Shops</p>
                                </Link>
                                <Link href="/bills" className="p-4 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-hover)] transition-all text-center group">
                                    <FileText className="w-6 h-6 mx-auto text-amber-500 group-hover:scale-110 transition-transform" />
                                    <p className="text-sm text-[var(--text-primary)] mt-2">View Bills</p>
                                </Link>
                            </>
                        ) : (
                            <>
                                {isOwner && (
                                    <Link href="/buildings" className="p-4 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-hover)] transition-all text-center group">
                                        <Building2 className="w-6 h-6 mx-auto text-indigo-500 group-hover:scale-110 transition-transform" />
                                        <p className="text-sm text-[var(--text-primary)] mt-2">Add Building</p>
                                    </Link>
                                )}
                                <Link href={isOwner ? "/buildings" : "/add-shops"} className="p-4 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-hover)] transition-all text-center group">
                                    <Store className="w-6 h-6 mx-auto text-teal-500 group-hover:scale-110 transition-transform" />
                                    <p className="text-sm text-[var(--text-primary)] mt-2">Add Shops</p>
                                </Link>
                                <Link href="/shopusers" className="p-4 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-hover)] transition-all text-center group">
                                    <Users className="w-6 h-6 mx-auto text-green-500 group-hover:scale-110 transition-transform" />
                                    <p className="text-sm text-[var(--text-primary)] mt-2">Add User</p>
                                </Link>
                                <Link href="/assign-shop" className="p-4 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-hover)] transition-all text-center group">
                                    <Link2 className="w-6 h-6 mx-auto text-purple-500 group-hover:scale-110 transition-transform" />
                                    <p className="text-sm text-[var(--text-primary)] mt-2">Assign Shops</p>
                                </Link>
                                <Link href="/bills" className="p-4 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-hover)] transition-all text-center group">
                                    <FileText className="w-6 h-6 mx-auto text-amber-500 group-hover:scale-110 transition-transform" />
                                    <p className="text-sm text-[var(--text-primary)] mt-2">Create Bill</p>
                                </Link>
                                <Link href="/export" className="p-4 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-hover)] transition-all text-center group">
                                    <BarChart3 className="w-6 h-6 mx-auto text-cyan-500 group-hover:scale-110 transition-transform" />
                                    <p className="text-sm text-[var(--text-primary)] mt-2">Export Data</p>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
