import mongoose, { Schema, Document } from 'mongoose';

export interface ILeave extends Document {
  userId: mongoose.Types.ObjectId;
  leaveType: 'CL' | 'SL' | 'PL' | 'EL' | 'ML' | 'LWP';
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema = new Schema<ILeave>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    leaveType: {
      type: String,
      enum: ['CL', 'SL', 'PL', 'EL', 'ML', 'LWP'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rejectionReason: String,
  },
  { timestamps: true }
);

export default mongoose.models.Leave || mongoose.model<ILeave>('Leave', LeaveSchema);

