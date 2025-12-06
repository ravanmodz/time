import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Floor, Building, Shop } from '@/models';

// GET floors for a building
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const buildingId = searchParams.get('buildingId');

        const query: any = { isActive: true };
        if (buildingId) query.buildingId = buildingId;

        const floors = await Floor.find(query)
            .sort({ floorNumber: 1 })
            .populate('buildingId', 'name')
            .lean();

        return NextResponse.json(floors);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch floors' }, { status: 500 });
    }
}

// POST create floor
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();

        const floor = await Floor.create(data);

        // Update building floor count
        await Building.findByIdAndUpdate(data.buildingId, {
            $inc: { totalFloors: 1 }
        });

        return NextResponse.json(floor, { status: 201 });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Floor number already exists in this building' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT update floor
export async function PUT(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();
        const { id, ...updateData } = data;

        const floor = await Floor.findByIdAndUpdate(id, updateData, { new: true });
        return NextResponse.json(floor);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE floor
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        const floor = await Floor.findById(id);
        if (floor) {
            await Floor.findByIdAndUpdate(id, { isActive: false });
            await Shop.updateMany({ floorId: id }, { isActive: false });
            await Building.findByIdAndUpdate(floor.buildingId, {
                $inc: { totalFloors: -1 }
            });
        }

        return NextResponse.json({ message: 'Floor deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete floor' }, { status: 500 });
    }
}
