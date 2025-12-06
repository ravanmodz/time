import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User, Shop, Bill } from '@/models';

// GET users
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const shopId = searchParams.get('shopId');

        const query: any = { isActive: true };
        if (shopId) query.shopId = shopId;

        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .populate({
                path: 'shopId',
                populate: [
                    { path: 'buildingId', select: 'name' },
                    { path: 'floorId', select: 'name floorNumber' }
                ]
            })
            .lean();

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// POST create user
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();

        const user = await User.create(data);

        // Mark shop as occupied
        await Shop.findByIdAndUpdate(data.shopId, { isOccupied: true });

        return NextResponse.json(user, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT update user
export async function PUT(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();
        const { id, ...updateData } = data;

        const oldUser = await User.findById(id);
        const user = await User.findByIdAndUpdate(id, updateData, { new: true });

        // Update shop occupancy if shop changed
        if (oldUser && oldUser.shopId.toString() !== updateData.shopId) {
            await Shop.findByIdAndUpdate(oldUser.shopId, { isOccupied: false });
            await Shop.findByIdAndUpdate(updateData.shopId, { isOccupied: true });
        }

        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE user
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        const user = await User.findById(id);
        if (user) {
            await User.findByIdAndUpdate(id, { isActive: false });
            await Shop.findByIdAndUpdate(user.shopId, { isOccupied: false });
        }

        return NextResponse.json({ message: 'User deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
