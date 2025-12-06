import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Payment, Bill } from '@/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET payments
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const billId = searchParams.get('billId');

        const query: any = {};
        if (billId) query.billId = billId;

        const payments = await Payment.find(query)
            .sort({ paymentDate: -1 })
            .populate('billId', 'billNumber')
            .populate('shopId', 'shopNumber name')
            .lean();

        return NextResponse.json(payments);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }
}

// POST create payment
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const data = await request.json();

        // Get bill
        const bill = await Bill.findById(data.billId);
        if (!bill) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
        }

        // Generate receipt number
        const lastPayment = await Payment.findOne().sort({ createdAt: -1 });
        const paymentCount = lastPayment ? parseInt(lastPayment.receiptNumber?.replace('RCP-', '') || '0') + 1 : 1;
        const receiptNumber = `RCP-${String(paymentCount).padStart(6, '0')}`;

        // Create payment
        const payment = await Payment.create({
            ...data,
            shopId: bill.shopId,
            userId: bill.userId,
            receiptNumber,
            receivedBy: session.user.id
        });

        // Update bill
        const newPaidAmount = bill.paidAmount + data.amount;
        const newBalanceAmount = bill.totalAmount - newPaidAmount;
        const newStatus = newBalanceAmount <= 0 ? 'paid' : newPaidAmount > 0 ? 'partial' : 'pending';

        await Bill.findByIdAndUpdate(data.billId, {
            paidAmount: newPaidAmount,
            balanceAmount: newBalanceAmount,
            status: newStatus
        });

        return NextResponse.json(payment, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
