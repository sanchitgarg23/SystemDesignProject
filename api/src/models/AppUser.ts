import mongoose, { Schema, Document } from 'mongoose';

export interface IAppUser extends Document {
  userId: string;
  mobile: string;
  name: string | null;
  createdAt: Date;
  lastLogin: Date | null;
}

const AppUserSchema = new Schema<IAppUser>({
  userId: { type: String, required: true, unique: true, index: true },
  mobile: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null }
});

export const AppUser = mongoose.model<IAppUser>('AppUser', AppUserSchema);
