import mongoose, { Schema, Document, Types } from 'mongoose';
import { BloodGroup, BloodComponent, UrgencyLevel } from '../config/constants';

export interface IStockTransfer extends Document {
  sourceBankId: Types.ObjectId;
  targetBankId: Types.ObjectId;
  unitIds: Types.ObjectId[];
  bloodGroup: BloodGroup;
  component: BloodComponent;
  quantity: number;
  urgencyLevel: UrgencyLevel;
  status: 'recommended' | 'requested' | 'approved' | 'in_transit' | 'received' | 'rejected' | 'cancelled';
  transferReason: string;
  dispatchedAt?: Date;
  receivedAt?: Date;
  dispatchedBy?: Types.ObjectId;
  receivedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StockTransferSchema = new Schema<IStockTransfer>(
  {
    sourceBankId: { type: Schema.Types.ObjectId, ref: 'BloodBank', required: true },
    targetBankId: { type: Schema.Types.ObjectId, ref: 'BloodBank', required: true },
    unitIds: [{ type: Schema.Types.ObjectId, ref: 'BloodInventoryUnit' }],
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
    quantity: { type: Number, required: true, min: 1 },
    urgencyLevel: {
      type: String,
      enum: ['emergency', 'urgent', 'routine'],
      default: 'urgent'
    },
    status: {
      type: String,
      enum: ['recommended', 'requested', 'approved', 'in_transit', 'received', 'rejected', 'cancelled'],
      default: 'recommended',
      required: true
    },
    transferReason: { type: String, required: true },
    dispatchedAt: { type: Date },
    receivedAt: { type: Date },
    dispatchedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

StockTransferSchema.index({ sourceBankId: 1, status: 1 });
StockTransferSchema.index({ targetBankId: 1, status: 1 });

export const StockTransfer = mongoose.model<IStockTransfer>('StockTransfer', StockTransferSchema);
