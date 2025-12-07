'use client';

import { useState, useEffect } from 'react';
import { Receipt, Plus, IndianRupee, Filter, X, Download, Eye, Pencil, Trash2, Tag } from 'lucide-react';
import Modal from '@/components/Modal';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Toast';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface Bill {
    _id: string;
    billNumber: string;
    shopId: { _id: string; shopNumber: string; name: string };
    userId?: { name: string };
    buildingId?: { name: string };
    billMonth: string;
    billYear: number;
    billDate: string;
    dueDate: string;
    category?: { _id: string; name: string };
    rentAmount: number;
    maintenanceCharge: number;
    electricityCharge: number;
    waterCharge: number;
    otherCharges: number;
    discount: number;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: string;
}

interface Shop {
    _id: string;
    shopNumber: string;
    name: string;
    floorId: { _id: string; name: string } | string;
    buildingId: { name: string };
    rentAmount: number;
    maintenanceCharge: number;
}

interface Floor {
    _id: string;
    name: string;
    floorNumber: number;
}

interface Category {
    _id: string;
    name: string;
    description?: string;
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function BillsPage() {
    const { data: session } = useSession();
    const toast = useToast();
    const { confirm } = useConfirmDialog();
    const userRole = (session?.user as any)?.role;
    const isUser = userRole === 'user';
    const [bills, setBills] = useState<Bill[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [filters, setFilters] = useState({ status: '', month: '', year: '' });

    // Category form
    const [categoryName, setCategoryName] = useState('');
    const [categoryDesc, setCategoryDesc] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Form state
    const [selectedFloor, setSelectedFloor] = useState('');
    const [selectedShops, setSelectedShops] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        billMonth: months[new Date().getMonth()],
        billYear: new Date().getFullYear(),
        billDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        category: '',
        rentAmount: '',
        maintenanceCharge: '',
        electricityCharge: '',
        waterCharge: '',
        otherCharges: '',
        discount: ''
    });
    const [paymentData, setPaymentData] = useState({ billId: '', amount: 0, paymentMethod: 'cash', notes: '' });

    useEffect(() => { fetchData(); }, [filters]);

    const fetchData = async () => {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.month) params.set('month', filters.month);
        if (filters.year) params.set('year', filters.year);

        const [billsRes, shopsRes, floorsRes, categoriesRes] = await Promise.all([
            fetch(`/api/bills?${params}`),
            fetch('/api/shops'),
            fetch('/api/floors'),
            fetch('/api/categories')
        ]);
        setBills(await billsRes.json());
        setShops(await shopsRes.json());
        setFloors(await floorsRes.json());
        setCategories(await categoriesRes.json());
        setLoading(false);
    };

    // Filter shops by selected floor
    const filteredShops = selectedFloor
        ? shops.filter(s => {
            const floorId = typeof s.floorId === 'object' ? s.floorId._id : s.floorId;
            return floorId === selectedFloor;
        })
        : shops;

    const handleFloorChange = (floorId: string) => {
        setSelectedFloor(floorId);
        setSelectedShops([]); // Reset shops when floor changes
    };

    const handleShopToggle = (shopId: string) => {
        setSelectedShops(prev =>
            prev.includes(shopId)
                ? prev.filter(id => id !== shopId)
                : [...prev, shopId]
        );
    };

    const selectAllShops = () => {
        if (selectedShops.length === filteredShops.length) {
            setSelectedShops([]);
        } else {
            setSelectedShops(filteredShops.map(s => s._id));
        }
    };

    const resetForm = () => {
        setSelectedFloor('');
        setSelectedShops([]);
        setFormData({
            billMonth: months[new Date().getMonth()],
            billYear: new Date().getFullYear(),
            billDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            category: '',
            rentAmount: '',
            maintenanceCharge: '',
            electricityCharge: '',
            waterCharge: '',
            otherCharges: '',
            discount: ''
        });
    };

    // Category CRUD
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: categoryName, description: categoryDesc })
        });
        if (res.ok) {
            toast.success('Category Added!', `"${categoryName}" has been added`);
            setCategoryName('');
            setCategoryDesc('');
            fetchData();
        } else {
            const data = await res.json();
            toast.error('Failed!', data.error || 'Could not add category');
        }
    };

    const handleEditCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;
        const res = await fetch('/api/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingCategory._id, name: categoryName, description: categoryDesc })
        });
        if (res.ok) {
            toast.success('Category Updated!', `"${categoryName}" has been updated`);
            setEditingCategory(null);
            setCategoryName('');
            setCategoryDesc('');
            fetchData();
        } else {
            toast.error('Failed!', 'Could not update category');
        }
    };

    const handleDeleteCategory = async (cat: Category) => {
        const confirmed = await confirm({
            title: 'Delete Category?',
            message: `Are you sure you want to delete "${cat.name}"?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });
        if (!confirmed) return;

        const res = await fetch(`/api/categories?id=${cat._id}`, { method: 'DELETE' });
        if (res.ok) {
            toast.success('Category Deleted!', `"${cat.name}" has been deleted`);
            fetchData();
        } else {
            toast.error('Failed!', 'Could not delete category');
        }
    };

    const openEditCategory = (cat: Category) => {
        setEditingCategory(cat);
        setCategoryName(cat.name);
        setCategoryDesc(cat.description || '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedShops.length === 0) {
            toast.warning('Select Shops', 'Please select at least one shop');
            return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const shopId of selectedShops) {
            const shop = shops.find(s => s._id === shopId);
            const submitData = {
                shopId,
                ...formData,
                rentAmount: parseFloat(formData.rentAmount) || shop?.rentAmount || 0,
                maintenanceCharge: parseFloat(formData.maintenanceCharge) || shop?.maintenanceCharge || 0,
                electricityCharge: parseFloat(formData.electricityCharge) || 0,
                waterCharge: parseFloat(formData.waterCharge) || 0,
                otherCharges: parseFloat(formData.otherCharges) || 0,
                discount: parseFloat(formData.discount) || 0
            };

            const res = await fetch('/api/bills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData)
            });
            if (res.ok) successCount++;
            else failCount++;
        }

        if (successCount > 0) {
            toast.success('Bills Created!', `${successCount} bill(s) created successfully`);
            setShowModal(false);
            resetForm();
            fetchData();
        }
        if (failCount > 0) {
            toast.error('Some Failed!', `${failCount} bill(s) could not be created`);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBill) return;

        const submitData = {
            id: selectedBill._id,
            shopId: selectedShops[0],
            ...formData,
            rentAmount: parseFloat(formData.rentAmount) || 0,
            maintenanceCharge: parseFloat(formData.maintenanceCharge) || 0,
            electricityCharge: parseFloat(formData.electricityCharge) || 0,
            waterCharge: parseFloat(formData.waterCharge) || 0,
            otherCharges: parseFloat(formData.otherCharges) || 0,
            discount: parseFloat(formData.discount) || 0
        };

        const res = await fetch('/api/bills', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submitData)
        });
        if (res.ok) {
            toast.success('Bill Updated!', 'Bill has been updated successfully');
            setShowEditModal(false);
            setSelectedBill(null);
            resetForm();
            fetchData();
        } else {
            toast.error('Failed!', 'Could not update bill');
        }
    };

    const handleDelete = async (bill: Bill) => {
        const confirmed = await confirm({
            title: 'Delete Bill?',
            message: `Are you sure you want to delete bill "${bill.billNumber}"? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });

        if (!confirmed) return;

        const res = await fetch(`/api/bills?id=${bill._id}`, { method: 'DELETE' });
        if (res.ok) {
            toast.success('Bill Deleted!', `Bill "${bill.billNumber}" has been deleted`);
            fetchData();
        } else {
            toast.error('Failed!', 'Could not delete bill');
        }
    };

    const openEditModal = (bill: Bill) => {
        setSelectedBill(bill);
        const shop = shops.find(s => s._id === (typeof bill.shopId === 'object' ? bill.shopId._id : bill.shopId));
        if (shop && shop.floorId) {
            setSelectedFloor(typeof shop.floorId === 'object' ? shop.floorId._id : shop.floorId);
        }
        setSelectedShops([typeof bill.shopId === 'object' ? bill.shopId._id : bill.shopId]);
        setFormData({
            billMonth: bill.billMonth,
            billYear: bill.billYear,
            billDate: bill.billDate?.split('T')[0] || '',
            dueDate: bill.dueDate?.split('T')[0] || '',
            category: bill.category?._id || '',
            rentAmount: bill.rentAmount ? bill.rentAmount.toString() : '',
            maintenanceCharge: bill.maintenanceCharge ? bill.maintenanceCharge.toString() : '',
            electricityCharge: bill.electricityCharge ? bill.electricityCharge.toString() : '',
            waterCharge: bill.waterCharge ? bill.waterCharge.toString() : '',
            otherCharges: bill.otherCharges ? bill.otherCharges.toString() : '',
            discount: bill.discount ? bill.discount.toString() : ''
        });
        setShowEditModal(true);
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });
        if (res.ok) {
            toast.success('Payment Recorded!', `₹${paymentData.amount} payment successful`);
        } else {
            toast.error('Failed!', 'Could not record payment');
        }
        setShowPaymentModal(false);
        setSelectedBill(null);
        fetchData();
    };

    const openPaymentModal = (bill: Bill) => {
        setSelectedBill(bill);
        setPaymentData({ billId: bill._id, amount: bill.balanceAmount, paymentMethod: 'cash', notes: '' });
        setShowPaymentModal(true);
    };

    const total = (parseFloat(formData.rentAmount) || 0) +
        (parseFloat(formData.maintenanceCharge) || 0) +
        (parseFloat(formData.electricityCharge) || 0) +
        (parseFloat(formData.waterCharge) || 0) +
        (parseFloat(formData.otherCharges) || 0) -
        (parseFloat(formData.discount) || 0);

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">Bills</h1>
                    <p className="text-[var(--text-tertiary)] mt-1">Create and manage bills</p>
                </div>
                {!isUser && (
                    <div className="flex gap-3">
                        <button onClick={() => setShowCategoryModal(true)} className="px-4 py-2 rounded-lg flex items-center gap-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors">
                            <Tag className="w-5 h-5" /> Add Category
                        </button>
                        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 text-white">
                            <Plus className="w-5 h-5" /> Create Bill
                        </button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4 flex flex-wrap gap-4 items-center">
                <Filter className="w-5 h-5 text-[var(--text-muted)]" />
                <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                </select>
                <select value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })} className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]">
                    <option value="">All Months</option>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })} className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]">
                    <option value="">All Years</option>
                    {[2025, 2024, 2023, 2022].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {(filters.status || filters.month || filters.year) && (
                    <button onClick={() => setFilters({ status: '', month: '', year: '' })} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Bills Table */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-[var(--bg-tertiary)]">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm text-[var(--text-tertiary)] font-medium">Bill No.</th>
                            <th className="text-left px-6 py-4 text-sm text-[var(--text-tertiary)] font-medium">Shop</th>
                            <th className="text-left px-6 py-4 text-sm text-[var(--text-tertiary)] font-medium">Period</th>
                            <th className="text-left px-6 py-4 text-sm text-[var(--text-tertiary)] font-medium">Total</th>
                            <th className="text-left px-6 py-4 text-sm text-[var(--text-tertiary)] font-medium">Balance</th>
                            <th className="text-left px-6 py-4 text-sm text-[var(--text-tertiary)] font-medium">Status</th>
                            <th className="text-left px-6 py-4 text-sm text-[var(--text-tertiary)] font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bills.map(bill => (
                            <tr key={bill._id} className="border-t border-[var(--border-primary)] hover:bg-[var(--bg-hover)]">
                                <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{bill.billNumber}</td>
                                <td className="px-6 py-4">
                                    <p className="text-[var(--text-primary)]">{bill.shopId?.shopNumber}</p>
                                    <p className="text-sm text-[var(--text-muted)]">{bill.userId?.name || 'N/A'}</p>
                                </td>
                                <td className="px-6 py-4 text-[var(--text-primary)]">{bill.billMonth} {bill.billYear}</td>
                                <td className="px-6 py-4 text-[var(--text-primary)]">₹{bill.totalAmount?.toLocaleString('en-IN')}</td>
                                <td className="px-6 py-4 text-red-500">₹{bill.balanceAmount?.toLocaleString('en-IN')}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${bill.status === 'paid' ? 'bg-green-500/20 text-green-500' :
                                        bill.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                                            'bg-indigo-500/20 text-indigo-500'
                                        }`}>{bill.status}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        <a href={`/api/bills/${bill._id}/pdf`} target="_blank" className="p-2 hover:bg-blue-500/20 rounded-lg" title="View Bill">
                                            <Eye className="w-4 h-4 text-blue-500" />
                                        </a>
                                        <a href={`/api/bills/${bill._id}/pdf?download=true`} target="_blank" className="p-2 hover:bg-indigo-500/20 rounded-lg" title="Download PDF">
                                            <Download className="w-4 h-4 text-indigo-500" />
                                        </a>
                                        {!isUser && (
                                            <>
                                                <button onClick={() => openEditModal(bill)} className="p-2 hover:bg-amber-500/20 rounded-lg" title="Edit Bill">
                                                    <Pencil className="w-4 h-4 text-amber-500" />
                                                </button>
                                                <button onClick={() => handleDelete(bill)} className="p-2 hover:bg-red-500/20 rounded-lg" title="Delete Bill">
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                                {bill.status !== 'paid' && (
                                                    <button onClick={() => openPaymentModal(bill)} className="p-2 hover:bg-green-500/20 rounded-lg" title="Record Payment">
                                                        <IndianRupee className="w-4 h-4 text-green-500" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {bills.length === 0 && <div className="text-center py-12 text-[var(--text-muted)]">No bills found</div>}
            </div>

            {/* Category Management Modal */}
            <Modal isOpen={showCategoryModal} onClose={() => { setShowCategoryModal(false); setEditingCategory(null); setCategoryName(''); setCategoryDesc(''); }} title="Manage Categories" size="lg" icon={<Tag className="w-5 h-5" />}>
                <div className="p-6 space-y-6">
                    {/* Add/Edit Category Form */}
                    <form onSubmit={editingCategory ? handleEditCategory : handleAddCategory} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Category Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Rent, Electricity"
                                    value={categoryName}
                                    onChange={e => setCategoryName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Description</label>
                                <input
                                    type="text"
                                    placeholder="Optional description"
                                    value={categoryDesc}
                                    onChange={e => setCategoryDesc(e.target.value)}
                                    className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="btn-primary px-4 py-2 rounded-lg text-white">
                                {editingCategory ? 'Update Category' : 'Add Category'}
                            </button>
                            {editingCategory && (
                                <button type="button" onClick={() => { setEditingCategory(null); setCategoryName(''); setCategoryDesc(''); }} className="px-4 py-2 text-[var(--text-tertiary)]">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Categories List */}
                    <div className="border-t border-[var(--border-primary)] pt-4">
                        <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-3">Existing Categories</h3>
                        {categories.length === 0 ? (
                            <p className="text-[var(--text-muted)] text-center py-4">No categories yet. Add your first category above.</p>
                        ) : (
                            <div className="space-y-2">
                                {categories.map(cat => (
                                    <div key={cat._id} className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <div>
                                            <p className="font-medium text-[var(--text-primary)]">{cat.name}</p>
                                            {cat.description && <p className="text-sm text-[var(--text-muted)]">{cat.description}</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditCategory(cat)} className="p-2 hover:bg-indigo-500/20 rounded-lg" title="Edit">
                                                <Pencil className="w-4 h-4 text-indigo-500" />
                                            </button>
                                            <button onClick={() => handleDeleteCategory(cat)} className="p-2 hover:bg-red-500/20 rounded-lg" title="Delete">
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Create Bill Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Bill" size="lg" icon={<Receipt className="w-5 h-5" />}>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Floor Selection */}
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Floor *</label>
                            <select value={selectedFloor} onChange={e => handleFloorChange(e.target.value)} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]">
                                <option value="">Select Floor</option>
                                {floors.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                            </select>
                        </div>
                        {/* Category */}
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Category *</label>
                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]">
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>

                        {/* Multi-Select Shops */}
                        <div className="col-span-2">
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm text-[var(--text-tertiary)]">Select Shops * ({selectedShops.length} selected)</label>
                                {selectedFloor && filteredShops.length > 0 && (
                                    <button type="button" onClick={selectAllShops} className="text-xs text-indigo-500 hover:underline">
                                        {selectedShops.length === filteredShops.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                )}
                            </div>
                            <div className="max-h-40 overflow-y-auto border border-[var(--border-primary)] rounded-lg p-2 bg-[var(--bg-tertiary)]">
                                {!selectedFloor ? (
                                    <p className="text-[var(--text-muted)] text-center py-4">Select a floor first</p>
                                ) : filteredShops.length === 0 ? (
                                    <p className="text-[var(--text-muted)] text-center py-4">No shops on this floor</p>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {filteredShops.map(shop => (
                                            <label key={shop._id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${selectedShops.includes(shop._id) ? 'bg-indigo-500/20 border border-indigo-500' : 'hover:bg-[var(--bg-hover)] border border-transparent'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedShops.includes(shop._id)}
                                                    onChange={() => handleShopToggle(shop._id)}
                                                    className="rounded border-[var(--border-primary)]"
                                                />
                                                <span className="text-sm text-[var(--text-primary)]">{shop.shopNumber}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bill Date */}
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Bill Date *</label>
                            <input type="date" value={formData.billDate} onChange={e => setFormData({ ...formData, billDate: e.target.value })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        {/* Due Date */}
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Due Date *</label>
                            <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        {/* Month */}
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Month *</label>
                            <select value={formData.billMonth} onChange={e => setFormData({ ...formData, billMonth: e.target.value })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]">
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        {/* Year */}
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Year *</label>
                            <select value={formData.billYear} onChange={e => setFormData({ ...formData, billYear: parseInt(e.target.value) })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]">
                                {[2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        {/* Charges */}
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Rent (₹)</label>
                            <input type="number" placeholder="Enter amount" value={formData.rentAmount} onChange={e => setFormData({ ...formData, rentAmount: e.target.value })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Maintenance (₹)</label>
                            <input type="number" placeholder="Enter amount" value={formData.maintenanceCharge} onChange={e => setFormData({ ...formData, maintenanceCharge: e.target.value })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Electricity (₹)</label>
                            <input type="number" placeholder="Enter amount" value={formData.electricityCharge} onChange={e => setFormData({ ...formData, electricityCharge: e.target.value })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Water (₹)</label>
                            <input type="number" placeholder="Enter amount" value={formData.waterCharge} onChange={e => setFormData({ ...formData, waterCharge: e.target.value })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Other (₹)</label>
                            <input type="number" placeholder="Enter amount" value={formData.otherCharges} onChange={e => setFormData({ ...formData, otherCharges: e.target.value })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Discount (₹)</label>
                            <input type="number" placeholder="Enter amount" value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                    </div>
                    <div className="bg-indigo-500/10 p-4 rounded-lg flex justify-between">
                        <span className="text-[var(--text-primary)]">Total Amount (per shop):</span>
                        <span className="text-xl font-bold text-indigo-500">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-[var(--text-tertiary)]">Cancel</button>
                        <button type="submit" className="btn-primary px-4 py-2 rounded-lg text-white">Create {selectedShops.length > 1 ? `${selectedShops.length} Bills` : 'Bill'}</button>
                    </div>
                </form>
            </Modal>

            {/* Edit Bill Modal */}
            <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedBill(null); }} title="Edit Bill" size="lg" icon={<Pencil className="w-5 h-5" />}>
                <form onSubmit={handleEdit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Floor Selection */}
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Floor</label>
                            <select value={selectedFloor} onChange={e => handleFloorChange(e.target.value)} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]">
                                <option value="">Select Floor</option>
                                {floors.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                            </select>
                        </div>
                        {/* Shop */}
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Shop</label>
                            <select value={selectedShops[0] || ''} onChange={e => setSelectedShops([e.target.value])} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]">
                                <option value="">Select Shop</option>
                                {filteredShops.map(s => <option key={s._id} value={s._id}>{s.shopNumber} - {s.name}</option>)}
                            </select>
                        </div>
                        {/* Category */}
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Category *</label>
                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]">
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        {/* Bill Date */}
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Bill Date *</label>
                            <input type="date" value={formData.billDate} onChange={e => setFormData({ ...formData, billDate: e.target.value })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        {/* Month */}
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Month *</label>
                            <select value={formData.billMonth} onChange={e => setFormData({ ...formData, billMonth: e.target.value })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]">
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        {/* Year */}
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Year *</label>
                            <select value={formData.billYear} onChange={e => setFormData({ ...formData, billYear: parseInt(e.target.value) })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]">
                                {[2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        {/* Due Date */}
                        <div className="col-span-2">
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Due Date *</label>
                            <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        {/* Charges */}
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Rent (₹)</label>
                            <input type="number" placeholder="Enter amount" value={formData.rentAmount} onChange={e => setFormData({ ...formData, rentAmount: e.target.value })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Maintenance (₹)</label>
                            <input type="number" placeholder="Enter amount" value={formData.maintenanceCharge} onChange={e => setFormData({ ...formData, maintenanceCharge: e.target.value })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Electricity (₹)</label>
                            <input type="number" placeholder="Enter amount" value={formData.electricityCharge} onChange={e => setFormData({ ...formData, electricityCharge: e.target.value })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Water (₹)</label>
                            <input type="number" placeholder="Enter amount" value={formData.waterCharge} onChange={e => setFormData({ ...formData, waterCharge: e.target.value })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Other (₹)</label>
                            <input type="number" placeholder="Enter amount" value={formData.otherCharges} onChange={e => setFormData({ ...formData, otherCharges: e.target.value })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Discount (₹)</label>
                            <input type="number" placeholder="Enter amount" value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                    </div>
                    <div className="bg-indigo-500/10 p-4 rounded-lg flex justify-between">
                        <span className="text-[var(--text-primary)]">Total Amount:</span>
                        <span className="text-xl font-bold text-indigo-500">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
                        <button type="button" onClick={() => { setShowEditModal(false); setSelectedBill(null); }} className="px-4 py-2 text-[var(--text-tertiary)]">Cancel</button>
                        <button type="submit" className="btn-primary px-4 py-2 rounded-lg text-white">Update Bill</button>
                    </div>
                </form>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Record Payment" icon={<IndianRupee className="w-5 h-5" />}>
                <form onSubmit={handlePayment} className="p-6 space-y-4">
                    <div className="bg-red-500/10 p-4 rounded-lg flex justify-between mb-4">
                        <span className="text-[var(--text-primary)]">Balance Due:</span>
                        <span className="text-xl font-bold text-red-500">₹{selectedBill?.balanceAmount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--text-tertiary)] mb-1">Amount (₹) *</label>
                        <input type="number" value={paymentData.amount} onChange={e => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })} max={selectedBill?.balanceAmount} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--text-tertiary)] mb-1">Payment Method *</label>
                        <select value={paymentData.paymentMethod} onChange={e => setPaymentData({ ...paymentData, paymentMethod: e.target.value })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]">
                            <option value="cash">Cash</option>
                            <option value="upi">UPI</option>
                            <option value="cheque">Cheque</option>
                            <option value="bank_transfer">Bank Transfer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--text-tertiary)] mb-1">Notes</label>
                        <textarea value={paymentData.notes} onChange={e => setPaymentData({ ...paymentData, notes: e.target.value })} rows={2} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
                        <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-[var(--text-tertiary)]">Cancel</button>
                        <button type="submit" className="btn-primary px-4 py-2 rounded-lg text-white">Record Payment</button>
                    </div>
                </form>
            </Modal>

            {/* View Bill Modal */}
            <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Bill Details" size="lg" icon={<Eye className="w-5 h-5" />}>
                {selectedBill && (
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-[var(--text-tertiary)]">Bill Number</p>
                                <p className="font-semibold text-[var(--text-primary)]">{selectedBill.billNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-tertiary)]">Status</p>
                                <span className={`px-2 py-1 rounded-full text-xs ${selectedBill.status === 'paid' ? 'bg-green-500/20 text-green-500' :
                                    selectedBill.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                                        'bg-indigo-500/20 text-indigo-500'
                                    }`}>{selectedBill.status}</span>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-tertiary)]">Shop</p>
                                <p className="font-semibold text-[var(--text-primary)]">{selectedBill.shopId?.shopNumber} - {selectedBill.shopId?.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-tertiary)]">Period</p>
                                <p className="font-semibold text-[var(--text-primary)]">{selectedBill.billMonth} {selectedBill.billYear}</p>
                            </div>
                        </div>
                        <hr className="border-[var(--border-primary)]" />
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-[var(--text-tertiary)]">Total Amount</span>
                                <span className="font-bold text-[var(--text-primary)]">₹{selectedBill.totalAmount?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--text-tertiary)]">Paid Amount</span>
                                <span className="font-bold text-green-500">₹{selectedBill.paidAmount?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--text-tertiary)]">Balance Due</span>
                                <span className="font-bold text-red-500">₹{selectedBill.balanceAmount?.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
                            <button onClick={() => setShowViewModal(false)} className="px-4 py-2 text-[var(--text-tertiary)]">Close</button>
                            <a href={`/api/bills/${selectedBill._id}/pdf`} target="_blank" className="btn-primary px-4 py-2 rounded-lg text-white flex items-center gap-2">
                                <Download className="w-4 h-4" /> Download PDF
                            </a>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
