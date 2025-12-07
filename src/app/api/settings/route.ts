import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

// Simple connection function
async function connectDB() {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    await mongoose.connect(MONGODB_URI);
}

// Settings Schema - Extended for PDF customization
const settingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    // App Branding
    appName: { type: String, default: 'BillManager' },
    appLogo: { type: String, default: '🏢' },
    logoType: { type: String, default: 'emoji' },
    // PDF Logo (separate from app branding)
    pdfLogo: { type: String, default: '' },
    // Company Details for PDF
    companyName: { type: String, default: '' },
    companyAddress: { type: String, default: '' },
    companyCity: { type: String, default: '' },
    companyGst: { type: String, default: '' },
    companyPhone: { type: String, default: '' },
    companyEmail: { type: String, default: '' },
    // Bank Details for PDF
    bankName: { type: String, default: '' },
    bankAccount: { type: String, default: '' },
    bankIfsc: { type: String, default: '' },
    bankBranch: { type: String, default: '' },
    // UPI for QR Code
    upiId: { type: String, default: '' },
    // PDF Template Selection
    pdfTemplate: { type: String, enum: ['classic', 'modern', 'minimal', 'tax_invoice'], default: 'tax_invoice' },
    // GST and Commission Settings
    gstRate: { type: Number, default: 18 },
    commissionType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    commissionValue: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

// GET - Fetch app settings
export async function GET() {
    try {
        await connectDB();

        let settings = await Settings.findOne({ key: 'main' });

        if (!settings) {
            settings = await Settings.create({
                key: 'main',
                appName: 'BillManager',
                appLogo: '🏢',
                logoType: 'emoji',
                pdfTemplate: 'tax_invoice'
            });
        }

        return NextResponse.json({
            // App Branding
            appName: settings.appName || 'BillManager',
            appLogo: settings.appLogo || '🏢',
            logoType: settings.logoType || 'emoji',
            // PDF Logo
            pdfLogo: settings.pdfLogo || '',
            // Company Details
            companyName: settings.companyName || '',
            companyAddress: settings.companyAddress || '',
            companyCity: settings.companyCity || '',
            companyGst: settings.companyGst || '',
            companyPhone: settings.companyPhone || '',
            companyEmail: settings.companyEmail || '',
            // Bank Details
            bankName: settings.bankName || '',
            bankAccount: settings.bankAccount || '',
            bankIfsc: settings.bankIfsc || '',
            bankBranch: settings.bankBranch || '',
            // UPI
            upiId: settings.upiId || '',
            // PDF Template
            pdfTemplate: settings.pdfTemplate || 'tax_invoice',
            // GST and Commission
            gstRate: settings.gstRate ?? 18,
            commissionType: settings.commissionType || 'percentage',
            commissionValue: settings.commissionValue ?? 0
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate'
            }
        });
    } catch (error: any) {
        console.error('Settings GET error:', error.message);
        return NextResponse.json({
            appName: 'BillManager',
            appLogo: '🏢',
            logoType: 'emoji',
            pdfTemplate: 'tax_invoice'
        });
    }
}

// POST - Update app settings
export async function POST(request: Request) {
    try {
        await connectDB();

        const body = await request.json();
        const {
            appName, appLogo, logoType, pdfLogo,
            companyName, companyAddress, companyCity, companyGst, companyPhone, companyEmail,
            bankName, bankAccount, bankIfsc, bankBranch,
            upiId, pdfTemplate,
            gstRate, commissionType, commissionValue
        } = body;

        const updateData: any = {
            updatedAt: new Date()
        };

        // Only update fields that are provided
        if (appName !== undefined) updateData.appName = appName || 'BillManager';
        if (appLogo !== undefined) updateData.appLogo = appLogo || '🏢';
        if (logoType !== undefined) updateData.logoType = logoType || 'emoji';
        if (pdfLogo !== undefined) updateData.pdfLogo = pdfLogo;
        if (companyName !== undefined) updateData.companyName = companyName;
        if (companyAddress !== undefined) updateData.companyAddress = companyAddress;
        if (companyCity !== undefined) updateData.companyCity = companyCity;
        if (companyGst !== undefined) updateData.companyGst = companyGst;
        if (companyPhone !== undefined) updateData.companyPhone = companyPhone;
        if (companyEmail !== undefined) updateData.companyEmail = companyEmail;
        if (bankName !== undefined) updateData.bankName = bankName;
        if (bankAccount !== undefined) updateData.bankAccount = bankAccount;
        if (bankIfsc !== undefined) updateData.bankIfsc = bankIfsc;
        if (bankBranch !== undefined) updateData.bankBranch = bankBranch;
        if (upiId !== undefined) updateData.upiId = upiId;
        if (pdfTemplate !== undefined) updateData.pdfTemplate = pdfTemplate;
        if (gstRate !== undefined) updateData.gstRate = gstRate;
        if (commissionType !== undefined) updateData.commissionType = commissionType;
        if (commissionValue !== undefined) updateData.commissionValue = commissionValue;

        const settings = await Settings.findOneAndUpdate(
            { key: 'main' },
            updateData,
            { upsert: true, new: true }
        );

        return NextResponse.json({
            success: true,
            ...settings.toObject()
        });
    } catch (error: any) {
        console.error('Settings POST error:', error.message);
        return NextResponse.json({
            error: 'Failed to save settings',
            message: error.message
        }, { status: 500 });
    }
}

