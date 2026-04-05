import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'super_admin' | 'viewer';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'super_admin', 'viewer'],
    default: 'admin' 
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const AdminUser = mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
