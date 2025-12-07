'use client';

import { useState, useEffect } from 'react';
import { Store, Building2, Layers, ChevronDown, Trash2, Pencil, X } from 'lucide-react';
import Modal from '@/components/Modal';
import RoleGuard from '@/components/RoleGuard';
import { useToast } from '@/components/Toast';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface Building {
    _id: string;
    name: string;
}

interface Floor {
    _id: string;
    name: string;
    floorNumber: number;
    buildingId: string;
}

interface Shop {
    _id: string;
    shopNumber: string;
    floorId: string;
}

export default function AddShopsPage() {
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedBuilding, setSelectedBuilding] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const { confirm } = useConfirmDialog();

    // Floor form
    const [showFloorModal, setShowFloorModal] = useState(false);
    const [floorName, setFloorName] = useState('');

    // Edit Floor
    const [showEditFloorModal, setShowEditFloorModal] = useState(false);
    const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
    const [editFloorName, setEditFloorName] = useState('');

    // Shop form
    const [showShopModal, setShowShopModal] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState<string>('');
    const [shopNumber, setShopNumber] = useState('');

    // Edit Shop
    const [showEditShopModal, setShowEditShopModal] = useState(false);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);
    const [editShopNumber, setEditShopNumber] = useState('');

    useEffect(() => {
        fetchBuildings();
    }, []);

    useEffect(() => {
        if (selectedBuilding) {
            fetchFloors(selectedBuilding);
            fetchShops(selectedBuilding);
        }
    }, [selectedBuilding]);

    const fetchBuildings = async () => {
        try {
            const res = await fetch('/api/buildings');
            const data = await res.json();
            setBuildings(data);
            if (data.length === 1) {
                setSelectedBuilding(data[0]._id);
            }
        } catch (error) {
            console.error('Failed to fetch buildings:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFloors = async (buildingId: string) => {
        try {
            const res = await fetch(`/api/floors?buildingId=${buildingId}`);
            const data = await res.json();
            setFloors(data);
        } catch (error) {
            console.error('Failed to fetch floors:', error);
        }
    };

    const fetchShops = async (buildingId: string) => {
        try {
            const res = await fetch(`/api/shops?buildingId=${buildingId}`);
            const data = await res.json();
            setShops(data);
        } catch (error) {
            console.error('Failed to fetch shops:', error);
        }
    };

    const handleAddFloor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const nextFloorNumber = floors.length + 1;

            const res = await fetch('/api/floors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: floorName,
                    floorNumber: nextFloorNumber,
                    buildingId: selectedBuilding
                })
            });

            if (res.ok) {
                setShowFloorModal(false);
                setFloorName('');
                fetchFloors(selectedBuilding);
                toast.success('Floor Added!', `"${floorName}" has been added successfully`);
            } else {
                const data = await res.json();
                toast.error('Failed!', data.error || 'Could not add floor');
            }
        } catch (error) {
            console.error('Failed to add floor:', error);
            toast.error('Error!', 'Something went wrong. Please try again.');
        }
    };

    const handleEditFloor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFloor) return;

        try {
            const res = await fetch('/api/floors', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingFloor._id,
                    name: editFloorName
                })
            });

            if (res.ok) {
                setShowEditFloorModal(false);
                setEditingFloor(null);
                setEditFloorName('');
                fetchFloors(selectedBuilding);
                toast.success('Floor Updated!', `Floor name changed to "${editFloorName}"`);
            } else {
                const data = await res.json();
                toast.error('Failed!', data.error || 'Could not update floor');
            }
        } catch (error) {
            console.error('Failed to update floor:', error);
            toast.error('Error!', 'Something went wrong. Please try again.');
        }
    };

    const handleDeleteFloor = async (floor: Floor) => {
        const confirmed = await confirm({
            title: 'Delete Floor?',
            message: `Are you sure you want to delete "${floor.name}"? All shops on this floor will also be deleted.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            const res = await fetch(`/api/floors?id=${floor._id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchFloors(selectedBuilding);
                fetchShops(selectedBuilding);
                toast.success('Floor Deleted!', `"${floor.name}" has been deleted successfully`);
            } else {
                const data = await res.json();
                toast.error('Failed!', data.error || 'Could not delete floor');
            }
        } catch (error) {
            console.error('Failed to delete floor:', error);
            toast.error('Error!', 'Something went wrong. Please try again.');
        }
    };

    const openEditFloorModal = (floor: Floor) => {
        setEditingFloor(floor);
        setEditFloorName(floor.name);
        setShowEditFloorModal(true);
    };

    const handleAddShop = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/shops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopNumber: shopNumber,
                    name: `Shop ${shopNumber}`,
                    floorId: selectedFloor,
                    buildingId: selectedBuilding
                })
            });

            if (res.ok) {
                setShowShopModal(false);
                setShopNumber('');
                fetchShops(selectedBuilding);
                const floorNameText = floors.find(f => f._id === selectedFloor)?.name || '';
                toast.success('Shop Added!', `Shop "${shopNumber}" added to ${floorNameText}`);
            } else {
                const data = await res.json();
                toast.error('Failed!', data.error || 'Could not add shop');
            }
        } catch (error) {
            console.error('Failed to add shop:', error);
            toast.error('Error!', 'Something went wrong. Please try again.');
        }
    };

    const handleEditShop = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingShop) return;

        try {
            const res = await fetch('/api/shops', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingShop._id,
                    shopNumber: editShopNumber,
                    name: `Shop ${editShopNumber}`
                })
            });

            if (res.ok) {
                setShowEditShopModal(false);
                setEditingShop(null);
                setEditShopNumber('');
                fetchShops(selectedBuilding);
                toast.success('Shop Updated!', `Shop number changed to "${editShopNumber}"`);
            } else {
                const data = await res.json();
                toast.error('Failed!', data.error || 'Could not update shop');
            }
        } catch (error) {
            console.error('Failed to update shop:', error);
            toast.error('Error!', 'Something went wrong. Please try again.');
        }
    };

    const handleDeleteShop = async (shop: Shop) => {
        const confirmed = await confirm({
            title: 'Delete Shop?',
            message: `Are you sure you want to delete Shop "${shop.shopNumber}"? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            const res = await fetch(`/api/shops?id=${shop._id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchShops(selectedBuilding);
                toast.success('Shop Deleted!', `Shop "${shop.shopNumber}" has been deleted successfully`);
            } else {
                const data = await res.json();
                toast.error('Failed!', data.error || 'Could not delete shop');
            }
        } catch (error) {
            console.error('Failed to delete shop:', error);
            toast.error('Error!', 'Something went wrong. Please try again.');
        }
    };

    const openEditShopModal = (shop: Shop) => {
        setEditingShop(shop);
        setEditShopNumber(shop.shopNumber);
        setShowEditShopModal(true);
    };

    const getShopsForFloor = (floorId: string) => {
        return shops.filter(shop => {
            const shopFloorId = typeof shop.floorId === 'object' ? (shop.floorId as any)._id : shop.floorId;
            return shopFloorId === floorId || shopFloorId?.toString() === floorId;
        });
    };

    const selectedBuildingName = buildings.find(b => b._id === selectedBuilding)?.name || '';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <RoleGuard allowedRoles={['owner', 'admin']}>
            <div className="space-y-6 animate-fadeIn">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Add Shops</h1>
                    <p className="text-[var(--text-tertiary)] mt-1">Add floors and shops to buildings</p>
                </div>

                {/* Building Selection */}
                {buildings.length > 1 ? (
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5">
                        <label className="block text-sm text-[var(--text-tertiary)] mb-2">Select Building</label>
                        <div className="relative">
                            <select
                                value={selectedBuilding}
                                onChange={(e) => setSelectedBuilding(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)] appearance-none"
                            >
                                <option value="">Choose a building...</option>
                                {buildings.map(b => (
                                    <option key={b._id} value={b._id}>{b.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                        </div>
                    </div>
                ) : buildings.length === 1 ? (
                    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--text-muted)]">Selected Building</p>
                            <p className="text-lg font-semibold text-[var(--text-primary)]">{selectedBuildingName}</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center">
                        <Building2 className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                        <p className="text-[var(--text-primary)] font-medium">No Buildings Found</p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">Ask Super Admin to add buildings first</p>
                    </div>
                )}

                {/* Action Cards */}
                {selectedBuilding && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Add Floor */}
                        <button
                            onClick={() => setShowFloorModal(true)}
                            className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 hover:border-indigo-500 transition-all text-left group"
                        >
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Layers className="w-6 h-6 text-indigo-500" />
                            </div>
                            <h3 className="font-semibold text-[var(--text-primary)]">Add Floor</h3>
                            <p className="text-sm text-[var(--text-muted)] mt-1">Add a new floor to the building</p>
                        </button>

                        {/* Add Shop */}
                        <button
                            onClick={() => floors.length > 0 ? setShowShopModal(true) : toast.warning('Add Floor First', 'Please add a floor before adding shops')}
                            className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 hover:border-green-500 transition-all text-left group"
                        >
                            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Store className="w-6 h-6 text-green-500" />
                            </div>
                            <h3 className="font-semibold text-[var(--text-primary)]">Add Shop</h3>
                            <p className="text-sm text-[var(--text-muted)] mt-1">Add shop to a floor</p>
                        </button>
                    </div>
                )}

                {/* Floors List with Shops */}
                {selectedBuilding && floors.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Floors in {selectedBuildingName}</h2>

                        {floors.map(floor => {
                            const floorShops = getShopsForFloor(floor._id);
                            return (
                                <div key={floor._id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
                                    <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                                                <Layers className="w-5 h-5 text-indigo-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-[var(--text-primary)]">{floor.name}</p>
                                                <p className="text-sm text-[var(--text-muted)]">{floorShops.length} Shops</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEditFloorModal(floor)}
                                                className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg hover:bg-indigo-500/20 transition-colors"
                                                title="Edit Floor"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFloor(floor)}
                                                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                                                title="Delete Floor"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedFloor(floor._id);
                                                    setShowShopModal(true);
                                                }}
                                                className="px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-sm hover:bg-green-500/20 transition-colors"
                                            >
                                                + Add Shop
                                            </button>
                                        </div>
                                    </div>

                                    {floorShops.length > 0 && (
                                        <div className="p-4">
                                            <div className="flex flex-wrap gap-2">
                                                {floorShops.map(shop => (
                                                    <div
                                                        key={shop._id}
                                                        className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm flex items-center gap-2 group"
                                                    >
                                                        <Store className="w-4 h-4 text-[var(--text-muted)]" />
                                                        <span className="text-[var(--text-primary)]">{shop.shopNumber}</span>
                                                        <button
                                                            onClick={() => openEditShopModal(shop)}
                                                            className="p-1 hover:bg-indigo-500/20 text-indigo-500 rounded transition-colors"
                                                            title="Edit Shop"
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteShop(shop)}
                                                            className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                                                            title="Delete Shop"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add Floor Modal */}
                <Modal isOpen={showFloorModal} onClose={() => setShowFloorModal(false)} title="Add Floor" icon={<Layers className="w-5 h-5" />}>
                    <form onSubmit={handleAddFloor} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Floor Name *</label>
                            <input
                                type="text"
                                placeholder="e.g., Ground Floor, First Floor, Basement"
                                value={floorName}
                                onChange={(e) => setFloorName(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setShowFloorModal(false)} className="px-4 py-2.5 text-[var(--text-tertiary)]">Cancel</button>
                            <button type="submit" className="btn-primary px-4 py-2.5 rounded-xl text-white">Add Floor</button>
                        </div>
                    </form>
                </Modal>

                {/* Add Shop Modal */}
                <Modal isOpen={showShopModal} onClose={() => setShowShopModal(false)} title="Add Shop" icon={<Store className="w-5 h-5" />}>
                    <form onSubmit={handleAddShop} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Select Floor *</label>
                            <select
                                value={selectedFloor}
                                onChange={(e) => setSelectedFloor(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                            >
                                <option value="">Choose floor...</option>
                                {floors.map(f => (
                                    <option key={f._id} value={f._id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Shop Number *</label>
                            <input
                                type="text"
                                placeholder="e.g., 101, A1, G-1"
                                value={shopNumber}
                                onChange={(e) => setShopNumber(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setShowShopModal(false)} className="px-4 py-2.5 text-[var(--text-tertiary)]">Cancel</button>
                            <button type="submit" className="btn-primary px-4 py-2.5 rounded-xl text-white">Add Shop</button>
                        </div>
                    </form>
                </Modal>

                {/* Edit Floor Modal */}
                <Modal isOpen={showEditFloorModal} onClose={() => setShowEditFloorModal(false)} title="Edit Floor" icon={<Pencil className="w-5 h-5" />}>
                    <form onSubmit={handleEditFloor} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Floor Name *</label>
                            <input
                                type="text"
                                placeholder="e.g., Ground Floor, First Floor"
                                value={editFloorName}
                                onChange={(e) => setEditFloorName(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setShowEditFloorModal(false)} className="px-4 py-2.5 text-[var(--text-tertiary)]">Cancel</button>
                            <button type="submit" className="btn-primary px-4 py-2.5 rounded-xl text-white">Update Floor</button>
                        </div>
                    </form>
                </Modal>

                {/* Edit Shop Modal */}
                <Modal isOpen={showEditShopModal} onClose={() => setShowEditShopModal(false)} title="Edit Shop" icon={<Pencil className="w-5 h-5" />}>
                    <form onSubmit={handleEditShop} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Shop Number *</label>
                            <input
                                type="text"
                                placeholder="e.g., 101, A1, G-1"
                                value={editShopNumber}
                                onChange={(e) => setEditShopNumber(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setShowEditShopModal(false)} className="px-4 py-2.5 text-[var(--text-tertiary)]">Cancel</button>
                            <button type="submit" className="btn-primary px-4 py-2.5 rounded-xl text-white">Update Shop</button>
                        </div>
                    </form>
                </Modal>
            </div>
        </RoleGuard>
    );
}
