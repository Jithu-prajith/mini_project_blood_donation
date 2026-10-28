import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  entityType: string;
  entityId?: string;
  performedBy?: Types.ObjectId;
  performedByName?: string;
  performedByRole?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    performedByName: { type: String },
    performedByRole: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: 'HemaMatch Platform' },
    timestamp: { type: Date, default: Date.now, required: true }
  },
  { timestamps: true }
);

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
