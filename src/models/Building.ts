import mongoose, { Schema, models, model } from 'mongoose';

export interface IBuilding {
    _id: string;
    name: string;
    address: string;
    city: string;
    totalFloors: number;
    description?: string;
    createdBy: mongoose.Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BuildingSchema = new Schema<IBuilding>({
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    totalFloors: { type: Number, default: 0 },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Building = models.Building || model<IBuilding>('Building', BuildingSchema);
