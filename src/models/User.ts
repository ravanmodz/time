import mongoose, { Schema, models, model } from 'mongoose';

export interface IUser {
    _id: string;
    shopId: mongoose.Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    address?: string;
    idType?: string;
    idNumber?: string;
    businessName?: string;
    businessType?: string;
    gstNumber?: string;
    startDate?: Date;
    notes?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    idType: { type: String, enum: ['aadhar', 'pan', 'passport', 'other'] },
    idNumber: { type: String },
    businessName: { type: String },
    businessType: { type: String },
    gstNumber: { type: String },
    startDate: { type: Date },
    notes: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const User = models.User || model<IUser>('User', UserSchema);
