import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../config/constants';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone: string;
  city: string;
  state: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['donor', 'recipient', 'blood_bank', 'admin'],
      required: true,
      default: 'donor'
    },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [77.5946, 12.9716] } // [lng, lat]
    },
    isVerified: { type: Boolean, default: true },
    avatarUrl: { type: String }
  },
  { timestamps: true }
);

UserSchema.index({ location: '2dsphere' });

export const User = mongoose.model<IUser>('User', UserSchema);
