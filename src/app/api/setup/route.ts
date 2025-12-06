import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Owner } from '@/models/Owner';
import bcrypt from 'bcryptjs';

// GET /api/setup - Create default owner (for initial setup)
export async function GET() {
    try {
        await dbConnect();

        // Delete all existing owners
        await Owner.deleteMany({});

        // Create fresh owner with hashed password
        const hashedPassword = await bcrypt.hash('admin123', 12);

        const owner = await Owner.create({
            username: 'admin',
            email: 'admin@example.com',
            password: hashedPassword,
            fullName: 'Owner',
            isActive: true
        });

        return NextResponse.json({
            success: true,
            message: 'Owner created successfully',
            username: owner.username
        });
    } catch (error: any) {
        console.error('Setup error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
