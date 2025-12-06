import mongoose, { Schema, models, model } from 'mongoose';

export interface IOwner {
    _id: string;
    username: string;
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const OwnerSchema = new Schema<IOwner>({
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    fullName: { type: String, required: true },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date }
}, { timestamps: true });

export const Owner = models.Owner || model<IOwner>('Owner', OwnerSchema);
