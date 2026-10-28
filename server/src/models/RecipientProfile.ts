import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRecipientProfile extends Document {
  userId: Types.ObjectId;
  hospitalName?: string;
  defaultDeliveryAddress?: string;
  contactPerson?: string;
  emergencyPhone?: string;
  medicalRegistrationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecipientProfileSchema = new Schema<IRecipientProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    hospitalName: { type: String, trim: true },
    defaultDeliveryAddress: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    emergencyPhone: { type: String, trim: true },
    medicalRegistrationId: { type: String, trim: true }
  },
  { timestamps: true }
);

export const RecipientProfile = mongoose.model<IRecipientProfile>('RecipientProfile', RecipientProfileSchema);
