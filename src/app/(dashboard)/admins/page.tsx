'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { useSession } from 'next-auth/react';
import RoleGuard from '@/components/RoleGuard';
import { useToast } from '@/components/Toast';

interface Admin {
    _id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
    lastLogin?: string;
}

export default function AdminsPage() {
    const { data: session } = useSession();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
    const [formData, setFormData] = useState({ fullName: '', username: '', email: '', phone: '', password: '', role: 'admin' });
    const toast = useToast();

    useEffect(() => { fetchAdmins(); }, []);

    const fetchAdmins = async () => {
        try {
            const res = await fetch('/api/admins');
            if (!res.ok) {
                console.error('Failed to fetch admins:', res.status);
                setAdmins([]);
                setLoading(false);
                return;
            }
            const data = await res.json();
            setAdmins(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching admins:', error);
            setAdmins([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingAdmin ? 'PUT' : 'POST';
            const body = editingAdmin ? { id: editingAdmin._id, ...formData } : formData;
            const res = await fetch('/api/admins', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error('Failed!', data.error || 'Could not save admin');
                return;
            }

            closeModal();
            fetchAdmins();
            toast.success(
                editingAdmin ? 'Admin Updated!' : 'Admin Created!',
                `${formData.fullName} has been ${editingAdmin ? 'updated' : 'created'} successfully`
            );
        } catch (error) {
            console.error('Error saving admin:', error);
            toast.error('Error!', 'Something went wrong. Please try again.');
        }
    };

    const handleEdit = (admin: Admin) => {
        setEditingAdmin(admin);
        setFormData({ fullName: admin.fullName, username: admin.username, email: admin.email, phone: '', password: '', role: admin.role });
        setShowModal(true);
    };

    const handleDelete = async (id: string, adminName: string) => {
        if (!confirm('Delete this admin?')) return;
        try {
            const res = await fetch(`/api/admins?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchAdmins();
                toast.success('Admin Deleted!', `${adminName} has been removed`);
            } else {
                toast.error('Failed!', 'Could not delete admin');
            }
        } catch (error) {
            toast.error('Error!', 'Something went wrong');
        }
    };

    const closeModal = () => { setShowModal(false); setEditingAdmin(null); setFormData({ fullName: '', username: '', email: '', phone: '', password: '', role: 'admin' }); };

    const isOwner = (session?.user as any)?.role === 'owner';

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <RoleGuard allowedRoles={['owner']}>
            <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Admins</h1>
                        <p className="text-[var(--text-tertiary)] mt-1">Manage system administrators</p>
                    </div>
                    {isOwner && (
                        <button onClick={() => setShowModal(true)} className="btn-primary px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-white">
                            <Plus className="w-5 h-5" /> Add Admin
                        </button>
                    )}
                </div>

                {/* Mobile Cards View */}
                <div className="block lg:hidden space-y-4">
                    {admins.map(admin => (
                        <div key={admin._id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white ${admin.role === 'owner' ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-indigo-500 to-indigo-600'}`}>
                                        {admin.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--text-primary)]">{admin.fullName}</p>
                                        <p className="text-sm text-[var(--text-tertiary)]">@{admin.username}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <p className="text-[var(--text-tertiary)]">{admin.email}</p>
                                <div className="flex items-center justify-between">
                                    <span className={`px-2 py-1 rounded-full text-xs ${admin.role === 'owner' ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-500/20 text-indigo-500'}`}>
                                        {admin.role.replace('_', ' ')}
                                    </span>
                                    {isOwner && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(admin)} className="p-2 hover:bg-[var(--bg-hover)] rounded-lg">
                                                <Edit className="w-4 h-4 text-[var(--text-tertiary)]" />
                                            </button>
                                            {admin._id !== (session?.user as any)?.id && (
                                                <button onClick={() => handleDelete(admin._id, admin.fullName)} className="p-2 hover:bg-red-500/20 rounded-lg">
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--bg-tertiary)]">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm text-[var(--text-tertiary)] font-medium">Admin</th>
                                    <th className="text-left px-6 py-4 text-sm text-[var(--text-tertiary)] font-medium">Username</th>
                                    <th className="text-left px-6 py-4 text-sm text-[var(--text-tertiary)] font-medium">Role</th>
                                    <th className="text-left px-6 py-4 text-sm text-[var(--text-tertiary)] font-medium">Last Login</th>
                                    <th className="text-left px-6 py-4 text-sm text-[var(--text-tertiary)] font-medium">Status</th>
                                    {isOwner && <th className="text-left px-6 py-4 text-sm text-[var(--text-tertiary)] font-medium">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {admins.map(admin => (
                                    <tr key={admin._id} className={`border-t border-[var(--border-primary)] hover:bg-[var(--bg-hover)] ${!admin.isActive ? 'opacity-50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${admin.role === 'owner' ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-indigo-500 to-indigo-600'}`}>
                                                    {admin.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[var(--text-primary)]">{admin.fullName}</p>
                                                    <p className="text-sm text-[var(--text-tertiary)]">{admin.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[var(--text-primary)]">{admin.username}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${admin.role === 'owner' ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-500/20 text-indigo-500'}`}>
                                                {admin.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[var(--text-tertiary)]">{admin.lastLogin ? new Date(admin.lastLogin).toLocaleString('en-IN') : 'Never'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${admin.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                {admin.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        {isOwner && (
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleEdit(admin)} className="p-2 hover:bg-[var(--bg-hover)] rounded-lg"><Edit className="w-4 h-4 text-[var(--text-tertiary)]" /></button>
                                                    {admin._id !== (session?.user as any)?.id && (
                                                        <button onClick={() => handleDelete(admin._id, admin.fullName)} className="p-2 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Modal isOpen={showModal} onClose={closeModal} title={editingAdmin ? 'Edit Admin' : 'Add Admin'} icon={<Shield className="w-5 h-5" />}>
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
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Email *</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" />
                        </div>
                        {!editingAdmin && (
                            <div>
                                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Password *</label>
                                <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Role *</label>
                            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]">
                                <option value="admin">Admin</option>
                                <option value="owner">Owner</option>
                            </select>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
                            <button type="button" onClick={closeModal} className="px-4 py-2.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Cancel</button>
                            <button type="submit" className="btn-primary px-4 py-2.5 rounded-xl text-white">{editingAdmin ? 'Update' : 'Add'} Admin</button>
                        </div>
                    </form>
                </Modal>
            </div>
        </RoleGuard>
    );
}
