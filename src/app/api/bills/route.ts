import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Bill, Shop, User, Payment } from '@/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET bills
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const month = searchParams.get('month');
        const year = searchParams.get('year');

        const query: any = { status: { $ne: 'cancelled' } };
        if (status) query.status = status;
        if (month) query.billMonth = month;
        if (year) query.billYear = parseInt(year);

        const bills = await Bill.find(query)
            .sort({ createdAt: -1 })
            .populate('shopId', 'shopNumber name')
            .populate('userId', 'name')
            .populate('buildingId', 'name')
            .lean();

        return NextResponse.json(bills);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
    }
}

// POST create bill
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const data = await request.json();

        // Generate bill number
        const lastBill = await Bill.findOne().sort({ createdAt: -1 });
        const billCount = lastBill ? parseInt(lastBill.billNumber.replace('BILL-', '')) + 1 : 1;
        const billNumber = `BILL-${String(billCount).padStart(6, '0')}`;

        // Get shop and user
        const shop = await Shop.findById(data.shopId);
        const user = await User.findOne({ shopId: data.shopId, isActive: true });

        // Calculate total
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

        const bill = await Bill.create({
            ...data,
            billNumber,
            buildingId: shop?.buildingId,
            userId: user?._id,
            totalAmount,
            balanceAmount: totalAmount,
            createdBy: session.user.id
        });

        return NextResponse.json(bill, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
