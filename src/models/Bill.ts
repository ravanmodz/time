import mongoose, { Schema, models, model } from 'mongoose';

export interface IBill {
    _id: string;
    billNumber: string;
    shopId: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    buildingId: mongoose.Types.ObjectId;
    billMonth: string;
    billYear: number;
    billDate: Date;
    dueDate: Date;
    category?: mongoose.Types.ObjectId;
    rentAmount: number;
    maintenanceCharge: number;
    electricityUnits: number;
    electricityCharge: number;
    waterCharge: number;
    otherCharges: number;
    lateFee: number;
    previousBalance: number;
    discount: number;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const BillSchema = new Schema<IBill>({
    billNumber: { type: String, required: true, unique: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    buildingId: { type: Schema.Types.ObjectId, ref: 'Building', required: true },
    billMonth: { type: String, required: true },
    billYear: { type: Number, required: true },
    billDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'BillCategory' },
    rentAmount: { type: Number, default: 0 },
    maintenanceCharge: { type: Number, default: 0 },
    electricityUnits: { type: Number, default: 0 },
    electricityCharge: { type: Number, default: 0 },
    waterCharge: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    lateFee: { type: Number, default: 0 },
    previousBalance: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'], default: 'pending' },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

BillSchema.pre('save', function (next) {
    this.balanceAmount = this.totalAmount - this.paidAmount;
    if (this.balanceAmount <= 0) this.status = 'paid';
    else if (this.paidAmount > 0) this.status = 'partial';
    next();
});

export const Bill = models.Bill || model<IBill>('Bill', BillSchema);
