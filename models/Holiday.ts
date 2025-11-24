import mongoose, { Schema, Document } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  date: Date;
  type: 'national' | 'regional' | 'company';
  companyId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HolidaySchema = new Schema<IHoliday>(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ['national', 'regional', 'company'],
      default: 'company',
    },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
  },
  { timestamps: true }
);

export default mongoose.models.Holiday || mongoose.model<IHoliday>('Holiday', HolidaySchema);

