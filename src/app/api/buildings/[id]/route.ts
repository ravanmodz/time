import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Building, Floor, Shop } from '@/models';

// GET single building
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const building = await Building.findById(params.id).lean();
        if (!building) {
            return NextResponse.json({ error: 'Building not found' }, { status: 404 });
        }

        const floors = await Floor.find({ buildingId: params.id, isActive: true })
            .sort({ floorNumber: 1 })
            .lean();

        const shops = await Shop.find({ buildingId: params.id, isActive: true })
            .sort({ shopNumber: 1 })
            .lean();

        return NextResponse.json({ building, floors, shops });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch building' }, { status: 500 });
    }
}

// PUT update building
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const data = await request.json();

        const building = await Building.findByIdAndUpdate(
            params.id,
            data,
            { new: true }
        );

        if (!building) {
            return NextResponse.json({ error: 'Building not found' }, { status: 404 });
        }

        return NextResponse.json(building);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE building (soft delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();

        await Building.findByIdAndUpdate(params.id, { isActive: false });
        await Floor.updateMany({ buildingId: params.id }, { isActive: false });
        await Shop.updateMany({ buildingId: params.id }, { isActive: false });

        return NextResponse.json({ message: 'Building deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete building' }, { status: 500 });
    }
}
