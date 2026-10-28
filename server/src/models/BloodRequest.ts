import mongoose, { Schema, Document, Types } from 'mongoose';
import { BloodGroup, BloodComponent, UrgencyLevel, RequestStatus } from '../config/constants';

export interface IBloodRequest extends Document {
  requesterId: Types.ObjectId;
  patientName: string;
  patientAge?: number;
  patientGender?: 'male' | 'female' | 'other';
  bloodGroup: BloodGroup;
  component: BloodComponent;
  unitsNeeded: number;
  unitsFulfilled: number;
  hospitalName: string;
  hospitalLocation: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  urgencyLevel: UrgencyLevel;
  requiredByDate: Date;
  status: RequestStatus;
  contactNumber: string;
  medicalNotes?: string;
  matchedDonorIds: Types.ObjectId[];
  reservedUnitIds: Types.ObjectId[];
  escalationLevel: number; // 0: Normal, 1: Radius Expanded, 2: Emergency Multi-Bank Broadcast
  statusHistory: Array<{
    status: RequestStatus;
    changedAt: Date;
    changedBy?: Types.ObjectId;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const BloodRequestSchema = new Schema<IBloodRequest>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true, trim: true },
    patientAge: { type: Number },
    patientGender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: {
      type: String,
      enum: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
      required: true
    },
    component: {
      type: String,
      enum: ['Whole Blood', 'Red Blood Cells', 'Platelets', 'Fresh Frozen Plasma', 'Cryoprecipitate'],
      default: 'Whole Blood',
      required: true
    },
    unitsNeeded: { type: Number, required: true, min: 1 },
    unitsFulfilled: { type: Number, default: 0, min: 0 },
    hospitalName: { type: String, required: true, trim: true },
    hospitalLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }
    },
    urgencyLevel: {
      type: String,
      enum: ['emergency', 'urgent', 'routine'],
      default: 'routine',
      required: true
    },
    requiredByDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'matched', 'partially_fulfilled', 'fulfilled', 'cancelled', 'expired'],
      default: 'pending',
      required: true
    },
    contactNumber: { type: String, required: true },
    medicalNotes: { type: String },
    matchedDonorIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    reservedUnitIds: [{ type: Schema.Types.ObjectId, ref: 'BloodInventoryUnit' }],
    escalationLevel: { type: Number, default: 0 },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        note: { type: String }
      }
    ]
  },
  { timestamps: true }
);

BloodRequestSchema.index({ hospitalLocation: '2dsphere' });
BloodRequestSchema.index({ status: 1, urgencyLevel: 1 });
BloodRequestSchema.index({ bloodGroup: 1, component: 1 });

export const BloodRequest = mongoose.model<IBloodRequest>('BloodRequest', BloodRequestSchema);
