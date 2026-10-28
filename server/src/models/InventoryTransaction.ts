import mongoose, { Schema, Document, Types } from 'mongoose';
import { InventoryStatus } from '../config/constants';

export interface IInventoryTransaction extends Document {
  unitId: Types.ObjectId;
  bloodBankId: Types.ObjectId;
  transactionType:
    | 'receipt'
    | 'reservation'
    | 'issue'
    | 'discard'
    | 'quarantine'
    | 'transfer_out'
    | 'transfer_in'
    | 'release_reservation';
  performedBy: Types.ObjectId;
  previousStatus: InventoryStatus;
  newStatus: InventoryStatus;
  requestId?: Types.ObjectId;
  patientName?: string;
  notes?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    unitId: { type: Schema.Types.ObjectId, ref: 'BloodInventoryUnit', required: true },
    bloodBankId: { type: Schema.Types.ObjectId, ref: 'BloodBank', required: true },
    transactionType: {
      type: String,
      enum: [
        'receipt',
        'reservation',
        'issue',
        'discard',
        'quarantine',
        'transfer_out',
        'transfer_in',
        'release_reservation'
      ],
      required: true
    },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    previousStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
    requestId: { type: Schema.Types.ObjectId, ref: 'BloodRequest' },
    patientName: { type: String },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now, required: true }
  },
  { timestamps: true }
);

InventoryTransactionSchema.index({ bloodBankId: 1, timestamp: -1 });
InventoryTransactionSchema.index({ unitId: 1, timestamp: -1 });

export const InventoryTransaction = mongoose.model<IInventoryTransaction>(
  'InventoryTransaction',
  InventoryTransactionSchema
);
