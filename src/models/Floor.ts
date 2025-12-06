import mongoose, { Schema, models, model } from 'mongoose';

export interface IFloor {
    _id: string;
    buildingId: mongoose.Types.ObjectId;
    floorNumber: number;
    name: string;
    description?: string;
    totalShops: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const FloorSchema = new Schema<IFloor>({
    buildingId: { type: Schema.Types.ObjectId, ref: 'Building', required: true },
    floorNumber: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String },
    totalShops: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

FloorSchema.index({ buildingId: 1, floorNumber: 1 }, { unique: true });

export const Floor = models.Floor || model<IFloor>('Floor', FloorSchema);
