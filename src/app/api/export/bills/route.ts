import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Bill, Shop, ShopUser } from '@/models';
import * as XLSX from 'xlsx';

export async function GET() {
    try {
        await dbConnect();

        // Fetch all bills with populated data
        const bills = await Bill.find({ isActive: { $ne: false } })
            .populate('shopId', 'shopNumber name')
            .populate('buildingId', 'name')
            .sort({ createdAt: -1 })
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
        const data = bills.map((bill: any) => {
            const shopUser = bill.shopId?._id ? shopUserMap[bill.shopId._id.toString()] : null;

            return {
                'Bill Number': bill.billNumber || '',
                'Shop No': bill.shopId?.shopNumber || '',
                'Shop Name': bill.shopId?.name || '',
                'Customer Name': shopUser?.fullName || shopUser?.username || '',
                'Customer Phone': shopUser?.phone || '',
                'Customer Email': shopUser?.email || '',
                'Building': bill.buildingId?.name || '',
                'Month': bill.billMonth || '',
                'Year': bill.billYear || '',
                'Bill Date': bill.billDate ? new Date(bill.billDate).toLocaleDateString('en-IN') : '',
                'Due Date': bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN') : '',
                'Rent Amount': bill.rentAmount || 0,
                'Maintenance Charge': bill.maintenanceCharge || 0,
                'Electricity Charge': bill.electricityCharge || 0,
                'Water Charge': bill.waterCharge || 0,
                'Other Charges': bill.otherCharges || 0,
                'Discount': bill.discount || 0,
                'Total Amount': bill.totalAmount || 0,
                'Paid Amount': bill.paidAmount || 0,
                'Balance': bill.balanceAmount || 0,
                'Status': bill.status || '',
                'Created At': bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN') : ''
            };
        });

        // Create workbook
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Auto-width columns
        const colWidths = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 12) }));
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Bills Report');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=bills_report_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        });
    } catch (error: any) {
        console.error('Export bills error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
