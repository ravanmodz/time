import mongoose, { Schema, models, model } from 'mongoose';

export interface IActivityLog {
    _id: string;
    action: string;
    actionType: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'other';
    userId: mongoose.Types.ObjectId;
    userName: string;
    userRole: string;
    targetType?: string;
    targetId?: string;
    targetName?: string;
    details?: string;
    ipAddress?: string;
    createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
    action: { type: String, required: true },
    actionType: {
        type: String,
        enum: ['create', 'update', 'delete', 'login', 'logout', 'other'],
        required: true
    },
    userId: { type: Schema.Types.ObjectId, required: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    targetType: { type: String },
    targetId: { type: String },
    targetName: { type: String },
    details: { type: String },
    ipAddress: { type: String }
}, { timestamps: true });

// Index for faster queries
ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ userId: 1 });
ActivityLogSchema.index({ actionType: 1 });

export const ActivityLog = models.ActivityLog || model<IActivityLog>('ActivityLog', ActivityLogSchema);
