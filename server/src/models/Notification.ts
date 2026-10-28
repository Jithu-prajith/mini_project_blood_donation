import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  recipientUserId: Types.ObjectId;
  title: string;
  message: string;
  type:
    | 'request_match'
    | 'status_change'
    | 'shortage_alert'
    | 'expiry_warning'
    | 'emergency_escalation'
    | 'donation_reminder'
    | 'transfer_notice';
  referenceId?: string;
  referenceType?: 'request' | 'unit' | 'transfer' | 'system';
  isRead: boolean;
  priority: 'high' | 'normal' | 'low';
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'request_match',
        'status_change',
        'shortage_alert',
        'expiry_warning',
        'emergency_escalation',
        'donation_reminder',
        'transfer_notice'
      ],
      required: true
    },
    referenceId: { type: String },
    referenceType: { type: String, enum: ['request', 'unit', 'transfer', 'system'], default: 'system' },
    isRead: { type: Boolean, default: false },
    priority: { type: String, enum: ['high', 'normal', 'low'], default: 'normal' }
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
