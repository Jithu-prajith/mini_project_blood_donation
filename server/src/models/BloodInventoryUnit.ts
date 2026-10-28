import mongoose, { Schema, Document, Types } from 'mongoose';
import { BloodGroup, BloodComponent, InventoryStatus } from '../config/constants';

export interface IBloodInventoryUnit extends Document {
  unitIdentifier: string; // Barcode / Unit ID (e.g., WB-BLR-2026-0012)
  bloodBankId: Types.ObjectId;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  collectionDate: Date;
  expiryDate: Date;
  volumeMl: number;
  status: InventoryStatus;
  storageLocation: {
    freezerId: string;
    shelfNumber: string;
  };
  reservedForRequestId?: Types.ObjectId;
  issuedToPatientName?: string;
  discardReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BloodInventoryUnitSchema = new Schema<IBloodInventoryUnit>(
  {
    unitIdentifier: { type: String, required: true, unique: true, uppercase: true, trim: true },
    bloodBankId: { type: Schema.Types.ObjectId, ref: 'BloodBank', required: true },
    bloodGroup: {
      type: String,
      enum: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
      required: true
    },
    component: {
      type: String,
      enum: ['Whole Blood', 'Red Blood Cells', 'Platelets', 'Fresh Frozen Plasma', 'Cryoprecipitate'],
      required: true
    },
    collectionDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    volumeMl: { type: Number, required: true, default: 450 },
    status: {
      type: String,
      enum: ['available', 'reserved', 'issued', 'expired', 'quarantined', 'discarded'],
      default: 'available',
      required: true
    },
    storageLocation: {
      freezerId: { type: String, default: 'FRZ-01' },
      shelfNumber: { type: String, default: 'SLF-A' }
    },
    reservedForRequestId: { type: Schema.Types.ObjectId, ref: 'BloodRequest' },
    issuedToPatientName: { type: String },
    discardReason: { type: String }
  },
  { timestamps: true }
);

BloodInventoryUnitSchema.index({ bloodBankId: 1, bloodGroup: 1, component: 1, status: 1 });
BloodInventoryUnitSchema.index({ expiryDate: 1, status: 1 });

export const BloodInventoryUnit = mongoose.model<IBloodInventoryUnit>('BloodInventoryUnit', BloodInventoryUnitSchema);
