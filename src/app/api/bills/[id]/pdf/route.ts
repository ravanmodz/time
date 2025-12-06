import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Bill, Payment } from '@/models';
import mongoose from 'mongoose';

// Get settings from database
async function getSettings() {
    const db = mongoose.connection.db;
    const settings = await db?.collection('settings').findOne({ key: 'main' });
    return settings || {};
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();

        // Fetch bill and settings
        const [bill, settings] = await Promise.all([
            Bill.findById(params.id)
                .populate('shopId', 'shopNumber name')
                .populate('userId', 'name email phone gstNumber')
                .populate('buildingId', 'name address')
                .populate('floorId', 'name')
                .lean(),
            getSettings()
        ]);

        if (!bill) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
        }

        const payments = await Payment.find({ billId: params.id })
            .sort({ paymentDate: -1 })
            .lean();

        const b = bill as any;
        const s = settings as any;

        // Company Details from settings (with fallbacks)
        const company = {
            name: s.companyName || 'Your Company Name',
            address: s.companyAddress || '',
            city: s.companyCity || '',
            gst: s.companyGst || '',
            phone: s.companyPhone || '',
            email: s.companyEmail || ''
        };

        // Bank Details from settings
        const bank = {
            name: s.bankName || '',
            account: s.bankAccount || '',
            ifsc: s.bankIfsc || '',
            branch: s.bankBranch || ''
        };

        // UPI from settings
        const upiId = s.upiId || '';
        const pdfTemplate = s.pdfTemplate || 'tax_invoice';

        // Calculate amounts
        const electricAmount = b.electricityCharge || 0;
        const cgstRate = 9, sgstRate = 9;
        const cgst = (electricAmount * cgstRate / 100);
        const sgst = (electricAmount * sgstRate / 100);

        // Meter readings
        const lastReading = b.lastMonthReading || 0;
        const currentReading = b.currentMonthReading || lastReading;
        const consumption = b.electricityUnits || (currentReading - lastReading);
        const unitRate = b.unitRate || 25;

        // Dates
        const billDate = new Date(b.billDate || b.createdAt).toLocaleDateString('en-IN');
        const dueDate = new Date(b.dueDate).toLocaleDateString('en-IN');
        const invoiceNo = `INV-${b.billNumber?.replace('BILL-', '') || '000001'}-${new Date().getFullYear()}`;

        // QR Code (only if UPI ID is set)
        const upiAmount = b.balanceAmount || b.totalAmount || 0;
        const upiString = upiId ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(company.name)}&am=${upiAmount}&cu=INR` : '';
        const qrCodeUrl = upiId ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiString)}` : '';

        // Generate HTML based on template
        let html = '';

        if (pdfTemplate === 'tax_invoice') {
            html = generateTaxInvoiceTemplate(b, company, bank, payments, { invoiceNo, billDate, dueDate, lastReading, currentReading, consumption, unitRate, electricAmount, cgst, sgst, cgstRate, sgstRate, qrCodeUrl });
        } else if (pdfTemplate === 'modern') {
            html = generateModernTemplate(b, company, bank, payments, { invoiceNo, billDate, dueDate, qrCodeUrl });
        } else if (pdfTemplate === 'minimal') {
            html = generateMinimalTemplate(b, company, payments, { invoiceNo, billDate, dueDate });
        } else {
            html = generateClassicTemplate(b, company, bank, payments, { invoiceNo, billDate, dueDate, qrCodeUrl });
        }

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `inline; filename="Invoice-${invoiceNo}.html"`,
            },
        });
    } catch (error) {
        console.error('PDF generation error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}

// Tax Invoice Template (Original style)
function generateTaxInvoiceTemplate(b: any, company: any, bank: any, payments: any[], data: any) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Tax Invoice - ${data.invoiceNo}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; background: #fff; color: #000; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border: 1px solid #000; padding: 6px 8px; vertical-align: top; }
        .no-border { border: none !important; }
        .center { text-align: center; }
        .right { text-align: right; }
        .header-title { background: #f0f0f0; font-weight: bold; text-align: center; font-size: 14px; }
        .company-name { font-size: 18px; font-weight: bold; color: #8B0000; }
        .section-title { background: #e0e0e0; font-weight: bold; }
        .logo-text { font-size: 24px; font-weight: bold; color: #8B0000; }
        @media print { body { padding: 10px; } @page { margin: 10mm; } }
    </style>
</head>
<body>
    <table>
        <tr><td colspan="4" class="header-title">TAX INVOICE</td></tr>
        <tr>
            <td class="center" style="width: 100px;" rowspan="4">
                <div class="logo-text">${company.name.split(' ')[0] || 'LOGO'}</div>
            </td>
            <td colspan="3" class="center">
                <div class="company-name">${company.name}</div>
                ${company.address ? `<div>ADDRESS: ${company.address}</div>` : ''}
                ${company.city ? `<div>${company.city}</div>` : ''}
                ${company.gst ? `<div>GST: ${company.gst}</div>` : ''}
            </td>
        </tr>
        <tr>
            <td colspan="3" style="padding: 0;">
                <table style="width: 100%;"><tr>
                    <td style="border: none; width: 50%;"><strong>Shop No.:</strong> ${b.shopId?.shopNumber || 'N/A'}</td>
                    <td style="border: none;"><strong>INVOICE NO:</strong> ${data.invoiceNo}</td>
                </tr></table>
            </td>
        </tr>
        <tr>
            <td colspan="3" style="padding: 0;">
                <table style="width: 100%;">
                    <tr>
                        <td style="border: none;">Last Month Reading: <strong>${data.lastReading.toFixed(2)}</strong></td>
                        <td style="border: none;">Billing Date: <strong>${data.billDate}</strong></td>
                    </tr>
                    <tr>
                        <td style="border: none;">This Month Reading: <strong>${data.currentReading.toFixed(2)}</strong></td>
                        <td style="border: none;">Due Date: <strong>${data.dueDate}</strong></td>
                    </tr>
                    <tr>
                        <td style="border: none;">Consumption: <strong>${data.consumption.toFixed(2)}</strong></td>
                        <td style="border: none;">Unit Rate: <strong>${data.unitRate}</strong></td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td colspan="3" style="padding: 0;">
                <table style="width: 100%;">
                    <tr><td style="border: none;">Reading amount</td><td style="border: none; text-align: right;">${data.electricAmount.toFixed(2)}</td></tr>
                    <tr><td style="border: none;">CGST ${data.cgstRate}%</td><td style="border: none; text-align: right;">${data.cgst.toFixed(2)}</td></tr>
                    <tr><td style="border: none;">SGST ${data.sgstRate}%</td><td style="border: none; text-align: right;">${data.sgst.toFixed(2)}</td></tr>
                    <tr style="border-top: 2px solid #000;"><td style="border: none;"><strong>To be pay in INR:</strong></td><td style="border: none; text-align: right;"><strong style="border: 1px solid #000; padding: 4px 10px;">${(b.totalAmount || 0).toFixed(2)}</strong></td></tr>
                </table>
            </td>
        </tr>
    </table>
    
    ${bank.name ? `
    <table style="margin-top: 15px;">
        <tr>
            <td style="width: 60%; border: none;">
                <table><tr><td colspan="2" class="section-title">PAYMENT DETAILS</td></tr>
                <tr><td style="border: none;"><strong>BANK NAME:</strong></td><td style="border: none;">${bank.name}</td></tr>
                <tr><td style="border: none;"><strong>ACCOUNT:</strong></td><td style="border: none;">${bank.account}</td></tr>
                <tr><td style="border: none;"><strong>IFSC:</strong></td><td style="border: none;">${bank.ifsc}</td></tr>
                <tr><td style="border: none;"><strong>BRANCH:</strong></td><td style="border: none;">${bank.branch}</td></tr>
                </table>
            </td>
            ${data.qrCodeUrl ? `
            <td style="width: 40%; text-align: center; border: none;">
                <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 8px; border-radius: 5px; font-weight: bold; margin-bottom: 10px;">Scan and Pay</div>
                <img src="${data.qrCodeUrl}" alt="QR Code" style="width: 120px; height: 120px; border: 2px solid #000;" />
            </td>` : ''}
        </tr>
    </table>` : ''}
    
    <div style="margin-top: 30px; border-top: 1px solid #000; padding-top: 10px; text-align: center; font-style: italic;">THIS IS A COMPUTER GENERATED INVOICE</div>
</body>
</html>`;
}

// Modern Template (Colorful)
function generateModernTemplate(b: any, company: any, bank: any, payments: any[], data: any) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice - ${data.invoiceNo}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background: #fff; color: #333; }
        .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; border-radius: 15px; margin-bottom: 25px; }
        .header h1 { font-size: 28px; margin-bottom: 5px; }
        .invoice-no { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 10px; }
        .section { background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        .section-title { color: #667eea; font-weight: 600; margin-bottom: 15px; font-size: 16px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .info-box { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .label { color: #888; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
        .value { font-size: 16px; font-weight: 600; color: #333; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #667eea; color: white; padding: 12px; text-align: left; }
        td { padding: 12px; border-bottom: 1px solid #eee; }
        .total-row { background: #f0f4ff; font-weight: 600; }
        .amount { text-align: right; }
        .qr-section { text-align: center; padding: 20px; }
        .pay-btn { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 10px 25px; border-radius: 25px; display: inline-block; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${company.name || 'Invoice'}</h1>
        ${company.address ? `<p>${company.address}, ${company.city}</p>` : ''}
        ${company.gst ? `<p>GST: ${company.gst}</p>` : ''}
        <div class="invoice-no">${data.invoiceNo}</div>
    </div>
    
    <div class="section">
        <div class="section-title">Bill Details</div>
        <div class="grid">
            <div class="info-box">
                <div class="label">Shop</div>
                <div class="value">${b.shopId?.shopNumber || 'N/A'} - ${b.shopId?.name || ''}</div>
            </div>
            <div class="info-box">
                <div class="label">Customer</div>
                <div class="value">${b.userId?.name || 'N/A'}</div>
            </div>
            <div class="info-box">
                <div class="label">Bill Date</div>
                <div class="value">${data.billDate}</div>
            </div>
            <div class="info-box">
                <div class="label">Due Date</div>
                <div class="value">${data.dueDate}</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">Charges</div>
        <table>
            <tr><th>Description</th><th class="amount">Amount</th></tr>
            <tr><td>Rent</td><td class="amount">₹${(b.rentAmount || 0).toLocaleString('en-IN')}</td></tr>
            <tr><td>Maintenance</td><td class="amount">₹${(b.maintenanceCharge || 0).toLocaleString('en-IN')}</td></tr>
            <tr><td>Electricity</td><td class="amount">₹${(b.electricityCharge || 0).toLocaleString('en-IN')}</td></tr>
            <tr><td>Water</td><td class="amount">₹${(b.waterCharge || 0).toLocaleString('en-IN')}</td></tr>
            <tr><td>Other</td><td class="amount">₹${(b.otherCharges || 0).toLocaleString('en-IN')}</td></tr>
            ${b.discount ? `<tr><td>Discount</td><td class="amount" style="color: green;">-₹${(b.discount).toLocaleString('en-IN')}</td></tr>` : ''}
            <tr class="total-row"><td><strong>Total Amount</strong></td><td class="amount"><strong>₹${(b.totalAmount || 0).toLocaleString('en-IN')}</strong></td></tr>
            <tr><td>Paid</td><td class="amount" style="color: green;">₹${(b.paidAmount || 0).toLocaleString('en-IN')}</td></tr>
            <tr class="total-row"><td><strong>Balance Due</strong></td><td class="amount" style="color: #e53e3e;"><strong>₹${(b.balanceAmount || 0).toLocaleString('en-IN')}</strong></td></tr>
        </table>
    </div>
    
    ${data.qrCodeUrl ? `
    <div class="section qr-section">
        <div class="pay-btn">Scan to Pay</div>
        <br/>
        <img src="${data.qrCodeUrl}" alt="QR Code" style="width: 150px; height: 150px;" />
    </div>` : ''}
    
    ${bank.name ? `
    <div class="section">
        <div class="section-title">Bank Details</div>
        <p><strong>Bank:</strong> ${bank.name} | <strong>A/C:</strong> ${bank.account} | <strong>IFSC:</strong> ${bank.ifsc} | <strong>Branch:</strong> ${bank.branch}</p>
    </div>` : ''}
</body>
</html>`;
}

// Minimal Template (Simple)
function generateMinimalTemplate(b: any, company: any, payments: any[], data: any) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice - ${data.invoiceNo}</title>
    <style>
        body { font-family: Georgia, serif; padding: 40px; max-width: 600px; margin: 0 auto; color: #333; }
        h1 { font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .info { margin-bottom: 30px; }
        .info p { margin: 5px 0; }
        table { width: 100%; margin: 20px 0; }
        td { padding: 8px 0; border-bottom: 1px solid #ddd; }
        .amount { text-align: right; }
        .total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <h1>INVOICE</h1>
    <div class="info">
        <p><strong>${company.name}</strong></p>
        ${company.address ? `<p>${company.address}</p>` : ''}
        ${company.city ? `<p>${company.city}</p>` : ''}
    </div>
    <div class="info">
        <p><strong>Invoice:</strong> ${data.invoiceNo}</p>
        <p><strong>Date:</strong> ${data.billDate}</p>
        <p><strong>Due:</strong> ${data.dueDate}</p>
        <p><strong>Shop:</strong> ${b.shopId?.shopNumber || 'N/A'}</p>
        <p><strong>Customer:</strong> ${b.userId?.name || 'N/A'}</p>
    </div>
    <table>
        <tr><td>Rent</td><td class="amount">₹${(b.rentAmount || 0).toLocaleString('en-IN')}</td></tr>
        <tr><td>Maintenance</td><td class="amount">₹${(b.maintenanceCharge || 0).toLocaleString('en-IN')}</td></tr>
        <tr><td>Electricity</td><td class="amount">₹${(b.electricityCharge || 0).toLocaleString('en-IN')}</td></tr>
        <tr><td>Water</td><td class="amount">₹${(b.waterCharge || 0).toLocaleString('en-IN')}</td></tr>
        <tr><td>Other</td><td class="amount">₹${(b.otherCharges || 0).toLocaleString('en-IN')}</td></tr>
        <tr class="total"><td>TOTAL</td><td class="amount">₹${(b.totalAmount || 0).toLocaleString('en-IN')}</td></tr>
        <tr><td>Balance Due</td><td class="amount" style="color: #c00;">₹${(b.balanceAmount || 0).toLocaleString('en-IN')}</td></tr>
    </table>
    <div class="footer">Thank you for your business!</div>
</body>
</html>`;
}

// Classic Template
function generateClassicTemplate(b: any, company: any, bank: any, payments: any[], data: any) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice - ${data.invoiceNo}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
        .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #1a365d; }
        .row { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .col { flex: 1; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ccc; padding: 10px; }
        th { background: #1a365d; color: white; }
        .amount { text-align: right; }
        .total { background: #f0f4f8; font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${company.name || 'INVOICE'}</h1>
        ${company.address ? `<p>${company.address}, ${company.city}</p>` : ''}
        ${company.gst ? `<p>GST: ${company.gst}</p>` : ''}
    </div>
    
    <div class="row">
        <div class="col">
            <strong>Invoice No:</strong> ${data.invoiceNo}<br>
            <strong>Date:</strong> ${data.billDate}<br>
            <strong>Due Date:</strong> ${data.dueDate}
        </div>
        <div class="col" style="text-align: right;">
            <strong>Shop:</strong> ${b.shopId?.shopNumber || 'N/A'}<br>
            <strong>Customer:</strong> ${b.userId?.name || 'N/A'}<br>
            <strong>Phone:</strong> ${b.userId?.phone || 'N/A'}
        </div>
    </div>
    
    <table>
        <tr><th>Description</th><th class="amount">Amount (₹)</th></tr>
        <tr><td>Rent</td><td class="amount">${(b.rentAmount || 0).toLocaleString('en-IN')}</td></tr>
        <tr><td>Maintenance Charge</td><td class="amount">${(b.maintenanceCharge || 0).toLocaleString('en-IN')}</td></tr>
        <tr><td>Electricity Charge</td><td class="amount">${(b.electricityCharge || 0).toLocaleString('en-IN')}</td></tr>
        <tr><td>Water Charge</td><td class="amount">${(b.waterCharge || 0).toLocaleString('en-IN')}</td></tr>
        <tr><td>Other Charges</td><td class="amount">${(b.otherCharges || 0).toLocaleString('en-IN')}</td></tr>
        ${b.discount ? `<tr><td>Discount</td><td class="amount" style="color: green;">-${(b.discount).toLocaleString('en-IN')}</td></tr>` : ''}
        <tr class="total"><td>Total Amount</td><td class="amount">${(b.totalAmount || 0).toLocaleString('en-IN')}</td></tr>
        <tr><td>Amount Paid</td><td class="amount" style="color: green;">${(b.paidAmount || 0).toLocaleString('en-IN')}</td></tr>
        <tr class="total"><td>Balance Due</td><td class="amount" style="color: red;">${(b.balanceAmount || 0).toLocaleString('en-IN')}</td></tr>
    </table>
    
    ${bank.name ? `
    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
        <strong>Payment Details:</strong><br>
        Bank: ${bank.name} | Account: ${bank.account} | IFSC: ${bank.ifsc} | Branch: ${bank.branch}
    </div>` : ''}
    
    ${data.qrCodeUrl ? `
    <div style="text-align: center; margin-top: 20px;">
        <p><strong>Scan to Pay:</strong></p>
        <img src="${data.qrCodeUrl}" alt="QR Code" style="width: 120px; height: 120px;" />
    </div>` : ''}
    
    <div class="footer">
        <p>Thank you for your business!</p>
        <p style="font-size: 11px;">This is a computer generated invoice.</p>
    </div>
</body>
</html>`;
}
