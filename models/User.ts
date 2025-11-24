import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'super_admin' | 'admin' | 'hr' | 'employee';
  department?: string;
  designation?: string;
  joiningDate?: Date;
  salaryMode?: string;
  status: 'active' | 'inactive';
  companyId?: mongoose.Types.ObjectId;
  shiftId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'hr', 'employee'],
      required: true,
    },
    department: String,
    designation: String,
    joiningDate: Date,
    salaryMode: String,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
    shiftId: { type: Schema.Types.ObjectId, ref: 'Shift' },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

