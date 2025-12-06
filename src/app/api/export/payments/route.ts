import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';

const MONGODB_URI = process.env.MONGODB_URI!;

async function connectDB() {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(MONGODB_URI);
}

export async function GET() {
    try {
        await connectDB();
        const db = mongoose.connection.db;

        const payments = await db.collection('payments').find({}).toArray();

        // Format data for Excel
        const data = payments.map((payment: any) => ({
            'Payment ID': payment._id?.toString() || '',
            'Amount': payment.amount || 0,
            'Method': payment.paymentMethod || '',
            'Transaction ID': payment.transactionId || '',
            'Created At': payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : ''
        }));

        // Create workbook
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename=payments_report.xlsx'
            }
        });
    } catch (error: any) {
        console.error('Export payments error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
