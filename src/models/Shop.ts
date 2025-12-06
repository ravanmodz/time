import mongoose, { Schema, models, model } from 'mongoose';

export interface IShop {
    _id: string;
    floorId: mongoose.Types.ObjectId;
    buildingId: mongoose.Types.ObjectId;
    shopNumber: string;
    name: string;
    area: number;
    areaUnit: string;
    rentAmount: number;
    maintenanceCharge: number;
    electricityCharge: number;
    waterCharge: number;
    otherCharges: number;
    description?: string;
    isOccupied: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ShopSchema = new Schema<IShop>({
    floorId: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
    buildingId: { type: Schema.Types.ObjectId, ref: 'Building', required: true },
    shopNumber: { type: String, required: true },
    name: { type: String, required: true },
    area: { type: Number, default: 0 },
    areaUnit: { type: String, enum: ['sqft', 'sqm'], default: 'sqft' },
    rentAmount: { type: Number, default: 0 },
    maintenanceCharge: { type: Number, default: 0 },
    electricityCharge: { type: Number, default: 0 },
    waterCharge: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    description: { type: String },
    isOccupied: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

ShopSchema.index({ floorId: 1, shopNumber: 1 }, { unique: true });

export const Shop = models.Shop || model<IShop>('Shop', ShopSchema);
