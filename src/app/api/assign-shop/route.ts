import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

const shopUserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, lowercase: true },
    email: { type: String },
    password: { type: String },
    fullName: { type: String },
    phone: { type: String },
    assignedShops: [{ type: mongoose.Schema.Types.ObjectId }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const ShopUser = mongoose.models.ShopUser || mongoose.model('ShopUser', shopUserSchema);

async function connectDB() {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(MONGODB_URI);
}

// POST - Assign shops to user
export async function POST(request: Request) {
    try {
        await connectDB();
        const { userId, shopIds } = await request.json();

        const user = await ShopUser.findByIdAndUpdate(
            userId,
            { assignedShops: shopIds },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, user });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT - Add single shop to user
export async function PUT(request: Request) {
    try {
        await connectDB();
        const { userId, shopId, action } = await request.json();

        let update;
        if (action === 'add') {
            update = { $addToSet: { assignedShops: shopId } };
        } else if (action === 'remove') {
            update = { $pull: { assignedShops: shopId } };
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const user = await ShopUser.findByIdAndUpdate(userId, update, { new: true });

        return NextResponse.json({ success: true, user });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
