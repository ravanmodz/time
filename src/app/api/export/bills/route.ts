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

        const bills = await db.collection('bills').find({}).toArray();

        // Format data for Excel
        const data = bills.map((bill: any) => ({
            'Bill Number': bill.billNumber || '',
            'Month': bill.billMonth || '',
            'Total Amount': bill.totalAmount || 0,
            'Paid Amount': bill.paidAmount || 0,
            'Balance': bill.balanceAmount || 0,
            'Status': bill.status || '',
            'Created At': bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : ''
        }));

        // Create workbook
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Bills');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename=bills_report.xlsx'
            }
        });
    } catch (error: any) {
        console.error('Export bills error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
