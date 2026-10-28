import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBloodBank extends Document {
  userId: Types.ObjectId;
  name: string;
  licenseNumber: string;
  storageCapacityUnits: number;
  operatingHours: string;
  contactPhone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  location: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  status: 'active' | 'pending' | 'suspended';
  alertThresholdPerGroup: number;
  createdAt: Date;
  updatedAt: Date;
}

const BloodBankSchema = new Schema<IBloodBank>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true },
    storageCapacityUnits: { type: Number, default: 1000 },
    operatingHours: { type: String, default: '24/7 Emergency Service' },
    contactPhone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }
    },
    status: { type: String, enum: ['active', 'pending', 'suspended'], default: 'active' },
    alertThresholdPerGroup: { type: Number, default: 5 }
  },
  { timestamps: true }
);

BloodBankSchema.index({ location: '2dsphere' });

export const BloodBank = mongoose.model<IBloodBank>('BloodBank', BloodBankSchema);
