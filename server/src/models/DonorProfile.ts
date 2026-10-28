import mongoose, { Schema, Document, Types } from 'mongoose';
import { BloodGroup } from '../config/constants';

export interface IDonorProfile extends Document {
  userId: Types.ObjectId;
  bloodGroup: BloodGroup;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  weightKg: number;
  lastDonationDate?: Date;
  totalDonations: number;
  isAvailable: boolean;
  healthStatus: {
    canDonate: boolean;
    reason?: string;
    hemoglobin?: number;
  };
  consentContact: boolean;
  preferredRadiusKm: number;
  createdAt: Date;
  updatedAt: Date;
}

const DonorProfileSchema = new Schema<IDonorProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bloodGroup: {
      type: String,
      enum: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
      required: true
    },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    weightKg: { type: Number, required: true, min: 45 },
    lastDonationDate: { type: Date },
    totalDonations: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    healthStatus: {
      canDonate: { type: Boolean, default: true },
      reason: { type: String, default: 'Fit and eligible' },
      hemoglobin: { type: Number, default: 14.2 }
    },
    consentContact: { type: Boolean, default: true },
    preferredRadiusKm: { type: Number, default: 30 }
  },
  { timestamps: true }
);

export const DonorProfile = mongoose.model<IDonorProfile>('DonorProfile', DonorProfileSchema);
