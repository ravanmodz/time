'use client';

import { useState, useEffect } from 'react';
import { Link2, Users, Store, Check, Search, Layers, ChevronDown } from 'lucide-react';
import { useSession } from 'next-auth/react';
import RoleGuard from '@/components/RoleGuard';
import { useToast } from '@/components/Toast';

interface ShopUser {
    _id: string;
    fullName: string;
    username: string;
    assignedShops: string[];
}

interface Floor {
    _id: string;
    name: string;
    floorNumber: number;
}

interface Shop {
    _id: string;
    name: string;
    shopNumber: string;
    floorId: string | { _id: string; name: string };
    buildingName?: string;
}

export default function AssignShopPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<ShopUser[]>([]);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedUser, setSelectedUser] = useState<ShopUser | null>(null);
    const [selectedFloor, setSelectedFloor] = useState<string>('');
    const [selectedShops, setSelectedShops] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchUser, setSearchUser] = useState('');
    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, shopsRes, floorsRes] = await Promise.all([
                fetch('/api/shopusers'),
                fetch('/api/shops'),
                fetch('/api/floors')
            ]);
            setUsers(await usersRes.json());
            setShops(await shopsRes.json());
            setFloors(await floorsRes.json());
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectUser = (user: ShopUser) => {
        setSelectedUser(user);
        setSelectedShops(user.assignedShops || []);
    };

    const toggleShop = (shopId: string) => {
        setSelectedShops(prev =>
            prev.includes(shopId)
                ? prev.filter(id => id !== shopId)
                : [...prev, shopId]
        );
    };

    const handleSave = async () => {
        if (!selectedUser) return;
        setSaving(true);

        try {
            const res = await fetch('/api/assign-shop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUser._id, shopIds: selectedShops })
            });

            if (res.ok) {
                // Update local state
                setUsers(prev => prev.map(u =>
                    u._id === selectedUser._id
                        ? { ...u, assignedShops: selectedShops }
                        : u
                ));
                setSelectedUser({ ...selectedUser, assignedShops: selectedShops });
                toast.success('Assignment Saved!', `${selectedShops.length} shops assigned to ${selectedUser.fullName}`);
            } else {
                const data = await res.json();
                toast.error('Failed!', data.error || 'Could not assign shops');
            }
        } catch (error) {
            toast.error('Error!', 'Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.fullName.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.username.toLowerCase().includes(searchUser.toLowerCase())
    );

    // Filter shops by selected floor
    const getShopsForFloor = () => {
        if (!selectedFloor) return [];
        return shops.filter(shop => {
            const shopFloorId = typeof shop.floorId === 'object' ? shop.floorId._id : shop.floorId;
            return shopFloorId === selectedFloor || shopFloorId?.toString() === selectedFloor;
        });
    };

    const floorShops = getShopsForFloor();

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <RoleGuard allowedRoles={['owner', 'admin']}>
            <div className="space-y-6 animate-fadeIn">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Assign Shops</h1>
                    <p className="text-[var(--text-tertiary)] mt-1">Assign shops to users for access control</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Users List */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-[var(--border-primary)]">
                            <div className="flex items-center gap-2 mb-3">
                                <Users className="w-5 h-5 text-indigo-500" />
                                <h2 className="font-semibold text-[var(--text-primary)]">Select User</h2>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchUser}
                                    onChange={(e) => setSearchUser(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                />
                            </div>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {filteredUsers.map(user => (
                                <div
                                    key={user._id}
                                    onClick={() => handleSelectUser(user)}
                                    className={`p-4 border-b border-[var(--border-primary)] cursor-pointer transition-all ${selectedUser?._id === user._id
                                        ? 'bg-indigo-500/10 border-l-4 border-l-indigo-500'
                                        : 'hover:bg-[var(--bg-hover)]'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center font-semibold text-white">
                                            {user.fullName.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-[var(--text-primary)]">{user.fullName}</p>
                                            <p className="text-sm text-[var(--text-muted)]">
                                                {user.assignedShops?.length || 0} shops assigned
                                            </p>
                                        </div>
                                        {selectedUser?._id === user._id && (
                                            <Check className="w-5 h-5 text-indigo-500" />
                                        )}
                                    </div>
                                </div>
                            ))}
                            {filteredUsers.length === 0 && (
                                <div className="p-8 text-center text-[var(--text-muted)]">No users found</div>
                            )}
                        </div>
                    </div>

                    {/* Shops List */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-[var(--border-primary)]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Store className="w-5 h-5 text-green-500" />
                                    <h2 className="font-semibold text-[var(--text-primary)]">Select Shops</h2>
                                </div>
                                {selectedUser && (
                                    <span className="text-sm text-indigo-500">{selectedShops.length} selected</span>
                                )}
                            </div>

                            {/* Floor Selection Dropdown */}
                            <div className="relative">
                                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                <select
                                    value={selectedFloor}
                                    onChange={(e) => setSelectedFloor(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)] appearance-none"
                                >
                                    <option value="">-- Select Floor First --</option>
                                    {floors.map(floor => (
                                        <option key={floor._id} value={floor._id}>
                                            {floor.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            </div>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {!selectedUser ? (
                                <div className="p-8 text-center text-[var(--text-muted)]">
                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Pehle User select karo</p>
                                </div>
                            ) : !selectedFloor ? (
                                <div className="p-8 text-center text-[var(--text-muted)]">
                                    <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Pehle Floor select karo</p>
                                </div>
                            ) : floorShops.length === 0 ? (
                                <div className="p-8 text-center text-[var(--text-muted)]">
                                    <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Is floor mein koi shop nahi hai</p>
                                </div>
                            ) : (
                                floorShops.map(shop => (
                                    <div
                                        key={shop._id}
                                        onClick={() => toggleShop(shop._id)}
                                        className={`p-4 border-b border-[var(--border-primary)] cursor-pointer transition-all ${selectedShops.includes(shop._id)
                                            ? 'bg-green-500/10'
                                            : 'hover:bg-[var(--bg-hover)]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${selectedShops.includes(shop._id)
                                                ? 'bg-green-500 border-green-500'
                                                : 'border-[var(--border-secondary)]'
                                                }`}>
                                                {selectedShops.includes(shop._id) && (
                                                    <Check className="w-4 h-4 text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-[var(--text-primary)]">Shop {shop.shopNumber}</p>
                                                <p className="text-sm text-[var(--text-muted)]">
                                                    {shop.name || `Shop #${shop.shopNumber}`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                {selectedUser && (
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-primary px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Link2 className="w-5 h-5" />
                            )}
                            {saving ? 'Saving...' : 'Save Assignment'}
                        </button>
                    </div>
                )}
            </div>
        </RoleGuard>
    );
}
