import mongoose, { Schema, models, model } from 'mongoose';

export interface IAdmin {
    _id: string;
    username: string;
    email: string;
    password: string;
    role: 'admin';
    fullName: string;
    phone?: string;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['admin'], default: 'admin' },
    fullName: { type: String, required: true },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date }
}, { timestamps: true });

// Remove the pre-save hook since we handle password hashing in the auth.ts
export const Admin = models.Admin || model<IAdmin>('Admin', AdminSchema);
