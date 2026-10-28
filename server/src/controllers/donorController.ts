import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { DonorProfile } from '../models/DonorProfile';
import { Donation } from '../models/Donation';
import { User } from '../models/User';
import { checkDonationEligibility } from '../services/compatibilityService';
import { logAuditEvent } from '../services/auditService';

export const getDonorProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const profile = await DonorProfile.findOne({ userId }).populate('userId', 'name email phone city state location');

    if (!profile) {
      res.status(404).json({ success: false, message: 'Donor profile not found.' });
      return;
    }

    const elig = checkDonationEligibility(profile.lastDonationDate);

    res.json({
      success: true,
      profile,
      eligibility: elig
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDonorProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { bloodGroup, weightKg, isAvailable, consentContact, preferredRadiusKm, city, state, coordinates } = req.body;

    const profile = await DonorProfile.findOne({ userId });
    if (!profile) {
      res.status(404).json({ success: false, message: 'Donor profile not found.' });
      return;
    }

    if (bloodGroup) profile.bloodGroup = bloodGroup;
    if (weightKg) profile.weightKg = weightKg;
    if (typeof isAvailable === 'boolean') profile.isAvailable = isAvailable;
    if (typeof consentContact === 'boolean') profile.consentContact = consentContact;
    if (preferredRadiusKm) profile.preferredRadiusKm = preferredRadiusKm;

    await profile.save();

    if (city || state || coordinates) {
      const user = await User.findById(userId);
      if (user) {
        if (city) user.city = city;
        if (state) user.state = state;
        if (coordinates) {
          user.location = {
            type: 'Point',
            coordinates: coordinates
          };
        }
        await user.save();
      }
    }

    await logAuditEvent('DONOR_PROFILE_UPDATED', 'DonorProfile', profile._id.toString(), req.user);

    res.json({ success: true, message: 'Donor profile updated successfully.', profile });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleAvailability = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const profile = await DonorProfile.findOne({ userId });

    if (!profile) {
      res.status(404).json({ success: false, message: 'Donor profile not found.' });
      return;
    }

    profile.isAvailable = !profile.isAvailable;
    await profile.save();

    res.json({
      success: true,
      message: `Availability updated to ${profile.isAvailable ? 'ACTIVE' : 'INACTIVE'}`,
      isAvailable: profile.isAvailable
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyDonations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const donations = await Donation.find({ donorId: userId })
      .populate('bloodBankId', 'name address contactPhone city')
      .sort({ donationDate: -1 });

    res.json({ success: true, donations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
