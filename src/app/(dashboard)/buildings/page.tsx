'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Layers, Store, MapPin, Eye } from 'lucide-react';
import Modal from '@/components/Modal';
import RoleGuard from '@/components/RoleGuard';

interface Building {
    _id: string;
    name: string;
    address: string;
    city: string;
    totalFloors: number;
    description?: string;
}

export default function BuildingsPage() {
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
    const [formData, setFormData] = useState({ name: '', address: '', city: '', description: '' });

    useEffect(() => {
        fetchBuildings();
    }, []);

    const fetchBuildings = async () => {
        const res = await fetch('/api/buildings');
        const data = await res.json();
        setBuildings(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingBuilding ? `/api/buildings/${editingBuilding._id}` : '/api/buildings';
        const method = editingBuilding ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        setShowModal(false);
        setEditingBuilding(null);
        setFormData({ name: '', address: '', city: '', description: '' });
        fetchBuildings();
    };

    const handleEdit = (building: Building) => {
        setEditingBuilding(building);
        setFormData({
            name: building.name,
            address: building.address,
            city: building.city,
            description: building.description || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this building?')) return;
        await fetch(`/api/buildings/${id}`, { method: 'DELETE' });
        fetchBuildings();
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <RoleGuard allowedRoles={['owner']}>
            <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Buildings</h1>
                        <p className="text-[var(--text-tertiary)] mt-1">Manage your buildings, floors, and shops</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 text-white transition">
                        <Plus className="w-5 h-5" />
                        Add Building
                    </button>
                </div>

                {buildings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {buildings.map(building => (
                            <div key={building._id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden hover:border-[var(--border-secondary)] hover:shadow-lg transition-all group">
                                <div className="p-5 flex items-start justify-between">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                                        <Building2 className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(building)} className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition">
                                            <Edit className="w-4 h-4 text-[var(--text-tertiary)]" />
                                        </button>
                                        <button onClick={() => handleDelete(building._id)} className="p-2 hover:bg-red-500/20 rounded-lg transition">
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                                <div className="px-5 pb-2">
                                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{building.name}</h3>
                                    <p className="text-sm text-[var(--text-tertiary)] flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3" />
                                        {building.address}, {building.city}
                                    </p>
                                </div>
                                <div className="px-5 py-3 flex gap-6 text-sm text-[var(--text-tertiary)]">
                                    <span className="flex items-center gap-1"><Layers className="w-4 h-4" /> {building.totalFloors} Floors</span>
                                </div>
                                <div className="p-5 border-t border-[var(--border-primary)]">
                                    <a href={`/buildings/${building._id}`} className="text-indigo-500 text-sm hover:underline flex items-center gap-1">
                                        <Eye className="w-4 h-4" /> Manage Floors & Shops
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl">
                        <Building2 className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
                        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No Buildings Yet</h3>
                        <p className="text-[var(--text-tertiary)] mb-4">Add your first building to get started</p>
                        <button onClick={() => setShowModal(true)} className="btn-primary px-4 py-2 rounded-lg text-white">
                            Add Building
                        </button>
                    </div>
                )}

                <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingBuilding(null); }} title={editingBuilding ? 'Edit Building' : 'Add Building'} icon={<Building2 className="w-5 h-5" />}>
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Building Name *</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Address *</label>
                            <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">City *</label>
                            <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Description</label>
                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" />
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
                            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Cancel</button>
                            <button type="submit" className="btn-primary px-4 py-2 rounded-lg text-white">{editingBuilding ? 'Update' : 'Add'} Building</button>
                        </div>
                    </form>
                </Modal>
            </div>
        </RoleGuard>
    );
}
