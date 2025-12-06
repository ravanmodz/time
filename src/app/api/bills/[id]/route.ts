import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Bill, Payment } from '@/models';

// GET single bill with payments
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const bill = await Bill.findById(params.id)
            .populate('shopId', 'shopNumber name')
            .populate('userId', 'name email phone')
            .populate('buildingId', 'name')
            .lean();

        if (!bill) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
        }

        const payments = await Payment.find({ billId: params.id })
            .sort({ paymentDate: -1 })
            .lean();

        return NextResponse.json({ bill, payments });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
    }
}

// PUT update bill
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const data = await request.json();

        // Recalculate total
        const totalAmount = (
            (data.rentAmount || 0) +
            (data.maintenanceCharge || 0) +
            (data.electricityCharge || 0) +
            (data.waterCharge || 0) +
            (data.otherCharges || 0) +
            (data.lateFee || 0) +
            (data.previousBalance || 0) -
            (data.discount || 0)
        );

        const bill = await Bill.findByIdAndUpdate(
            params.id,
            { ...data, totalAmount },
            { new: true }
        );

        return NextResponse.json(bill);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE bill (cancel)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        await Bill.findByIdAndUpdate(params.id, { status: 'cancelled' });
        return NextResponse.json({ message: 'Bill cancelled' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to cancel bill' }, { status: 500 });
    }
}
