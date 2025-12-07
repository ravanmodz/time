import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { BillCategory } from '@/models';

// GET all categories
export async function GET() {
    try {
        await dbConnect();
        const categories = await BillCategory.find({ isActive: true }).sort({ name: 1 }).lean();
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

// POST create category
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();
        const category = await BillCategory.create(data);
        return NextResponse.json(category, { status: 201 });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT update category
export async function PUT(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();
        const { id, ...updateData } = data;
        const category = await BillCategory.findByIdAndUpdate(id, updateData, { new: true });
        return NextResponse.json(category);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE category
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        await BillCategory.findByIdAndUpdate(id, { isActive: false });
        return NextResponse.json({ message: 'Category deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}
