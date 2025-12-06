import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ActivityLog } from '@/models/ActivityLog';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET activity logs (owner only)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Only owner can view activity logs
        if (!session || (session.user as any).role !== 'owner') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const actionType = searchParams.get('actionType');

        const query: any = {};
        if (actionType) query.actionType = actionType;

        const logs = await ActivityLog.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return NextResponse.json(logs);
    } catch (error) {
        console.error('GET activity logs error:', error);
        return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
    }
}

// POST - Create activity log (internal use)
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();

        const log = await ActivityLog.create(data);
        return NextResponse.json(log, { status: 201 });
    } catch (error: any) {
        console.error('POST activity log error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
