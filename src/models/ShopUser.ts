import mongoose, { Schema, Document } from 'mongoose';

export interface IShopUser extends Document {
    username: string;
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    assignedShops: mongoose.Types.ObjectId[];
    isActive: boolean;
    createdAt: Date;
    lastLogin?: Date;
}

const ShopUserSchema = new Schema<IShopUser>({
    username: { type: String, required: true, unique: true, lowercase: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: { type: String },
    assignedShops: [{ type: Schema.Types.ObjectId, ref: 'Shop' }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date }
});

export const ShopUser = mongoose.models.ShopUser || mongoose.model<IShopUser>('ShopUser', ShopUserSchema);
