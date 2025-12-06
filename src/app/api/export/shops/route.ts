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

        const shops = await db.collection('shops').find({}).toArray();

        // Format data for Excel
        const data = shops.map((shop: any) => ({
            'Shop Name': shop.name || '',
            'Shop Number': shop.shopNumber || '',
            'Floor': shop.floor || '',
            'Rent Charge': shop.rentCharge || 0,
            'Water Charge': shop.waterCharge || 0,
            'Electricity Charge': shop.electricityCharge || 0,
            'Service Charge': shop.serviceCharge || 0,
            'Owner Name': shop.ownerName || '',
            'Phone': shop.phone || ''
        }));

        // Create workbook
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Shops');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename=shops_list.xlsx'
            }
        });
    } catch (error: any) {
        console.error('Export shops error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
