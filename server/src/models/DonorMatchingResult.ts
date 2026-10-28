import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDonorMatchingResult extends Document {
  requestId: Types.ObjectId;
  donorId: Types.ObjectId;
  compatibilityScore: number;
  distanceKm: number;
  recencyScore: number;
  overallScore: number;
  rank: number;
  recommendationReason: string;
  matchFactors: {
    bloodMatch: boolean;
    distanceMatch: boolean;
    coolingPeriodOk: boolean;
    availabilityOk: boolean;
    exactMatch: boolean;
  };
  contactedAt?: Date;
  status: 'suggested' | 'notified' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

const DonorMatchingResultSchema = new Schema<IDonorMatchingResult>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'BloodRequest', required: true },
    donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    compatibilityScore: { type: Number, required: true },
    distanceKm: { type: Number, required: true },
    recencyScore: { type: Number, required: true },
    overallScore: { type: Number, required: true },
    rank: { type: Number, required: true },
    recommendationReason: { type: String, required: true },
    matchFactors: {
      bloodMatch: { type: Boolean, default: true },
      distanceMatch: { type: Boolean, default: true },
      coolingPeriodOk: { type: Boolean, default: true },
      availabilityOk: { type: Boolean, default: true },
      exactMatch: { type: Boolean, default: false }
    },
    contactedAt: { type: Date },
    status: {
      type: String,
      enum: ['suggested', 'notified', 'accepted', 'declined'],
      default: 'suggested'
    }
  },
  { timestamps: true }
);

DonorMatchingResultSchema.index({ requestId: 1, donorId: 1 }, { unique: true });
DonorMatchingResultSchema.index({ requestId: 1, rank: 1 });

export const DonorMatchingResult = mongoose.model<IDonorMatchingResult>(
  'DonorMatchingResult',
  DonorMatchingResultSchema
);
