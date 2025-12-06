'use client';

import { useState, useEffect } from 'react';
import { Store, IndianRupee, FileText, Building2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Shop {
    _id: string;
    name: string;
    shopNumber: string;
    floor?: string;
    buildingName?: string;
    rentCharge?: number;
    ownerName?: string;
}

export default function MyShopsPage() {
    const { data: session } = useSession();
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyShops();
    }, [session]);

    const fetchMyShops = async () => {
        try {
            const assignedShops = (session?.user as any)?.assignedShops || [];

            if (assignedShops.length === 0) {
                setShops([]);
                setLoading(false);
                return;
            }

            const res = await fetch('/api/shops');
            const allShops = await res.json();

            const myShops = allShops.filter((shop: Shop) =>
                assignedShops.includes(shop._id)
            );

            setShops(myShops);
        } catch (error) {
            console.error('Failed to fetch shops:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">My Shops</h1>
                <p className="text-[var(--text-tertiary)] mt-1">View your assigned shops and their details</p>
            </div>

            {shops.length === 0 ? (
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-12 text-center">
                    <Store className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)] opacity-50" />
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No Shops Assigned</h3>
                    <p className="text-[var(--text-tertiary)]">Contact your admin to get shops assigned to your account.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shops.map(shop => (
                        <div key={shop._id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all group">
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Store className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-sm bg-indigo-500/10 text-indigo-500">
                                        #{shop.shopNumber}
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                                    {shop.name || `Shop ${shop.shopNumber}`}
                                </h3>

                                <div className="space-y-2 text-sm">
                                    {shop.buildingName && (
                                        <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                                            <Building2 className="w-4 h-4" />
                                            <span>{shop.buildingName}</span>
                                        </div>
                                    )}
                                    {shop.floor && (
                                        <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                                            <span>Floor: {shop.floor}</span>
                                        </div>
                                    )}
                                    {shop.rentCharge && (
                                        <div className="flex items-center gap-2 text-green-500 font-medium">
                                            <IndianRupee className="w-4 h-4" />
                                            <span>{shop.rentCharge.toLocaleString('en-IN')}/month</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="px-5 py-3 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                                <Link
                                    href={`/bills?shop=${shop._id}`}
                                    className="flex items-center justify-center gap-2 text-sm text-indigo-500 hover:text-indigo-400"
                                >
                                    <FileText className="w-4 h-4" />
                                    View Bills
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
