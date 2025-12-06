'use client';

import { useState, useEffect } from 'react';
import { Store, Building2, Layers, ChevronDown, Package } from 'lucide-react';
import Modal from '@/components/Modal';
import RoleGuard from '@/components/RoleGuard';

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

export default function AddShopsPage() {
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [selectedBuilding, setSelectedBuilding] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Floor form
    const [showFloorModal, setShowFloorModal] = useState(false);
    const [floorForm, setFloorForm] = useState({ name: '', floorNumber: '' });

    // Shop form
    const [showShopModal, setShowShopModal] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState<string>('');
    const [shopForm, setShopForm] = useState({
        shopNumber: '',
        name: '',
        ownerName: '',
        phone: '',
        rentCharge: '',
        area: ''
    });

    // Bulk shop form
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkForm, setBulkForm] = useState({
        startNumber: '',
        endNumber: '',
        prefix: '',
        rentCharge: ''
    });

    useEffect(() => {
        fetchBuildings();
    }, []);

    useEffect(() => {
        if (selectedBuilding) {
            fetchFloors(selectedBuilding);
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

    const handleAddFloor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('/api/floors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...floorForm,
                    floorNumber: parseInt(floorForm.floorNumber),
                    buildingId: selectedBuilding
                })
            });
            setShowFloorModal(false);
            setFloorForm({ name: '', floorNumber: '' });
            fetchFloors(selectedBuilding);
        } catch (error) {
            console.error('Failed to add floor:', error);
        }
    };

    const handleAddShop = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('/api/shops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...shopForm,
                    rentCharge: parseFloat(shopForm.rentCharge) || 0,
                    floorId: selectedFloor,
                    buildingId: selectedBuilding
                })
            });
            setShowShopModal(false);
            setShopForm({ shopNumber: '', name: '', ownerName: '', phone: '', rentCharge: '', area: '' });
        } catch (error) {
            console.error('Failed to add shop:', error);
        }
    };

    const handleBulkAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const start = parseInt(bulkForm.startNumber);
        const end = parseInt(bulkForm.endNumber);

        for (let i = start; i <= end; i++) {
            await fetch('/api/shops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopNumber: `${bulkForm.prefix}${i}`,
                    name: `Shop ${bulkForm.prefix}${i}`,
                    rentCharge: parseFloat(bulkForm.rentCharge) || 0,
                    floorId: selectedFloor,
                    buildingId: selectedBuilding
                })
            });
        }

        setShowBulkModal(false);
        setBulkForm({ startNumber: '', endNumber: '', prefix: '', rentCharge: '' });
        alert(`${end - start + 1} shops created successfully!`);
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                        {/* Add Single Shop */}
                        <button
                            onClick={() => floors.length > 0 ? setShowShopModal(true) : alert('Add a floor first!')}
                            className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 hover:border-green-500 transition-all text-left group"
                        >
                            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Store className="w-6 h-6 text-green-500" />
                            </div>
                            <h3 className="font-semibold text-[var(--text-primary)]">Add Shop</h3>
                            <p className="text-sm text-[var(--text-muted)] mt-1">Add a single shop to a floor</p>
                        </button>

                        {/* Bulk Add Shops */}
                        <button
                            onClick={() => floors.length > 0 ? setShowBulkModal(true) : alert('Add a floor first!')}
                            className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 hover:border-purple-500 transition-all text-left group"
                        >
                            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Package className="w-6 h-6 text-purple-500" />
                            </div>
                            <h3 className="font-semibold text-[var(--text-primary)]">Bulk Add Shops</h3>
                            <p className="text-sm text-[var(--text-muted)] mt-1">Add multiple shops at once</p>
                        </button>
                    </div>
                )}

                {/* Floors List */}
                {selectedBuilding && floors.length > 0 && (
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-[var(--border-primary)]">
                            <h3 className="font-semibold text-[var(--text-primary)]">Floors in {selectedBuildingName}</h3>
                        </div>
                        <div className="divide-y divide-[var(--border-primary)]">
                            {floors.map(floor => (
                                <div key={floor._id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-hover)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                                            <Layers className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--text-primary)]">{floor.name}</p>
                                            <p className="text-sm text-[var(--text-muted)]">Floor #{floor.floorNumber}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Add Floor Modal */}
                <Modal isOpen={showFloorModal} onClose={() => setShowFloorModal(false)} title="Add Floor" icon={<Layers className="w-5 h-5" />}>
                    <form onSubmit={handleAddFloor} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Floor Name *</label>
                            <input
                                type="text"
                                placeholder="e.g., Ground Floor, First Floor"
                                value={floorForm.name}
                                onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Floor Number *</label>
                            <input
                                type="number"
                                placeholder="e.g., 0, 1, 2"
                                value={floorForm.floorNumber}
                                onChange={(e) => setFloorForm({ ...floorForm, floorNumber: e.target.value })}
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
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Shop Number *</label>
                                <input
                                    type="text"
                                    value={shopForm.shopNumber}
                                    onChange={(e) => setShopForm({ ...shopForm, shopNumber: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Shop Name</label>
                                <input
                                    type="text"
                                    value={shopForm.name}
                                    onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Owner Name</label>
                                <input
                                    type="text"
                                    value={shopForm.ownerName}
                                    onChange={(e) => setShopForm({ ...shopForm, ownerName: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={shopForm.phone}
                                    onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Rent (₹)</label>
                                <input
                                    type="number"
                                    value={shopForm.rentCharge}
                                    onChange={(e) => setShopForm({ ...shopForm, rentCharge: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Area (sq ft)</label>
                                <input
                                    type="text"
                                    value={shopForm.area}
                                    onChange={(e) => setShopForm({ ...shopForm, area: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setShowShopModal(false)} className="px-4 py-2.5 text-[var(--text-tertiary)]">Cancel</button>
                            <button type="submit" className="btn-primary px-4 py-2.5 rounded-xl text-white">Add Shop</button>
                        </div>
                    </form>
                </Modal>

                {/* Bulk Add Modal */}
                <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Bulk Add Shops" icon={<Package className="w-5 h-5" />}>
                    <form onSubmit={handleBulkAdd} className="p-6 space-y-4">
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
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Shop Number Prefix</label>
                            <input
                                type="text"
                                placeholder="e.g., A, B, GF-"
                                value={bulkForm.prefix}
                                onChange={(e) => setBulkForm({ ...bulkForm, prefix: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Start Number *</label>
                                <input
                                    type="number"
                                    placeholder="1"
                                    value={bulkForm.startNumber}
                                    onChange={(e) => setBulkForm({ ...bulkForm, startNumber: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--text-tertiary)] mb-1">End Number *</label>
                                <input
                                    type="number"
                                    placeholder="10"
                                    value={bulkForm.endNumber}
                                    onChange={(e) => setBulkForm({ ...bulkForm, endNumber: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Default Rent (₹)</label>
                            <input
                                type="number"
                                placeholder="5000"
                                value={bulkForm.rentCharge}
                                onChange={(e) => setBulkForm({ ...bulkForm, rentCharge: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                            />
                        </div>
                        <div className="bg-[var(--bg-tertiary)] rounded-xl p-3 text-sm text-[var(--text-muted)]">
                            <strong>Preview:</strong> {bulkForm.prefix}{bulkForm.startNumber || '1'} to {bulkForm.prefix}{bulkForm.endNumber || '10'}
                            {bulkForm.startNumber && bulkForm.endNumber && (
                                <span className="ml-2 text-indigo-500">({parseInt(bulkForm.endNumber) - parseInt(bulkForm.startNumber) + 1} shops)</span>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setShowBulkModal(false)} className="px-4 py-2.5 text-[var(--text-tertiary)]">Cancel</button>
                            <button type="submit" className="btn-primary px-4 py-2.5 rounded-xl text-white">Create Shops</button>
                        </div>
                    </form>
                </Modal>
            </div>
        </RoleGuard>
    );
}
