import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  checkIn: {
    time: Date;
    location: {
      lat: number;
      lng: number;
      address: string;
    };
    photo: string;
    deviceInfo: string;
    ip: string;
  };
  checkOut?: {
    time: Date;
    location: {
      lat: number;
      lng: number;
      address: string;
    };
    photo?: string;
  };
  breaks: Array<{
    breakIn: Date;
    breakOut?: Date;
    duration?: number;
  }>;
  totalHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'leave' | 'holiday';
  lateBy?: number; // minutes
  overtime?: number; // minutes
  correctionRequest?: {
    requestedAt: Date;
    reason: string;
    proof: string[];
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    checkIn: {
      time: { type: Date, required: true },
      location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String, required: true },
      },
      photo: { type: String, required: true },
      deviceInfo: String,
      ip: String,
    },
    checkOut: {
      time: Date,
      location: {
        lat: Number,
        lng: Number,
        address: String,
      },
      photo: String,
    },
    breaks: [
      {
        breakIn: Date,
        breakOut: Date,
        duration: Number,
      },
    ],
    totalHours: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'leave', 'holiday'],
      default: 'present',
    },
    lateBy: Number,
    overtime: Number,
    correctionRequest: {
      requestedAt: Date,
      reason: String,
      proof: [String],
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
      },
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date,
      notes: String,
    },
  },
  { timestamps: true }
);

AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);

