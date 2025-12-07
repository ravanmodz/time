import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Payment, Bill, Shop, ShopUser } from '@/models';
import * as XLSX from 'xlsx';

export async function GET() {
    try {
        await dbConnect();

        // Fetch all payments with populated bill data
        const payments = await Payment.find({})
            .populate({
                path: 'billId',
                populate: [
                    { path: 'shopId', select: 'shopNumber name' }
                ]
            })
            .sort({ paymentDate: -1 })
            .lean();

        // Get shop users for customer names
        const shopUsers = await ShopUser.find({ isActive: true }).lean() as any[];

        // Create a map of shopId to user
        const shopUserMap: { [key: string]: any } = {};
        shopUsers.forEach(user => {
            if (user.assignedShops) {
                user.assignedShops.forEach((shopId: any) => {
                    shopUserMap[shopId.toString()] = user;
                });
            }
        });

        // Format data for Excel
        const data = payments.map((payment: any) => {
            const bill = payment.billId;
            const shopUser = bill?.shopId?._id ? shopUserMap[bill.shopId._id.toString()] : null;

            return {
                'Payment Date': payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN') : '',
                'Bill Number': bill?.billNumber || '',
                'Shop No': bill?.shopId?.shopNumber || '',
                'Customer Name': shopUser?.fullName || shopUser?.username || '',
                'Amount Paid': payment.amount || 0,
                'Payment Method': payment.paymentMethod || '',
                'Transaction ID': payment.transactionId || '',
                'Notes': payment.notes || '',
                'Received By': payment.receivedBy || '',
                'Created At': payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-IN') : ''
            };
        });

        // Create workbook
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Auto-width columns
        const colWidths = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 12) }));
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments Report');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=payments_report_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        });
    } catch (error: any) {
        console.error('Export payments error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
