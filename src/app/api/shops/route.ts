import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Shop, Floor, User, Bill } from '@/models';

// GET shops
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const buildingId = searchParams.get('buildingId');
        const floorId = searchParams.get('floorId');
        const available = searchParams.get('available');

        const query: any = { isActive: true };
        if (buildingId) query.buildingId = buildingId;
        if (floorId) query.floorId = floorId;
        if (available === 'true') query.isOccupied = false;

        const shops = await Shop.find(query)
            .sort({ shopNumber: 1 })
            .populate('buildingId', 'name')
            .populate('floorId', 'name floorNumber')
            .lean();

        return NextResponse.json(shops);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 });
    }
}

// POST create shop
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();

        const shop = await Shop.create(data);

        // Update floor shop count
        await Floor.findByIdAndUpdate(data.floorId, {
            $inc: { totalShops: 1 }
        });

        return NextResponse.json(shop, { status: 201 });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Shop number already exists on this floor' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT update shop
export async function PUT(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();
        const { id, ...updateData } = data;

        const shop = await Shop.findByIdAndUpdate(id, updateData, { new: true });
        return NextResponse.json(shop);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE shop
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        const shop = await Shop.findById(id);
        if (shop) {
            await Shop.findByIdAndUpdate(id, { isActive: false });
            await User.updateMany({ shopId: id }, { isActive: false });
            await Floor.findByIdAndUpdate(shop.floorId, {
                $inc: { totalShops: -1 }
            });
        }

        return NextResponse.json({ message: 'Shop deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete shop' }, { status: 500 });
    }
}
