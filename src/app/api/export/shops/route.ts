import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Shop, Floor, Building, ShopUser } from '@/models';
import * as XLSX from 'xlsx';

export async function GET() {
    try {
        await dbConnect();

        // Fetch all shops with populated data
        const shops = await Shop.find({ isActive: { $ne: false } })
            .populate('floorId', 'name floorNumber')
            .populate('buildingId', 'name')
            .sort({ shopNumber: 1 })
            .lean();

        // Get shop users for assigned user info
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
        const data = shops.map((shop: any) => {
            const assignedUser = shop._id ? shopUserMap[shop._id.toString()] : null;

            return {
                'Shop Number': shop.shopNumber || '',
                'Shop Name': shop.name || '',
                'Building': shop.buildingId?.name || '',
                'Floor': shop.floorId?.name || `Floor ${shop.floorId?.floorNumber || ''}`,
                'Area': shop.area || 0,
                'Area Unit': shop.areaUnit || 'sqft',
                'Rent Amount': shop.rentAmount || 0,
                'Maintenance Charge': shop.maintenanceCharge || 0,
                'Electricity Charge': shop.electricityCharge || 0,
                'Water Charge': shop.waterCharge || 0,
                'Other Charges': shop.otherCharges || 0,
                'Is Occupied': shop.isOccupied ? 'Yes' : 'No',
                'Assigned User': assignedUser?.fullName || assignedUser?.username || '',
                'User Phone': assignedUser?.phone || '',
                'User Email': assignedUser?.email || '',
                'Description': shop.description || ''
            };
        });

        // Create workbook
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Auto-width columns
        const colWidths = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 12) }));
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Shops List');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=shops_list_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        });
    } catch (error: any) {
        console.error('Export shops error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
