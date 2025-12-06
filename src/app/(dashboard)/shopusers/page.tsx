'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Key } from 'lucide-react';
import Modal from '@/components/Modal';
import { useSession } from 'next-auth/react';
import RoleGuard from '@/components/RoleGuard';

interface ShopUser {
    _id: string;
    username: string;
    email: string;
    fullName: string;
    phone: string;
    assignedShops: any[];
    isActive: boolean;
}

export default function ShopUsersPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<ShopUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<ShopUser | null>(null);
    const [formData, setFormData] = useState({ fullName: '', username: '', email: '', phone: '', password: '' });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/shopusers');
            if (!res.ok) {
                console.error('Failed to fetch users:', res.status);
                setUsers([]);
                setLoading(false);
                return;
            }
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingUser ? 'PUT' : 'POST';
            const body = editingUser ? { id: editingUser._id, ...formData } : formData;
            const res = await fetch('/api/shopusers', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Failed to save user');
                return;
            }

            closeModal();
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Failed to save user. Please try again.');
        }
    };

    const handleEdit = (user: ShopUser) => {
        setEditingUser(user);
        setFormData({ fullName: user.fullName, username: user.username, email: user.email, phone: user.phone || '', password: '' });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this user?')) return;
        await fetch(`/api/shopusers?id=${id}`, { method: 'DELETE' });
        fetchUsers();
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setFormData({ fullName: '', username: '', email: '', phone: '', password: '' });
    };

    const userRole = (session?.user as any)?.role;
    const canManage = userRole === 'owner' || userRole === 'admin';

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <RoleGuard allowedRoles={['owner', 'admin']}>
            <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Users</h1>
                        <p className="text-[var(--text-tertiary)] mt-1">Manage shop owner accounts</p>
                    </div>
                    {canManage && (
                        <button onClick={() => setShowModal(true)} className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 text-white">
                            <Plus className="w-5 h-5" /> Add User
                        </button>
                    )}
                </div>

                {/* Users Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map(user => (
                        <div key={user._id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center font-semibold text-white text-lg">
                                        {user.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--text-primary)]">{user.fullName}</p>
                                        <p className="text-sm text-[var(--text-tertiary)]">@{user.username}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm mb-4">
                                <p className="text-[var(--text-tertiary)]">{user.email}</p>
                                {user.phone && <p className="text-[var(--text-tertiary)]">{user.phone}</p>}
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-500">
                                        {user.assignedShops?.length || 0} Shops Assigned
                                    </span>
                                </div>
                            </div>

                            {canManage && (
                                <div className="flex gap-2 pt-4 border-t border-[var(--border-primary)]">
                                    <button onClick={() => handleEdit(user)} className="flex-1 py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg flex items-center justify-center gap-2">
                                        <Edit className="w-4 h-4" /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(user._id)} className="flex-1 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg flex items-center justify-center gap-2">
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {users.length === 0 && (
                    <div className="text-center py-12 text-[var(--text-muted)]">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No users yet. Create one to get started.</p>
                    </div>
                )}

                <Modal isOpen={showModal} onClose={closeModal} title={editingUser ? 'Edit User' : 'Add User'} icon={<Users className="w-5 h-5" />}>
                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Full Name *</label>
                                <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} required className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Username *</label>
                                <input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Email *</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Phone</label>
                                <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Password {editingUser ? '(leave blank to keep)' : '*'}</label>
                            <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editingUser} className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" />
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
                            <button type="button" onClick={closeModal} className="px-4 py-2.5 text-[var(--text-tertiary)]">Cancel</button>
                            <button type="submit" className="btn-primary px-4 py-2.5 rounded-xl text-white">{editingUser ? 'Update' : 'Create'} User</button>
                        </div>
                    </form>
                </Modal>
            </div>
        </RoleGuard>
    );
}
