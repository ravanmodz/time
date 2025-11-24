import mongoose, { Schema, Document } from 'mongoose';

export interface IShift extends Document {
  name: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  graceTime: number; // minutes
  halfDayHours: number; // hours
  isRotational: boolean;
  days: number[]; // [0,1,2,3,4] for Mon-Fri
  companyId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSchema = new Schema<IShift>(
  {
    name: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    graceTime: { type: Number, default: 15 }, // 15 minutes default
    halfDayHours: { type: Number, default: 4 }, // 4 hours default
    isRotational: { type: Boolean, default: false },
    days: [Number], // 0 = Sunday, 1 = Monday, etc.
    companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
  },
  { timestamps: true }
);

export default mongoose.models.Shift || mongoose.model<IShift>('Shift', ShiftSchema);

