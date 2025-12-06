'use client';

import { useState, useEffect } from 'react';
import { Receipt, Plus, IndianRupee, Filter, X, Download, Eye } from 'lucide-react';
import Modal from '@/components/Modal';
import { useSession } from 'next-auth/react';

interface Bill {
    _id: string;
    billNumber: string;
    shopId: { shopNumber: string; name: string };
    userId?: { name: string };
    billMonth: string;
    billYear: number;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: string;
}

interface Shop {
    _id: string;
    shopNumber: string;
    name: string;
    buildingId: { name: string };
    rentAmount: number;
    maintenanceCharge: number;
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function BillsPage() {
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role;
    const isUser = userRole === 'user';
    const [bills, setBills] = useState<Bill[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [filters, setFilters] = useState({ status: '', month: '', year: '' });
    const [formData, setFormData] = useState({
        shopId: '', billMonth: months[new Date().getMonth()], billYear: new Date().getFullYear(),
        dueDate: '', rentAmount: 0, maintenanceCharge: 0, electricityCharge: 0, waterCharge: 0, otherCharges: 0, discount: 0
    });
    const [paymentData, setPaymentData] = useState({ billId: '', amount: 0, paymentMethod: 'cash', notes: '' });

    useEffect(() => { fetchData(); }, [filters]);

    const fetchData = async () => {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.month) params.set('month', filters.month);
        if (filters.year) params.set('year', filters.year);

        const [billsRes, shopsRes] = await Promise.all([
            fetch(`/api/bills?${params}`),
            fetch('/api/shops')
        ]);
        setBills(await billsRes.json());
        setShops(await shopsRes.json());
        setLoading(false);
    };

    const handleShopSelect = (shopId: string) => {
        const shop = shops.find(s => s._id === shopId);
        setFormData({
            ...formData, shopId,
            rentAmount: shop?.rentAmount || 0,
            maintenanceCharge: shop?.maintenanceCharge || 0
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/bills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        setShowModal(false);
        setFormData({ shopId: '', billMonth: months[new Date().getMonth()], billYear: new Date().getFullYear(), dueDate: '', rentAmount: 0, maintenanceCharge: 0, electricityCharge: 0, waterCharge: 0, otherCharges: 0, discount: 0 });
        fetchData();
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });
        setShowPaymentModal(false);
        setSelectedBill(null);
        fetchData();
    };

    const openPaymentModal = (bill: Bill) => {
        setSelectedBill(bill);
        setPaymentData({ billId: bill._id, amount: bill.balanceAmount, paymentMethod: 'cash', notes: '' });
        setShowPaymentModal(true);
    };

    const total = formData.rentAmount + formData.maintenanceCharge + formData.electricityCharge + formData.waterCharge + formData.otherCharges - formData.discount;

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">Bills</h1>
                    <p className="text-[var(--text-tertiary)] mt-1">Create and manage bills</p>
                </div>
                {!isUser && (
                    <button onClick={() => setShowModal(true)} className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 text-white">
                        <Plus className="w-5 h-5" /> Create Bill
                    </button>
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
                                        {/* View bill details */}
                                        <button onClick={() => { setSelectedBill(bill); setShowViewModal(true); }} className="p-2 hover:bg-blue-500/20 rounded-lg" title="View Bill">
                                            <Eye className="w-4 h-4 text-blue-500" />
                                        </button>
                                        {/* PDF Download for all users */}
                                        <a href={`/api/bills/${bill._id}/pdf`} target="_blank" className="p-2 hover:bg-indigo-500/20 rounded-lg" title="Download PDF">
                                            <Download className="w-4 h-4 text-indigo-500" />
                                        </a>
                                        {/* Payment button only for admin/owner */}
                                        {!isUser && bill.status !== 'paid' && (
                                            <button onClick={() => openPaymentModal(bill)} className="p-2 hover:bg-green-500/20 rounded-lg" title="Record Payment">
                                                <IndianRupee className="w-4 h-4 text-green-500" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {bills.length === 0 && <div className="text-center py-12 text-[var(--text-muted)]">No bills found</div>}
            </div>

            {/* Create Bill Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Bill" size="lg" icon={<Receipt className="w-5 h-5" />}>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Shop *</label>
                            <select value={formData.shopId} onChange={e => handleShopSelect(e.target.value)} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]">
                                <option value="">Select Shop</option>
                                {shops.map(s => <option key={s._id} value={s._id}>{s.buildingId?.name} &gt; {s.shopNumber} - {s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Month</label>
                            <select value={formData.billMonth} onChange={e => setFormData({ ...formData, billMonth: e.target.value })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]">
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Year</label>
                            <select value={formData.billYear} onChange={e => setFormData({ ...formData, billYear: parseInt(e.target.value) })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]">
                                {[2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Due Date *</label>
                            <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} required className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Rent (₹)</label>
                            <input type="number" value={formData.rentAmount} onChange={e => setFormData({ ...formData, rentAmount: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Maintenance (₹)</label>
                            <input type="number" value={formData.maintenanceCharge} onChange={e => setFormData({ ...formData, maintenanceCharge: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Electricity (₹)</label>
                            <input type="number" value={formData.electricityCharge} onChange={e => setFormData({ ...formData, electricityCharge: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Water (₹)</label>
                            <input type="number" value={formData.waterCharge} onChange={e => setFormData({ ...formData, waterCharge: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Other (₹)</label>
                            <input type="number" value={formData.otherCharges} onChange={e => setFormData({ ...formData, otherCharges: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-tertiary)] mb-1">Discount (₹)</label>
                            <input type="number" value={formData.discount} onChange={e => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]" />
                        </div>
                    </div>
                    <div className="bg-indigo-500/10 p-4 rounded-lg flex justify-between">
                        <span className="text-[var(--text-primary)]">Total Amount:</span>
                        <span className="text-xl font-bold text-indigo-500">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-[var(--text-tertiary)]">Cancel</button>
                        <button type="submit" className="btn-primary px-4 py-2 rounded-lg text-white">Create Bill</button>
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
