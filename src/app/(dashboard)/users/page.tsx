'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, Store, Phone, Mail } from 'lucide-react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface UserData {
    _id: string;
    name: string;
    email: string;
    phone: string;
    businessName?: string;
    shopId: { _id: string; shopNumber: string; name: string; buildingId?: { name: string }; floorId?: { name: string } };
}

interface Shop {
    _id: string;
    shopNumber: string;
    name: string;
    buildingId: { name: string };
    floorId: { name: string };
}

export default function UsersPage() {
    const toast = useToast();
    const [users, setUsers] = useState<UserData[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '', shopId: '', businessName: '', businessType: '', gstNumber: '', idType: 'aadhar', idNumber: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [usersRes, shopsRes] = await Promise.all([
            fetch('/api/users'),
            fetch('/api/shops?available=true')
        ]);
        setUsers(await usersRes.json());
        setShops(await shopsRes.json());
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = '/api/users';
        const method = editingUser ? 'PUT' : 'POST';
        const body = editingUser ? { id: editingUser._id, ...formData } : formData;

        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) {
            toast.success(editingUser ? 'Tenant Updated!' : 'Tenant Added!', editingUser ? 'Changes saved successfully' : 'New tenant has been added');
        } else {
            toast.error('Failed!', 'Could not save tenant');
        }
        closeModal();
        fetchData();
    };

    const handleEdit = (user: UserData) => {
        setEditingUser(user);
        setFormData({
            name: user.name, email: user.email, phone: user.phone, address: '', shopId: user.shopId._id,
            businessName: user.businessName || '', businessType: '', gstNumber: '', idType: 'aadhar', idNumber: ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this tenant?')) return;
        const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            toast.success('Tenant Deleted!', 'Tenant has been removed');
        } else {
            toast.error('Failed!', 'Could not delete tenant');
        }
        fetchData();
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setFormData({ name: '', email: '', phone: '', address: '', shopId: '', businessName: '', businessType: '', gstNumber: '', idType: 'aadhar', idNumber: '' });
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.shopId?.shopNumber.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">Tenants</h1>
                    <p className="text-[var(--text-tertiary)] mt-1">Manage shop tenants</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 text-white">
                    <Plus className="w-5 h-5" /> Add Tenant
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input type="text" placeholder="Search tenants..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" />
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[var(--bg-tertiary)]">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm text-[var(--text-tertiary)] font-medium">Tenant</th>
                            <th className="text-left px-6 py-4 text-sm text-[var(--text-tertiary)] font-medium">Shop</th>
                            <th className="text-left px-6 py-4 text-sm text-[var(--text-tertiary)] font-medium">Contact</th>
                            <th className="text-left px-6 py-4 text-sm text-[var(--text-tertiary)] font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user._id} className="border-t border-[var(--border-primary)] hover:bg-[var(--bg-hover)]">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center font-semibold text-white">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
                                            <p className="text-sm text-[var(--text-tertiary)]">{user.businessName || 'N/A'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-[var(--text-primary)]">
                                        <Store className="w-4 h-4 text-[var(--text-muted)]" />
                                        <span>{user.shopId?.shopNumber}</span>
                                    </div>
                                    <p className="text-sm text-[var(--text-muted)]">{user.shopId?.buildingId?.name}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="flex items-center gap-2 text-sm text-[var(--text-primary)]"><Phone className="w-3 h-3" /> {user.phone}</p>
                                    <p className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]"><Mail className="w-3 h-3" /> {user.email}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(user)} className="p-2 hover:bg-[var(--bg-hover)] rounded-lg"><Edit className="w-4 h-4 text-[var(--text-tertiary)]" /></button>
                                        <button onClick={() => handleDelete(user._id)} className="p-2 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-[var(--text-muted)]">No tenants found</div>
                )}
            </div>

            <Modal isOpen={showModal} onClose={closeModal} title={editingUser ? 'Edit Tenant' : 'Add Tenant'} size="lg" icon={<Users className="w-5 h-5" />}>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Name *</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Shop *</label>
                            <select value={formData.shopId} onChange={e => setFormData({ ...formData, shopId: e.target.value })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]">
                                <option value="">Select Shop</option>
                                {editingUser && <option value={editingUser.shopId._id}>{editingUser.shopId.shopNumber} (Current)</option>}
                                {shops.map(s => <option key={s._id} value={s._id}>{s.buildingId?.name} &gt; {s.shopNumber} - {s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Email *</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Phone *</label>
                            <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Business Name</label>
                            <input type="text" value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">GST Number</label>
                            <input type="text" value={formData.gstNumber} onChange={e => setFormData({ ...formData, gstNumber: e.target.value })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
                        <button type="button" onClick={closeModal} className="px-4 py-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Cancel</button>
                        <button type="submit" className="btn-primary px-4 py-2 rounded-lg text-white">{editingUser ? 'Update' : 'Add'} Tenant</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
