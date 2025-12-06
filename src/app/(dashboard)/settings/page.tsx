'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Save, Palette, Building2, Upload, X, FileText, CreditCard, QrCode } from 'lucide-react';
import { useSession } from 'next-auth/react';
import RoleGuard from '@/components/RoleGuard';
import { useToast } from '@/components/Toast';

const themeOptions = [
    { id: 'system', label: 'System (Auto)', icon: Monitor },
    { id: 'dark', label: 'Dark Mode', icon: Moon },
    { id: 'light', label: 'Light Mode', icon: Sun },
];

const logoOptions = ['🏢', '🏠', '🏗️', '🏬', '🏛️', '💼', '📊', '💰', '🧾', '📋'];

const pdfTemplates = [
    { id: 'tax_invoice', name: 'Tax Invoice', desc: 'Professional GST invoice with QR code' },
    { id: 'modern', name: 'Modern', desc: 'Clean modern design with colors' },
    { id: 'classic', name: 'Classic', desc: 'Traditional simple format' },
    { id: 'minimal', name: 'Minimal', desc: 'Simple and clean layout' }
];

export default function SettingsPage() {
    const { data: session } = useSession();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const toast = useToast();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('branding');

    // App Branding
    const [appName, setAppName] = useState('BillManager');
    const [appLogo, setAppLogo] = useState('🏢');
    const [logoType, setLogoType] = useState<'emoji' | 'image'>('emoji');
    const [customLogoUrl, setCustomLogoUrl] = useState('');

    // Company Details
    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyCity, setCompanyCity] = useState('');
    const [companyGst, setCompanyGst] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');

    // Bank Details
    const [bankName, setBankName] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [bankIfsc, setBankIfsc] = useState('');
    const [bankBranch, setBankBranch] = useState('');

    // UPI & PDF
    const [upiId, setUpiId] = useState('');
    const [pdfTemplate, setPdfTemplate] = useState('tax_invoice');

    // GST & Commission
    const [gstRate, setGstRate] = useState(18);
    const [commissionType, setCommissionType] = useState<'percentage' | 'fixed'>('percentage');
    const [commissionValue, setCommissionValue] = useState(0);

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const userRole = (session?.user as any)?.role;
    const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

    useEffect(() => {
        setMounted(true);
        if (isOwnerOrAdmin) {
            fetchSettings();
        } else {
            setLoading(false);
        }
    }, [isOwnerOrAdmin]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                // App Branding
                setAppName(data.appName || 'BillManager');
                setAppLogo(data.appLogo || '🏢');
                setLogoType(data.logoType || 'emoji');
                if (data.logoType === 'image') setCustomLogoUrl(data.appLogo);
                // Company
                setCompanyName(data.companyName || '');
                setCompanyAddress(data.companyAddress || '');
                setCompanyCity(data.companyCity || '');
                setCompanyGst(data.companyGst || '');
                setCompanyPhone(data.companyPhone || '');
                setCompanyEmail(data.companyEmail || '');
                // Bank
                setBankName(data.bankName || '');
                setBankAccount(data.bankAccount || '');
                setBankIfsc(data.bankIfsc || '');
                setBankBranch(data.bankBranch || '');
                // UPI & PDF
                setUpiId(data.upiId || '');
                setPdfTemplate(data.pdfTemplate || 'tax_invoice');
                // GST & Commission
                setGstRate(data.gstRate ?? 18);
                setCommissionType(data.commissionType || 'percentage');
                setCommissionValue(data.commissionValue ?? 0);
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 500000) {
                setError('Image too large. Max 500KB allowed.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setCustomLogoUrl(base64);
                setLogoType('image');
                setAppLogo(base64);
                setError('');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        setError('');

        const logoToSave = logoType === 'image' ? customLogoUrl : appLogo;

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appName: appName.trim() || 'BillManager',
                    appLogo: logoToSave,
                    logoType,
                    companyName, companyAddress, companyCity, companyGst, companyPhone, companyEmail,
                    bankName, bankAccount, bankIfsc, bankBranch,
                    upiId, pdfTemplate,
                    gstRate, commissionType, commissionValue
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
                toast.success('Settings Saved!', 'Your changes have been saved successfully');
                window.dispatchEvent(new CustomEvent('appSettingsChanged'));
            } else {
                toast.error('Failed!', 'Could not save settings');
                setError('Failed to save. Please try again.');
            }
        } catch (err) {
            setError('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (!mounted || loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-[var(--bg-tertiary)] rounded w-48"></div>
                <div className="h-64 bg-[var(--bg-card)] rounded-xl"></div>
            </div>
        );
    }

    const tabs = [
        { id: 'branding', label: 'App Branding', icon: Building2, ownerOnly: true },
        { id: 'company', label: 'Company Details', icon: FileText, ownerOnly: false },
        { id: 'billing', label: 'Billing (GST/Commission)', icon: CreditCard, ownerOnly: false },
        { id: 'bank', label: 'Bank & UPI', icon: CreditCard, ownerOnly: false },
        { id: 'pdf', label: 'PDF Template', icon: QrCode, ownerOnly: false },
        { id: 'theme', label: 'Appearance', icon: Palette, ownerOnly: false }
    ];

    return (
        <RoleGuard allowedRoles={['owner', 'admin']}>
            <div className="space-y-6 animate-fadeIn">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Settings</h1>
                    <p className="text-[var(--text-tertiary)] mt-1">Customize your app and bill templates</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}

                {saved && (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-3 rounded-xl">
                        ✓ Settings saved successfully!
                    </div>
                )}

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-[var(--border-primary)] pb-2">
                    {tabs.filter(tab => !tab.ownerOnly || userRole === 'owner').map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                                ? 'bg-indigo-500 text-white'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6">

                    {/* App Branding Tab */}
                    {activeTab === 'branding' && userRole === 'owner' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-indigo-500" /> App Branding
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">App Name</label>
                                <input
                                    type="text"
                                    value={appName}
                                    onChange={(e) => setAppName(e.target.value)}
                                    className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                    placeholder="Your App Name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Logo Type</label>
                                <div className="flex gap-2">
                                    <button onClick={() => { setLogoType('emoji'); setAppLogo('🏢'); }}
                                        className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${logoType === 'emoji' ? 'bg-indigo-500 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'}`}>
                                        Emoji
                                    </button>
                                    <button onClick={() => setLogoType('image')}
                                        className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${logoType === 'image' ? 'bg-indigo-500 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'}`}>
                                        Image
                                    </button>
                                </div>
                            </div>

                            {logoType === 'emoji' && (
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Select Emoji</label>
                                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                        {logoOptions.map((logo) => (
                                            <button key={logo} onClick={() => setAppLogo(logo)}
                                                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${appLogo === logo ? 'bg-indigo-500 ring-2 ring-indigo-500' : 'bg-[var(--bg-tertiary)]'}`}>
                                                {logo}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {logoType === 'image' && (
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Upload Logo</label>
                                    <div className="flex gap-4 items-start">
                                        <label className="cursor-pointer">
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                            <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-tertiary)] border border-dashed border-[var(--border-secondary)] rounded-xl hover:bg-[var(--bg-hover)]">
                                                <Upload className="w-5 h-5 text-indigo-500" />
                                                <span>Choose Image</span>
                                            </div>
                                        </label>
                                        {customLogoUrl && (
                                            <div className="relative">
                                                <img src={customLogoUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500" />
                                                <button onClick={() => { setCustomLogoUrl(''); setLogoType('emoji'); setAppLogo('🏢'); }}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Company Details Tab */}
                    {activeTab === 'company' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-500" /> Company Details (for PDF)
                            </h2>
                            <p className="text-sm text-[var(--text-muted)]">Yeh details bill PDF mein dikhegi</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Company Name *</label>
                                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                        placeholder="AVADH KONTINA CO. OP. COMMERCIAL SERVICE SOCIETY" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">GST Number</label>
                                    <input type="text" value={companyGst} onChange={(e) => setCompanyGst(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                        placeholder="24AATAA6265H1ZG" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Address</label>
                                    <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                        placeholder="TP-05, RS-111/2B/P1&P2FP-25/2 VIP ROAD" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">City/State</label>
                                    <input type="text" value={companyCity} onChange={(e) => setCompanyCity(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                        placeholder="VESU SURAT-395007" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Phone</label>
                                    <input type="text" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                        placeholder="+91 98765 43210" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email</label>
                                    <input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                        placeholder="contact@company.com" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Billing Settings Tab (GST & Commission) */}
                    {activeTab === 'billing' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-indigo-500" /> Billing Settings
                            </h2>
                            <p className="text-sm text-[var(--text-muted)]">GST aur Commission set karein - Excel import mein auto apply hoga</p>

                            {/* GST Settings */}
                            <div className="bg-[var(--bg-tertiary)] rounded-xl p-4">
                                <h3 className="font-medium text-[var(--text-primary)] mb-4">GST Rate</h3>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={gstRate}
                                            onChange={(e) => setGstRate(Number(e.target.value))}
                                            className="w-24 px-3 py-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)] text-center text-xl font-bold"
                                            min="0" max="50" step="0.5"
                                        />
                                        <span className="text-xl font-bold text-[var(--text-secondary)]">%</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {[5, 12, 18, 28].map(rate => (
                                            <button key={rate} onClick={() => setGstRate(rate)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${gstRate === rate ? 'bg-indigo-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-tertiary)]'}`}>
                                                {rate}%
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-3">Bill mein CGST {gstRate / 2}% + SGST {gstRate / 2}% = {gstRate}% laga jayega</p>
                            </div>

                            {/* Commission Settings */}
                            <div className="bg-[var(--bg-tertiary)] rounded-xl p-4">
                                <h3 className="font-medium text-[var(--text-primary)] mb-4">Commission (Service Charge)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Type</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => setCommissionType('percentage')}
                                                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${commissionType === 'percentage' ? 'bg-indigo-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-tertiary)]'}`}>
                                                Percentage (%)
                                            </button>
                                            <button onClick={() => setCommissionType('fixed')}
                                                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${commissionType === 'fixed' ? 'bg-indigo-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-tertiary)]'}`}>
                                                Fixed Amount (₹)
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                            {commissionType === 'percentage' ? 'Commission %' : 'Fixed Amount ₹'}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={commissionValue}
                                                onChange={(e) => setCommissionValue(Number(e.target.value))}
                                                className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                                min="0"
                                                placeholder={commissionType === 'percentage' ? 'e.g. 5' : 'e.g. 50'}
                                            />
                                            <span className="text-xl font-bold text-[var(--text-secondary)]">
                                                {commissionType === 'percentage' ? '%' : '₹'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-3">
                                    Example: Excel mein ₹100 hai, to bill = ₹100 + GST ({gstRate}%) + Commission ({commissionType === 'percentage' ? commissionValue + '%' : '₹' + commissionValue}) = ₹{(100 + (100 * gstRate / 100) + (commissionType === 'percentage' ? (100 * commissionValue / 100) : commissionValue)).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Bank & UPI Tab */}
                    {activeTab === 'bank' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-indigo-500" /> Bank & UPI Details
                            </h2>
                            <p className="text-sm text-[var(--text-muted)]">Payment details jo bill PDF mein dikhenge</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Bank Name</label>
                                    <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                        placeholder="ICICI BANK" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Account Number</label>
                                    <input type="text" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                        placeholder="750605000790" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">IFSC Code</label>
                                    <input type="text" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                        placeholder="ICIC0007506" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Branch Name</label>
                                    <input type="text" value={bankBranch} onChange={(e) => setBankBranch(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                        placeholder="MAGDALLA, SURAT" />
                                </div>
                            </div>

                            <div className="border-t border-[var(--border-primary)] pt-6">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        <QrCode className="w-4 h-4 inline mr-2" />
                                        UPI ID (for QR Code)
                                    </label>
                                    <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                                        placeholder="yourname@upi or yourname@bankname" />
                                    <p className="text-xs text-[var(--text-muted)] mt-2">
                                        Yeh UPI ID se automatic QR code generate hoga bill PDF mein
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PDF Template Tab */}
                    {activeTab === 'pdf' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-500" /> PDF Template
                            </h2>
                            <p className="text-sm text-[var(--text-muted)]">Bill download karne par yeh template use hogi</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {pdfTemplates.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => setPdfTemplate(template.id)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${pdfTemplate === template.id
                                            ? 'border-indigo-500 bg-indigo-500/10'
                                            : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-[var(--text-primary)]">{template.name}</span>
                                            {pdfTemplate === template.id && (
                                                <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded-full">Selected</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-[var(--text-muted)] mt-1">{template.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Theme Tab */}
                    {activeTab === 'theme' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <Palette className="w-5 h-5 text-indigo-500" /> Appearance
                            </h2>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                                        {resolvedTheme === 'dark' ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-indigo-500" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--text-primary)]">Theme Mode</p>
                                        <p className="text-sm text-[var(--text-muted)] capitalize">Currently: {resolvedTheme}</p>
                                    </div>
                                </div>

                                <select value={theme} onChange={(e) => setTheme(e.target.value)}
                                    className="px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)] min-w-[180px]">
                                    {themeOptions.map((option) => (
                                        <option key={option.id} value={option.id}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    {activeTab !== 'theme' && (
                        <div className="mt-6 pt-6 border-t border-[var(--border-primary)]">
                            <button onClick={handleSaveSettings} disabled={saving}
                                className="btn-primary w-full sm:w-auto px-6 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </RoleGuard>
    );
}
