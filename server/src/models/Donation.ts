import mongoose, { Schema, Document, Types } from 'mongoose';
import { BloodGroup, BloodComponent } from '../config/constants';

export interface IDonation extends Document {
  donorId: Types.ObjectId;
  bloodBankId: Types.ObjectId;
  requestId?: Types.ObjectId;
  donationDate: Date;
  unitsCollected: number;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  vitals: {
    hemoglobin: number;
    bpSys: number;
    bpDia: number;
    pulse: number;
  };
  status: 'completed' | 'tested' | 'stored' | 'rejected';
  unitIdentifierCreated?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema = new Schema<IDonation>(
  {
    donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bloodBankId: { type: Schema.Types.ObjectId, ref: 'BloodBank', required: true },
    requestId: { type: Schema.Types.ObjectId, ref: 'BloodRequest' },
    donationDate: { type: Date, default: Date.now, required: true },
    unitsCollected: { type: Number, default: 1, min: 1 },
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
    vitals: {
      hemoglobin: { type: Number, default: 14.0 },
      bpSys: { type: Number, default: 120 },
      bpDia: { type: Number, default: 80 },
      pulse: { type: Number, default: 72 }
    },
    status: {
      type: String,
      enum: ['completed', 'tested', 'stored', 'rejected'],
      default: 'completed'
    },
    unitIdentifierCreated: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

DonationSchema.index({ donorId: 1, donationDate: -1 });
DonationSchema.index({ bloodBankId: 1, donationDate: -1 });

export const Donation = mongoose.model<IDonation>('Donation', DonationSchema);
