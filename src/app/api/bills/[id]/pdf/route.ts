import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Bill, Payment, ShopUser } from '@/models';
import mongoose from 'mongoose';
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import QRCode from 'qrcode';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Get settings from database
async function getSettings() {
    try {
        const db = mongoose.connection.db;
        if (!db) return {};
        const settings = await db.collection('settings').findOne({ key: 'main' });
        return settings || {};
    } catch (error) {
        return {};
    }
}

// Helper to draw text
function drawText(page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, color = rgb(0, 0, 0)) {
    page.drawText(text, { x, y, size, font, color });
}

export async function GET(
    request: NextRequest,
    context: { params: { id: string } }
) {
    try {
        await dbConnect();

        const { id } = context.params;

        if (!id) {
            return NextResponse.json({ error: 'Bill ID is required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const isDownload = searchParams.get('download') === 'true';

        // Fetch bill
        const bill = await Bill.findById(id)
            .populate('shopId', 'shopNumber name')
            .populate('buildingId', 'name address')
            .lean();

        if (!bill) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
        }

        const b = bill as any;

        // Find customer (ShopUser who has this shop assigned)
        let customerName = '';
        let customerPhone = '';
        let customerEmail = '';

        if (b.shopId?._id) {
            const shopUser = await ShopUser.findOne({
                assignedShops: b.shopId._id,
                isActive: true
            }).lean() as any;

            if (shopUser) {
                customerName = shopUser.fullName || shopUser.username || '';
                customerPhone = shopUser.phone || '';
                customerEmail = shopUser.email || '';
            }
        }

        const settings = await getSettings();
        const s = settings as any;

        // Company Details from Settings
        const company = {
            name: s.companyName || 'Your Company Name',
            address: s.companyAddress || '',
            city: s.companyCity || '',
            gst: s.companyGst || '',
            phone: s.companyPhone || '',
            email: s.companyEmail || ''
        };

        // Bank Details
        const bank = {
            name: s.bankName || '',
            account: s.bankAccount || '',
            ifsc: s.bankIfsc || '',
            branch: s.bankBranch || ''
        };

        // GST and Commission from settings
        const gstRate = s.gstRate || 0;
        const commissionType = s.commissionType || 'percentage';
        const commissionValue = s.commissionValue || 0;

        // PDF Logo and Template
        const pdfLogo = s.pdfLogo || '';
        const pdfTemplate = s.pdfTemplate || 'tax_invoice';
        const upiId = s.upiId || '';

        const billDate = new Date(b.billDate || b.createdAt).toLocaleDateString('en-IN');
        const dueDate = new Date(b.dueDate).toLocaleDateString('en-IN');
        const invoiceNo = `INV-${b.billNumber?.replace('BILL-', '') || '000001'}`;

        // Calculate commission first
        const baseRent = b.rentAmount || 0;
        let commissionAmount = 0;
        if (commissionValue > 0) {
            commissionAmount = commissionType === 'percentage' ? (baseRent * commissionValue) / 100 : commissionValue;
        }

        // Add commission to rent - show combined rent amount
        const rentWithCommission = baseRent + commissionAmount;

        // Only show charges with amount > 0 (rent now includes commission)
        const allCharges = [
            { label: 'Rent', amount: rentWithCommission },
            { label: 'Maintenance Charge', amount: b.maintenanceCharge || 0 },
            { label: 'Electricity Charge', amount: b.electricityCharge || 0 },
            { label: 'Water Charge', amount: b.waterCharge || 0 },
            { label: 'Other Charges', amount: b.otherCharges || 0 }
        ];
        const charges = allCharges.filter(c => c.amount > 0);
        const subtotal = charges.reduce((sum, c) => sum + c.amount, 0);

        // GST Calculation on subtotal (which now includes commission)
        let cgst = 0, sgst = 0;
        if (gstRate > 0) {
            cgst = (subtotal * (gstRate / 2)) / 100;
            sgst = (subtotal * (gstRate / 2)) / 100;
        }

        const discount = b.discount || 0;
        // Commission is already included in subtotal (in Rent), so just add GST
        const finalTotal = subtotal + cgst + sgst - discount;
        const balanceDue = finalTotal - (b.paidAmount || 0);

        // Create PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4

        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const { width, height } = page.getSize();

        // Embed logo if available
        let logoImage: any = null;
        let logoWidth = 0;
        if (pdfLogo && pdfLogo.startsWith('data:image')) {
            try {
                if (pdfLogo.includes('data:image/png')) {
                    const base64Data = pdfLogo.split(',')[1];
                    const imageBytes = Buffer.from(base64Data, 'base64');
                    logoImage = await pdfDoc.embedPng(imageBytes);
                } else if (pdfLogo.includes('data:image/jpeg') || pdfLogo.includes('data:image/jpg')) {
                    const base64Data = pdfLogo.split(',')[1];
                    const imageBytes = Buffer.from(base64Data, 'base64');
                    logoImage = await pdfDoc.embedJpg(imageBytes);
                }
            } catch (e) {
                console.error('Logo embed error:', e);
            }
        }

        // Generate PDF based on template
        if (pdfTemplate === 'modern') {
            // MODERN TEMPLATE - Gradient style with colors
            let y = height - 50;

            // Header gradient bar (simulated with color)
            page.drawRectangle({ x: 0, y: height - 100, width: width, height: 100, color: rgb(0.4, 0.2, 0.6) });

            // Logo and Company
            if (logoImage) {
                const lh = 40;
                logoWidth = lh * (logoImage.width / logoImage.height);
                page.drawImage(logoImage, { x: 50, y: height - 70, width: logoWidth, height: lh });
            }
            const tx = logoWidth > 0 ? 60 + logoWidth : 50;
            drawText(page, company.name, tx, height - 45, 20, helveticaBold, rgb(1, 1, 1));
            drawText(page, `${company.address} ${company.city}`.trim(), tx, height - 62, 9, helvetica, rgb(0.9, 0.9, 0.9));
            drawText(page, `${company.phone} | ${company.email}`.trim(), tx, height - 75, 9, helvetica, rgb(0.9, 0.9, 0.9));
            if (company.gst) drawText(page, `GST: ${company.gst}`, tx, height - 88, 9, helveticaBold, rgb(0.9, 0.9, 0.9));

            y = height - 130;
            drawText(page, `Invoice: ${invoiceNo}`, 50, y, 10, helveticaBold);
            drawText(page, `Date: ${billDate}`, 300, y, 10, helvetica);
            drawText(page, `Due: ${dueDate}`, 450, y, 10, helvetica);
            y -= 25;

            // Customer Box
            page.drawRectangle({ x: 50, y: y - 50, width: 250, height: 55, color: rgb(0.95, 0.95, 0.98), borderColor: rgb(0.4, 0.2, 0.6), borderWidth: 1 });
            drawText(page, 'Bill To:', 60, y - 8, 9, helveticaBold, rgb(0.4, 0.2, 0.6));
            drawText(page, customerName || 'Customer', 60, y - 22, 11, helveticaBold);
            if (customerPhone) drawText(page, customerPhone, 60, y - 35, 9, helvetica, rgb(0.4, 0.4, 0.4));
            if (customerEmail) drawText(page, customerEmail, 60, y - 47, 9, helvetica, rgb(0.4, 0.4, 0.4));

            // Shop info
            drawText(page, `Shop: ${b.shopId?.shopNumber || 'N/A'}`, 350, y - 10, 10, helvetica);
            drawText(page, `Period: ${b.billMonth} ${b.billYear}`, 350, y - 25, 10, helvetica);
            y -= 70;

            // Charges Table
            page.drawRectangle({ x: 50, y: y - 5, width: 495, height: 22, color: rgb(0.4, 0.2, 0.6) });
            drawText(page, 'Description', 60, y + 3, 10, helveticaBold, rgb(1, 1, 1));
            drawText(page, 'Amount (Rs)', 460, y + 3, 10, helveticaBold, rgb(1, 1, 1));
            y -= 25;

            charges.forEach((c, i) => {
                if (i % 2 === 0) page.drawRectangle({ x: 50, y: y - 4, width: 495, height: 18, color: rgb(0.97, 0.95, 1) });
                drawText(page, c.label, 60, y, 9, helvetica);
                drawText(page, `Rs ${c.amount.toLocaleString('en-IN')}`, 450, y, 9, helvetica);
                y -= 18;
            });

            if (gstRate > 0) {
                drawText(page, `CGST (${gstRate / 2}%)`, 60, y, 9, helvetica, rgb(0.5, 0.5, 0.5));
                drawText(page, `Rs ${cgst.toFixed(2)}`, 450, y, 9, helvetica, rgb(0.5, 0.5, 0.5));
                y -= 18;
                drawText(page, `SGST (${gstRate / 2}%)`, 60, y, 9, helvetica, rgb(0.5, 0.5, 0.5));
                drawText(page, `Rs ${sgst.toFixed(2)}`, 450, y, 9, helvetica, rgb(0.5, 0.5, 0.5));
                y -= 18;
            }
            if (commissionAmount > 0) {
                const label = commissionType === 'percentage' ? `Service Charge (${commissionValue}%)` : 'Service Charge';
                drawText(page, label, 60, y, 9, helvetica, rgb(0.5, 0.5, 0.5));
                drawText(page, `Rs ${commissionAmount.toFixed(2)}`, 450, y, 9, helvetica, rgb(0.5, 0.5, 0.5));
                y -= 18;
            }
            if (discount > 0) {
                drawText(page, 'Discount', 60, y, 9, helvetica, rgb(0.1, 0.6, 0.2));
                drawText(page, `-Rs ${discount}`, 450, y, 9, helvetica, rgb(0.1, 0.6, 0.2));
                y -= 18;
            }

            y -= 5;
            // Total bar
            page.drawRectangle({ x: 50, y: y - 5, width: 495, height: 25, color: rgb(0.4, 0.2, 0.6) });
            drawText(page, 'Total Amount', 60, y + 2, 12, helveticaBold, rgb(1, 1, 1));
            drawText(page, `Rs ${finalTotal.toFixed(2)}`, 430, y + 2, 12, helveticaBold, rgb(1, 1, 1));
            y -= 35;

            drawText(page, 'Amount Paid', 60, y, 10, helvetica);
            drawText(page, `Rs ${(b.paidAmount || 0).toLocaleString('en-IN')}`, 450, y, 10, helveticaBold, rgb(0.1, 0.6, 0.2));
            y -= 20;
            drawText(page, 'Balance Due', 60, y, 12, helveticaBold, rgb(0.8, 0.1, 0.1));
            drawText(page, `Rs ${balanceDue.toFixed(2)}`, 430, y, 12, helveticaBold, rgb(0.8, 0.1, 0.1));
            y -= 30;

            const statusColor = b.status === 'paid' ? rgb(0.1, 0.6, 0.2) : rgb(0.9, 0.6, 0.1);
            drawText(page, `Status: ${(b.status || 'pending').toUpperCase()}`, 240, y, 13, helveticaBold, statusColor);

            // Footer gradient
            page.drawRectangle({ x: 0, y: 0, width: width, height: 60, color: rgb(0.4, 0.2, 0.6) });
            if (bank.name) {
                drawText(page, `Bank: ${bank.name} | A/C: ${bank.account} | IFSC: ${bank.ifsc}`, 50, 35, 9, helvetica, rgb(1, 1, 1));
            }
            drawText(page, 'Thank you for your business!', 220, 18, 10, helveticaBold, rgb(1, 1, 1));

        } else if (pdfTemplate === 'classic') {
            // CLASSIC TEMPLATE - Traditional bordered style
            let y = height - 50;

            // Border
            page.drawRectangle({ x: 40, y: 40, width: width - 80, height: height - 80, borderColor: rgb(0, 0, 0), borderWidth: 2 });
            page.drawRectangle({ x: 45, y: 45, width: width - 90, height: height - 90, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 });

            // Header centered
            if (logoImage) {
                const lh = 40;
                logoWidth = lh * (logoImage.width / logoImage.height);
                page.drawImage(logoImage, { x: (width - logoWidth) / 2, y: y - 35, width: logoWidth, height: lh });
                y -= 50;
            }
            const nameWidth = helveticaBold.widthOfTextAtSize(company.name, 18);
            drawText(page, company.name, (width - nameWidth) / 2, y, 18, helveticaBold);
            y -= 15;
            if (company.address) {
                const addrWidth = helvetica.widthOfTextAtSize(`${company.address}, ${company.city}`, 10);
                drawText(page, `${company.address}, ${company.city}`, (width - addrWidth) / 2, y, 10, helvetica, rgb(0.4, 0.4, 0.4));
                y -= 12;
            }
            if (company.gst) {
                const gstWidth = helveticaBold.widthOfTextAtSize(`GST: ${company.gst}`, 10);
                drawText(page, `GST: ${company.gst}`, (width - gstWidth) / 2, y, 10, helveticaBold, rgb(0.3, 0.3, 0.3));
                y -= 12;
            }
            y -= 10;

            // Title
            page.drawLine({ start: { x: 50, y: y }, end: { x: 545, y: y }, thickness: 1, color: rgb(0, 0, 0) });
            y -= 25;
            const titleWidth = helveticaBold.widthOfTextAtSize('INVOICE', 16);
            drawText(page, 'INVOICE', (width - titleWidth) / 2, y, 16, helveticaBold);
            y -= 25;
            page.drawLine({ start: { x: 50, y: y }, end: { x: 545, y: y }, thickness: 1, color: rgb(0, 0, 0) });
            y -= 25;

            // Details in columns
            drawText(page, `Invoice No: ${invoiceNo}`, 60, y, 10, helvetica);
            drawText(page, `Shop No: ${b.shopId?.shopNumber || 'N/A'}`, 350, y, 10, helvetica);
            y -= 15;
            drawText(page, `Date: ${billDate}`, 60, y, 10, helvetica);
            drawText(page, `Period: ${b.billMonth} ${b.billYear}`, 350, y, 10, helvetica);
            y -= 15;
            drawText(page, `Due Date: ${dueDate}`, 60, y, 10, helvetica);
            drawText(page, `Customer: ${customerName || 'N/A'}`, 350, y, 10, helvetica);
            y -= 30;

            // Table
            page.drawLine({ start: { x: 60, y: y }, end: { x: 535, y: y }, thickness: 1, color: rgb(0, 0, 0) });
            y -= 18;
            drawText(page, 'Particulars', 70, y, 10, helveticaBold);
            drawText(page, 'Amount (Rs)', 450, y, 10, helveticaBold);
            y -= 12;
            page.drawLine({ start: { x: 60, y: y }, end: { x: 535, y: y }, thickness: 1, color: rgb(0, 0, 0) });
            y -= 20;

            charges.forEach(c => {
                drawText(page, c.label, 70, y, 10, helvetica);
                drawText(page, c.amount.toLocaleString('en-IN'), 460, y, 10, helvetica);
                y -= 18;
            });
            if (gstRate > 0) {
                drawText(page, `CGST (${gstRate / 2}%)`, 70, y, 10, helvetica);
                drawText(page, cgst.toFixed(2), 460, y, 10, helvetica);
                y -= 18;
                drawText(page, `SGST (${gstRate / 2}%)`, 70, y, 10, helvetica);
                drawText(page, sgst.toFixed(2), 460, y, 10, helvetica);
                y -= 18;
            }
            if (commissionAmount > 0) {
                drawText(page, 'Service Charge', 70, y, 10, helvetica);
                drawText(page, commissionAmount.toFixed(2), 460, y, 10, helvetica);
                y -= 18;
            }
            if (discount > 0) {
                drawText(page, 'Less: Discount', 70, y, 10, helvetica);
                drawText(page, `-${discount}`, 460, y, 10, helvetica);
                y -= 18;
            }

            page.drawLine({ start: { x: 60, y: y }, end: { x: 535, y: y }, thickness: 1, color: rgb(0, 0, 0) });
            y -= 20;
            drawText(page, 'TOTAL', 70, y, 11, helveticaBold);
            drawText(page, `Rs ${finalTotal.toFixed(2)}`, 440, y, 11, helveticaBold);
            y -= 18;
            drawText(page, 'Paid', 70, y, 10, helvetica);
            drawText(page, `Rs ${(b.paidAmount || 0).toLocaleString('en-IN')}`, 450, y, 10, helvetica);
            y -= 18;
            drawText(page, 'Balance Due', 70, y, 11, helveticaBold, rgb(0.8, 0, 0));
            drawText(page, `Rs ${balanceDue.toFixed(2)}`, 440, y, 11, helveticaBold, rgb(0.8, 0, 0));
            y -= 30;

            const statusColor = b.status === 'paid' ? rgb(0.1, 0.6, 0.2) : rgb(0.9, 0.5, 0);
            const statusText = `Status: ${(b.status || 'pending').toUpperCase()}`;
            const stWidth = helveticaBold.widthOfTextAtSize(statusText, 12);
            drawText(page, statusText, (width - stWidth) / 2, y, 12, helveticaBold, statusColor);

            // Bank details at bottom
            if (bank.name) {
                drawText(page, `Bank: ${bank.name} | A/C: ${bank.account} | IFSC: ${bank.ifsc} | Branch: ${bank.branch}`, 60, 70, 9, helvetica, rgb(0.4, 0.4, 0.4));
            }
            drawText(page, 'This is a computer generated invoice.', 190, 55, 8, helvetica, rgb(0.6, 0.6, 0.6));

        } else if (pdfTemplate === 'minimal') {
            // MINIMAL TEMPLATE - Clean simple style
            let y = height - 60;

            drawText(page, 'INVOICE', 50, y, 24, helveticaBold, rgb(0.2, 0.2, 0.2));
            y -= 30;

            page.drawLine({ start: { x: 50, y: y }, end: { x: 545, y: y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
            y -= 25;

            // From / To
            drawText(page, 'From', 50, y, 9, helvetica, rgb(0.6, 0.6, 0.6));
            drawText(page, 'To', 320, y, 9, helvetica, rgb(0.6, 0.6, 0.6));
            y -= 14;
            drawText(page, company.name, 50, y, 11, helveticaBold);
            drawText(page, customerName || 'Customer', 320, y, 11, helveticaBold);
            y -= 14;
            if (company.address) drawText(page, company.address, 50, y, 9, helvetica, rgb(0.5, 0.5, 0.5));
            if (customerPhone) drawText(page, customerPhone, 320, y, 9, helvetica, rgb(0.5, 0.5, 0.5));
            y -= 12;
            if (company.city) drawText(page, company.city, 50, y, 9, helvetica, rgb(0.5, 0.5, 0.5));
            if (customerEmail) drawText(page, customerEmail, 320, y, 9, helvetica, rgb(0.5, 0.5, 0.5));
            y -= 25;

            // Invoice details
            drawText(page, `Invoice: ${invoiceNo}`, 50, y, 10, helvetica);
            drawText(page, `Shop: ${b.shopId?.shopNumber || 'N/A'}`, 200, y, 10, helvetica);
            drawText(page, `Date: ${billDate}`, 350, y, 10, helvetica);
            y -= 14;
            drawText(page, `Period: ${b.billMonth} ${b.billYear}`, 50, y, 10, helvetica);
            drawText(page, `Due: ${dueDate}`, 350, y, 10, helvetica);
            y -= 25;

            page.drawLine({ start: { x: 50, y: y }, end: { x: 545, y: y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
            y -= 20;

            // Simple charges list
            charges.forEach(c => {
                drawText(page, c.label, 50, y, 10, helvetica);
                drawText(page, `Rs ${c.amount.toLocaleString('en-IN')}`, 480, y, 10, helvetica);
                y -= 18;
            });

            if (gstRate > 0) {
                drawText(page, `CGST (${gstRate / 2}%)`, 50, y, 10, helvetica, rgb(0.5, 0.5, 0.5));
                drawText(page, `Rs ${cgst.toFixed(2)}`, 480, y, 10, helvetica, rgb(0.5, 0.5, 0.5));
                y -= 18;
                drawText(page, `SGST (${gstRate / 2}%)`, 50, y, 10, helvetica, rgb(0.5, 0.5, 0.5));
                drawText(page, `Rs ${sgst.toFixed(2)}`, 480, y, 10, helvetica, rgb(0.5, 0.5, 0.5));
                y -= 18;
            }
            if (commissionAmount > 0) {
                drawText(page, 'Service Charge', 50, y, 10, helvetica, rgb(0.5, 0.5, 0.5));
                drawText(page, `Rs ${commissionAmount.toFixed(2)}`, 480, y, 10, helvetica, rgb(0.5, 0.5, 0.5));
                y -= 18;
            }
            if (discount > 0) {
                drawText(page, 'Discount', 50, y, 10, helvetica, rgb(0.2, 0.7, 0.3));
                drawText(page, `-Rs ${discount}`, 480, y, 10, helvetica, rgb(0.2, 0.7, 0.3));
                y -= 18;
            }

            y -= 10;
            page.drawLine({ start: { x: 50, y: y }, end: { x: 545, y: y }, thickness: 1, color: rgb(0.3, 0.3, 0.3) });
            y -= 20;

            drawText(page, 'Total', 50, y, 14, helveticaBold);
            drawText(page, `Rs ${finalTotal.toFixed(2)}`, 460, y, 14, helveticaBold);
            y -= 25;
            drawText(page, 'Paid', 50, y, 11, helvetica);
            drawText(page, `Rs ${(b.paidAmount || 0).toLocaleString('en-IN')}`, 475, y, 11, helvetica, rgb(0.2, 0.7, 0.3));
            y -= 20;
            drawText(page, 'Balance Due', 50, y, 12, helveticaBold);
            drawText(page, `Rs ${balanceDue.toFixed(2)}`, 460, y, 12, helveticaBold, rgb(0.8, 0.1, 0.1));
            y -= 30;

            const statusColor = b.status === 'paid' ? rgb(0.2, 0.7, 0.3) : rgb(0.9, 0.6, 0.1);
            drawText(page, `${(b.status || 'pending').toUpperCase()}`, 50, y, 11, helveticaBold, statusColor);

            // Footer
            drawText(page, 'Thank you', 50, 60, 10, helvetica, rgb(0.5, 0.5, 0.5));
            if (bank.name) {
                drawText(page, `Bank: ${bank.name} | A/C: ${bank.account} | IFSC: ${bank.ifsc}`, 50, 45, 8, helvetica, rgb(0.6, 0.6, 0.6));
            }

        } else {
            // TAX INVOICE TEMPLATE (default) - Bordered table style like reference
            let y = height - 30;

            // Outer border
            page.drawRectangle({ x: 30, y: 30, width: width - 60, height: height - 60, borderColor: rgb(0, 0, 0), borderWidth: 1 });

            // TAX INVOICE Header
            page.drawRectangle({ x: 30, y: height - 50, width: width - 60, height: 20, borderColor: rgb(0, 0, 0), borderWidth: 1 });
            const titleWidth = helveticaBold.widthOfTextAtSize('TAX INVOICE', 12);
            drawText(page, 'TAX INVOICE', (width - titleWidth) / 2, height - 44, 12, helveticaBold);
            y = height - 55;

            // Company Section (left) + SOLD TO PARTY (right)
            page.drawRectangle({ x: 30, y: y - 100, width: (width - 60) / 2, height: 100, borderColor: rgb(0, 0, 0), borderWidth: 1 });
            page.drawRectangle({ x: 30 + (width - 60) / 2, y: y - 100, width: (width - 60) / 2, height: 100, borderColor: rgb(0, 0, 0), borderWidth: 1 });

            // Logo
            let logoY = y - 15;
            if (logoImage) {
                const lh = 50;
                logoWidth = lh * (logoImage.width / logoImage.height);
                page.drawImage(logoImage, { x: 45, y: y - 65, width: Math.min(logoWidth, 80), height: lh });
            }

            // Company info (right of logo or centered)
            const compX = logoImage ? 130 : 45;
            drawText(page, company.name, compX, y - 20, 10, helveticaBold);
            if (company.address) drawText(page, `ADDRESS: ${company.address}`, compX, y - 35, 8, helvetica);
            if (company.city) drawText(page, company.city, compX, y - 47, 8, helvetica);
            if (company.gst) drawText(page, `GST: ${company.gst}`, compX, y - 60, 8, helveticaBold);
            if (company.phone) drawText(page, `Phone: ${company.phone}`, compX, y - 72, 8, helvetica);

            // SOLD TO PARTY header
            const rightX = 30 + (width - 60) / 2 + 10;
            drawText(page, 'SOLD TO PARTY', rightX + 80, y - 5, 9, helveticaBold);
            drawText(page, customerName || 'Customer Name', rightX, y - 25, 10, helveticaBold);
            if (customerPhone) drawText(page, `Phone: ${customerPhone}`, rightX, y - 40, 9, helvetica);
            if (customerEmail) drawText(page, `Email: ${customerEmail}`, rightX, y - 53, 9, helvetica);

            y -= 105;

            // Invoice Details Row
            page.drawRectangle({ x: 30, y: y - 25, width: (width - 60) / 2, height: 25, borderColor: rgb(0, 0, 0), borderWidth: 1 });
            page.drawRectangle({ x: 30 + (width - 60) / 2, y: y - 25, width: (width - 60) / 2, height: 25, borderColor: rgb(0, 0, 0), borderWidth: 1 });
            drawText(page, `Shop No.: ${b.shopId?.shopNumber || 'N/A'}`, 45, y - 17, 10, helvetica);
            drawText(page, `INVOICE NO: ${invoiceNo}`, rightX, y - 10, 9, helvetica);
            drawText(page, `Date: ${billDate}`, rightX + 140, y - 10, 9, helvetica);
            y -= 30;

            // Billing Period Row (3 columns)
            const col3Width = (width - 60) / 3;
            page.drawRectangle({ x: 30, y: y - 25, width: col3Width, height: 25, borderColor: rgb(0, 0, 0), borderWidth: 1 });
            page.drawRectangle({ x: 30 + col3Width, y: y - 25, width: col3Width, height: 25, borderColor: rgb(0, 0, 0), borderWidth: 1 });
            page.drawRectangle({ x: 30 + col3Width * 2, y: y - 25, width: col3Width, height: 25, borderColor: rgb(0, 0, 0), borderWidth: 1 });
            drawText(page, `Period: ${b.billMonth} ${b.billYear}`, 45, y - 17, 9, helvetica);
            drawText(page, `Billing Date: ${billDate}`, 45 + col3Width, y - 17, 9, helvetica);
            drawText(page, `Due Date: ${dueDate}`, 45 + col3Width * 2, y - 17, 9, helvetica);
            y -= 30;

            // GST No Row
            if (company.gst) {
                page.drawRectangle({ x: 30, y: y - 20, width: width - 60, height: 20, borderColor: rgb(0, 0, 0), borderWidth: 1 });
                drawText(page, `GST NO: ${company.gst}`, 45, y - 14, 9, helveticaBold);
                y -= 25;
            }

            // Charges Table
            page.drawRectangle({ x: 30, y: y - 20, width: (width - 60) * 0.6, height: 20, borderColor: rgb(0, 0, 0), borderWidth: 1 });
            page.drawRectangle({ x: 30 + (width - 60) * 0.6, y: y - 20, width: (width - 60) * 0.2, height: 20, borderColor: rgb(0, 0, 0), borderWidth: 1 });
            page.drawRectangle({ x: 30 + (width - 60) * 0.8, y: y - 20, width: (width - 60) * 0.2, height: 20, borderColor: rgb(0, 0, 0), borderWidth: 1 });
            drawText(page, 'Description', 45, y - 14, 9, helveticaBold);
            drawText(page, 'Rate', 30 + (width - 60) * 0.65, y - 14, 9, helveticaBold);
            drawText(page, 'Amount', 30 + (width - 60) * 0.85, y - 14, 9, helveticaBold);
            y -= 25;

            // Charge rows
            charges.forEach(c => {
                page.drawRectangle({ x: 30, y: y - 20, width: (width - 60) * 0.6, height: 20, borderColor: rgb(0, 0, 0), borderWidth: 1 });
                page.drawRectangle({ x: 30 + (width - 60) * 0.6, y: y - 20, width: (width - 60) * 0.2, height: 20, borderColor: rgb(0, 0, 0), borderWidth: 1 });
                page.drawRectangle({ x: 30 + (width - 60) * 0.8, y: y - 20, width: (width - 60) * 0.2, height: 20, borderColor: rgb(0, 0, 0), borderWidth: 1 });
                drawText(page, c.label, 45, y - 14, 9, helvetica);
                drawText(page, c.amount.toFixed(2), 30 + (width - 60) * 0.85, y - 14, 9, helvetica);
                y -= 20;
            });

            // GST rows
            if (gstRate > 0) {
                page.drawRectangle({ x: 30, y: y - 20, width: (width - 60) * 0.6, height: 20, borderColor: rgb(0, 0, 0), borderWidth: 1 });
                page.drawRectangle({ x: 30 + (width - 60) * 0.6, y: y - 20, width: (width - 60) * 0.2, height: 20, borderColor: rgb(0, 0, 0), borderWidth: 1 });
                page.drawRectangle({ x: 30 + (width - 60) * 0.8, y: y - 20, width: (width - 60) * 0.2, height: 20, borderColor: rgb(0, 0, 0), borderWidth: 1 });
                drawText(page, `CGST`, 45, y - 14, 9, helvetica);
                drawText(page, `${gstRate / 2}%`, 30 + (width - 60) * 0.65, y - 14, 9, helvetica);
                drawText(page, cgst.toFixed(2), 30 + (width - 60) * 0.85, y - 14, 9, helvetica);
                y -= 20;

                page.drawRectangle({ x: 30, y: y - 20, width: (width - 60) * 0.6, height: 20, borderColor: rgb(0, 0, 0), borderWidth: 1 });
                page.drawRectangle({ x: 30 + (width - 60) * 0.6, y: y - 20, width: (width - 60) * 0.2, height: 20, borderColor: rgb(0, 0, 0), borderWidth: 1 });
                page.drawRectangle({ x: 30 + (width - 60) * 0.8, y: y - 20, width: (width - 60) * 0.2, height: 20, borderColor: rgb(0, 0, 0), borderWidth: 1 });
                drawText(page, `SGST`, 45, y - 14, 9, helvetica);
                drawText(page, `${gstRate / 2}%`, 30 + (width - 60) * 0.65, y - 14, 9, helvetica);
                drawText(page, sgst.toFixed(2), 30 + (width - 60) * 0.85, y - 14, 9, helvetica);
                y -= 20;
            }

            // Total Row
            page.drawRectangle({ x: 30, y: y - 25, width: width - 60, height: 25, borderColor: rgb(0, 0, 0), borderWidth: 2 });
            drawText(page, 'To be pay in INR:', 45, y - 18, 11, helveticaBold);
            drawText(page, `Rs ${finalTotal.toFixed(2)}`, 30 + (width - 60) * 0.75, y - 18, 12, helveticaBold);
            y -= 35;

            // Paid and Balance
            if (b.paidAmount > 0) {
                drawText(page, `Amount Paid: Rs ${(b.paidAmount || 0).toLocaleString('en-IN')}`, 45, y, 10, helvetica, rgb(0.1, 0.6, 0.2));
                y -= 15;
            }
            if (balanceDue > 0) {
                drawText(page, `Balance Due: Rs ${balanceDue.toFixed(2)}`, 45, y, 11, helveticaBold, rgb(0.8, 0.1, 0.1));
                y -= 20;
            }

            // Status
            const statusColor = b.status === 'paid' ? rgb(0.1, 0.6, 0.2) : rgb(0.8, 0.5, 0);
            drawText(page, `Status: ${(b.status || 'pending').toUpperCase()}`, 45, y, 10, helveticaBold, statusColor);
            y -= 30;

            // Payment Details Box
            if (bank.name) {
                page.drawRectangle({ x: 30, y: y - 80, width: (width - 60) * 0.6, height: 80, borderColor: rgb(0, 0, 0), borderWidth: 1 });
                drawText(page, 'PAYMENT DETAILS', 45, y - 12, 10, helveticaBold);
                drawText(page, `BANK NAME:-        ${bank.name}`, 45, y - 28, 9, helvetica);
                drawText(page, `ACCOUNT NUMBER     ${bank.account}`, 45, y - 42, 9, helvetica);
                drawText(page, `IFSC CODE          ${bank.ifsc}`, 45, y - 56, 9, helvetica);
                drawText(page, `BRANCH NAME        ${bank.branch}`, 45, y - 70, 9, helvetica);

                // Scan and Pay with UPI QR Code
                page.drawRectangle({ x: 30 + (width - 60) * 0.6, y: y - 90, width: (width - 60) * 0.4, height: 90, borderColor: rgb(0, 0, 0), borderWidth: 1 });
                drawText(page, 'Scan and Pay', 30 + (width - 60) * 0.68, y - 12, 10, helveticaBold);

                // Generate UPI QR Code if UPI ID is available
                if (upiId) {
                    try {
                        const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(company.name)}&am=${finalTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Bill Payment ' + invoiceNo)}`;
                        const qrDataUrl = await QRCode.toDataURL(upiUrl, {
                            width: 200,
                            margin: 1,
                            errorCorrectionLevel: 'H'
                        });
                        const qrBase64 = qrDataUrl.split(',')[1];
                        const qrBytes = Buffer.from(qrBase64, 'base64');
                        const qrImage = await pdfDoc.embedPng(qrBytes);
                        page.drawImage(qrImage, { x: 30 + (width - 60) * 0.66, y: y - 87, width: 70, height: 70 });
                    } catch (qrError) {
                        // Fallback: show UPI ID text if QR fails
                        console.error('QR Error:', qrError);
                        drawText(page, `UPI: ${upiId}`, 30 + (width - 60) * 0.63, y - 50, 8, helvetica);
                    }
                } else {
                    // No UPI ID - show placeholder
                    page.drawRectangle({ x: 30 + (width - 60) * 0.66, y: y - 85, width: 70, height: 70, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 });
                    drawText(page, 'No UPI', 30 + (width - 60) * 0.71, y - 55, 9, helvetica, rgb(0.5, 0.5, 0.5));
                }
            }

            // Footer
            page.drawRectangle({ x: 30, y: 30, width: width - 60, height: 20, borderColor: rgb(0, 0, 0), borderWidth: 1 });
            const footerText = 'THIS IS A COMPUTER GENERATED INVOICE';
            const footerWidth = helvetica.widthOfTextAtSize(footerText, 9);
            drawText(page, footerText, (width - footerWidth) / 2, 37, 9, helvetica);
        }

        // Save PDF
        const pdfBytes = await pdfDoc.save();
        const pdfBuffer = Buffer.from(pdfBytes);

        const fileName = `Invoice-${invoiceNo}.pdf`;
        const disposition = isDownload ? 'attachment' : 'inline';

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `${disposition}; filename="${fileName}"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error('PDF generation error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF', details: error.message }, { status: 500 });
    }
}
