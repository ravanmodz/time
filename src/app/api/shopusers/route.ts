import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import { Shop } from '@/models/Shop';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ShopUser Schema
const shopUserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, lowercase: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: { type: String },
    assignedShops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date }
});

const ShopUser = mongoose.models.ShopUser || mongoose.model('ShopUser', shopUserSchema);

// GET - Fetch all shop users
export async function GET() {
    try {
        await dbConnect();
        // Ensure Shop model is registered before populate
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _shopModel = Shop;

        // Get ALL users - no filter on isActive
        const users = await ShopUser.find({}).populate('assignedShops').sort({ createdAt: -1 });
        return NextResponse.json(users);
    } catch (error: any) {
        console.error('GET shopusers error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create new shop user
export async function POST(request: Request) {
    try {
        console.log('POST /api/shopusers - Starting...');
        await dbConnect();
        console.log('Database connected');

        const body = await request.json();
        console.log('Request body received:', { ...body, password: '[HIDDEN]' });

        // Validate required fields
        if (!body.username || !body.password || !body.email || !body.fullName) {
            console.error('Validation failed - missing fields:', {
                hasUsername: !!body.username,
                hasPassword: !!body.password,
                hasEmail: !!body.email,
                hasFullName: !!body.fullName
            });
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Hash password
        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(body.password, 12);
        console.log('Password hashed successfully');

        const userData = {
            username: body.username.toLowerCase(),
            email: body.email,
            password: hashedPassword,
            fullName: body.fullName,
            phone: body.phone || '',
            assignedShops: [],
            isActive: true
        };

        console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });
        const user = await ShopUser.create(userData);
        console.log('User created successfully with ID:', user._id);

        // Return without password
        const userObj = user.toObject();
        delete userObj.password;

        return NextResponse.json(userObj, { status: 201 });
    } catch (error: any) {
        console.error('POST shopusers error:', error);
        console.error('Error stack:', error.stack);
        console.error('Error code:', error.code);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || 'field';
            console.error('Duplicate key error on field:', field);
            return NextResponse.json({ error: `${field} already exists` }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
    }
}

// PUT - Update shop user
export async function PUT(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { id, password, ...updateData } = body;

        // If password is being updated, hash it
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 12);
        }

        const user = await ShopUser.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
        return NextResponse.json(user);
    } catch (error: any) {
        console.error('PUT shopusers error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Delete shop user (owner and admin can delete)
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Only owner and admin can delete shopusers
        const role = (session?.user as any)?.role;
        if (!session || (role !== 'owner' && role !== 'admin')) {
            return NextResponse.json(
                { error: 'Only owner or admin can delete users' },
                { status: 403 }
            );
        }

        await dbConnect();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        await ShopUser.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('DELETE shopusers error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
