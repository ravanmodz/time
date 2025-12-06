import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Building, Floor, Shop } from '@/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET all buildings
export async function GET() {
    try {
        await dbConnect();
        const buildings = await Building.find({ isActive: true })
            .sort({ createdAt: -1 })
            .lean();
        return NextResponse.json(buildings);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch buildings' }, { status: 500 });
    }
}

// POST create building
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const data = await request.json();

        const building = await Building.create({
            ...data,
            createdBy: session.user.id
        });

        return NextResponse.json(building, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to create building' }, { status: 500 });
    }
}
