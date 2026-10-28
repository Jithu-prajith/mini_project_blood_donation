import mongoose, { Schema, Document, Types } from 'mongoose';
import { BloodGroup, BloodComponent } from '../config/constants';

export interface IForecastRecord extends Document {
  bloodBankId?: Types.ObjectId;
  targetDate: Date;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  horizonDays: number; // 7, 14, 30
  historicalDemandAverage: number;
  predictedDemand: number;
  confidenceLower: number;
  confidenceUpper: number;
  currentStock: number;
  shortageRiskScore: 'low' | 'moderate' | 'high' | 'critical';
  recommendedReplenishmentUnits: number;
  potentialWastageUnits: number;
  modelName: string;
  evaluationMetrics: {
    mae: number;
    rmse: number;
  };
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ForecastRecordSchema = new Schema<IForecastRecord>(
  {
    bloodBankId: { type: Schema.Types.ObjectId, ref: 'BloodBank' },
    targetDate: { type: Date, required: true },
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
    horizonDays: { type: Number, required: true },
    historicalDemandAverage: { type: Number, required: true },
    predictedDemand: { type: Number, required: true },
    confidenceLower: { type: Number, required: true },
    confidenceUpper: { type: Number, required: true },
    currentStock: { type: Number, required: true, default: 0 },
    shortageRiskScore: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      required: true
    },
    recommendedReplenishmentUnits: { type: Number, default: 0 },
    potentialWastageUnits: { type: Number, default: 0 },
    modelName: { type: String, default: 'Random Forest Regressor + Moving Average' },
    evaluationMetrics: {
      mae: { type: Number, default: 1.2 },
      rmse: { type: Number, default: 1.6 }
    },
    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ForecastRecordSchema.index({ targetDate: 1, bloodGroup: 1, component: 1, horizonDays: 1 });

export const ForecastRecord = mongoose.model<IForecastRecord>('ForecastRecord', ForecastRecordSchema);
