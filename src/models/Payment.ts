import mongoose, { Schema, models, model } from 'mongoose';

export interface IPayment {
    _id: string;
    billId: mongoose.Types.ObjectId;
    shopId: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    amount: number;
    paymentMethod: 'cash' | 'upi' | 'cheque' | 'bank_transfer' | 'card' | 'other';
    transactionId?: string;
    chequeNumber?: string;
    chequeDate?: Date;
    bankName?: string;
    upiId?: string;
    paymentDate: Date;
    notes?: string;
    receiptNumber?: string;
    receivedBy: mongoose.Types.ObjectId;
    status: 'pending' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
    billId: { type: Schema.Types.ObjectId, ref: 'Bill', required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['cash', 'upi', 'cheque', 'bank_transfer', 'card', 'other'], required: true },
    transactionId: { type: String },
    chequeNumber: { type: String },
    chequeDate: { type: Date },
    bankName: { type: String },
    upiId: { type: String },
    paymentDate: { type: Date, default: Date.now },
    notes: { type: String },
    receiptNumber: { type: String },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' }
}, { timestamps: true });

export const Payment = models.Payment || model<IPayment>('Payment', PaymentSchema);
