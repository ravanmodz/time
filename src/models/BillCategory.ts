import mongoose, { Schema, models, model } from 'mongoose';

export interface IBillCategory {
    _id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BillCategorySchema = new Schema<IBillCategory>({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const BillCategory = models.BillCategory || model<IBillCategory>('BillCategory', BillCategorySchema);
