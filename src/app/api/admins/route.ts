import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Admin } from '@/models/Admin';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';

// GET admins
export async function GET() {
    try {
        await dbConnect();
        // Get ALL admins - no filter on isActive
        const admins = await Admin.find({})
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();
        return NextResponse.json(admins);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
    }
}

// POST create admin
export async function POST(request: NextRequest) {
    try {
        console.log('POST /api/admins - Starting...');
        const session = await getServerSession(authOptions);
        console.log('Session check:', { hasSession: !!session, role: (session?.user as any)?.role });

        if (!session || (session.user as any).role !== 'owner') {
            console.error('Unauthorized access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Database connecting...');
        await dbConnect();
        console.log('Database connected');

        const data = await request.json();
        console.log('Request data received:', { ...data, password: '[HIDDEN]' });

        // Hash password before saving
        if (data.password) {
            console.log('Hashing password...');
            data.password = await bcrypt.hash(data.password, 12);
            console.log('Password hashed successfully');
        }

        console.log('Creating admin...');
        const admin = await Admin.create(data);
        console.log('Admin created successfully with ID:', admin._id);

        // Log the create action
        await logActivity({
            action: `Created new admin: ${admin.fullName} (@${admin.username})`,
            actionType: 'create',
            userId: (session.user as any).id,
            userName: session.user?.name || 'Unknown',
            userRole: (session.user as any).role,
            targetType: 'Admin',
            targetId: admin._id.toString(),
            targetName: admin.fullName
        });

        const adminObj = admin.toObject();
        delete adminObj.password;

        return NextResponse.json(adminObj, { status: 201 });
    } catch (error: any) {
        console.error('POST admins error:', error);
        console.error('Error stack:', error.stack);
        console.error('Error code:', error.code);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || 'field';
            console.error('Duplicate key error on field:', field);
            return NextResponse.json({ error: `${field} already exists` }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to create admin' }, { status: 500 });
    }
}

// PUT update admin
export async function PUT(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();
        const { id, password, ...updateData } = data;

        const admin = await Admin.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
        return NextResponse.json(admin);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE admin - Only owner can delete admins
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Only owner can delete admins
        if (!session || (session.user as any).role !== 'owner') {
            return NextResponse.json(
                { error: 'Only owner can delete admin accounts' },
                { status: 403 }
            );
        }

        await dbConnect();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        // Prevent deleting yourself
        if (id === (session.user as any).id) {
            return NextResponse.json(
                { error: 'You cannot delete your own account' },
                { status: 400 }
            );
        }

        // Get admin info before deleting for logging
        const adminToDelete = await Admin.findById(id);
        if (!adminToDelete) {
            return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
        }

        await Admin.findByIdAndDelete(id);

        // Log the delete action
        await logActivity({
            action: `Deleted admin: ${adminToDelete.fullName} (@${adminToDelete.username})`,
            actionType: 'delete',
            userId: (session.user as any).id,
            userName: session.user?.name || 'Unknown',
            userRole: (session.user as any).role,
            targetType: 'Admin',
            targetId: id || undefined,
            targetName: adminToDelete.fullName
        });

        return NextResponse.json({ message: 'Admin deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
    }
}
