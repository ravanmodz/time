'use client';

import { useState, useRef } from 'react';
import { Download, Upload, Receipt, CreditCard, Store, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';

export default function ExportPage() {
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importType, setImportType] = useState('shops');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setImportResult(null);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) return;

        setImporting(true);
        setImportResult(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('type', importType);

            const res = await fetch('/api/import', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                setImportResult({ success: true, message: data.message || `Imported ${data.count} records successfully!` });
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                setImportResult({ success: false, message: data.error || 'Import failed' });
            }
        } catch (error) {
            setImportResult({ success: false, message: 'Failed to import file' });
        } finally {
            setImporting(false);
        }
    };

    return (
        <RoleGuard allowedRoles={['owner', 'admin']}>
            <div className="space-y-6 sm:space-y-8 animate-fadeIn">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Import / Export</h1>
                    <p className="text-[var(--text-tertiary)] mt-1">Import data from CSV or export reports</p>
                </div>

                {/* Export Section */}
                <div>
                    <h2 className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">
                        <Download className="w-5 h-5 text-indigo-500" /> Export Data
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 sm:p-6 hover:border-[var(--border-secondary)] transition-all group">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                                <Receipt className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-[var(--text-primary)] mb-1">Bills Report</h3>
                            <p className="text-sm text-[var(--text-tertiary)] mb-4">Export all bills with details</p>
                            <a href="/api/export/bills" className="btn-primary px-4 py-2.5 rounded-xl text-white inline-block text-center w-full sm:w-auto">
                                Download Excel
                            </a>
                        </div>
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 sm:p-6 hover:border-[var(--border-secondary)] transition-all group">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                                <CreditCard className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-[var(--text-primary)] mb-1">Payments Report</h3>
                            <p className="text-sm text-[var(--text-tertiary)] mb-4">Export payment history</p>
                            <a href="/api/export/payments" className="btn-primary px-4 py-2.5 rounded-xl text-white inline-block text-center w-full sm:w-auto">
                                Download Excel
                            </a>
                        </div>
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 sm:p-6 hover:border-[var(--border-secondary)] transition-all group sm:col-span-2 lg:col-span-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                                <Store className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-[var(--text-primary)] mb-1">Shops List</h3>
                            <p className="text-sm text-[var(--text-tertiary)] mb-4">Export all shops with charges</p>
                            <a href="/api/export/shops" className="btn-primary px-4 py-2.5 rounded-xl text-white inline-block text-center w-full sm:w-auto">
                                Download Excel
                            </a>
                        </div>
                    </div>
                </div>

                {/* Import Section */}
                <div>
                    <h2 className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">
                        <Upload className="w-5 h-5 text-indigo-500" /> Import Data
                    </h2>
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 sm:p-8">

                        {/* Import Type Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Import Type</label>
                            <select
                                value={importType}
                                onChange={(e) => setImportType(e.target.value)}
                                className="px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl focus:border-indigo-500 focus:outline-none text-[var(--text-primary)] w-full sm:w-auto"
                            >
                                <option value="shops">Shops</option>
                                <option value="bills">Bills</option>
                                <option value="payments">Payments</option>
                            </select>
                        </div>

                        {/* Result Message */}
                        {importResult && (
                            <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${importResult.success
                                ? 'bg-green-500/10 border border-green-500/30 text-green-500'
                                : 'bg-red-500/10 border border-red-500/30 text-red-500'
                                }`}>
                                {importResult.success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span>{importResult.message}</span>
                            </div>
                        )}

                        {/* File Drop Zone */}
                        <div
                            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition cursor-pointer ${selectedFile ? 'border-indigo-500 bg-indigo-500/5' : 'border-[var(--border-secondary)] hover:border-indigo-500'
                                }`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-16 h-16 mx-auto mb-4 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center">
                                {selectedFile ? (
                                    <FileSpreadsheet className="w-8 h-8 text-indigo-500" />
                                ) : (
                                    <Upload className="w-8 h-8 text-[var(--text-muted)]" />
                                )}
                            </div>

                            {selectedFile ? (
                                <>
                                    <p className="text-[var(--text-primary)] font-medium mb-2">{selectedFile.name}</p>
                                    <p className="text-[var(--text-muted)] text-sm mb-4">
                                        {(selectedFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </>
                            ) : (
                                <p className="text-[var(--text-tertiary)] mb-4">Drag and drop a CSV file here, or click to select</p>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                className="hidden"
                                onChange={handleFileSelect}
                            />

                            {!selectedFile && (
                                <span className="btn-primary px-6 py-2.5 rounded-xl text-white inline-block">
                                    Select File
                                </span>
                            )}
                        </div>

                        {/* Import Button */}
                        {selectedFile && (
                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleImport}
                                    disabled={importing}
                                    className="btn-primary px-6 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {importing ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5" />
                                            Import {importType.charAt(0).toUpperCase() + importType.slice(1)}
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedFile(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    className="px-6 py-3 rounded-xl border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </RoleGuard >
    );
}
