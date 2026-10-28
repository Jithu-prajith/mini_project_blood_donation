import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { DonorProfile } from '../models/DonorProfile';
import { BloodBank } from '../models/BloodBank';
import { BloodInventoryUnit } from '../models/BloodInventoryUnit';
import { BloodRequest } from '../models/BloodRequest';
import { AuditLog } from '../models/AuditLog';
import { seedDatabase } from '../scripts/seed';
import { logAuditEvent } from '../services/auditService';

export const getSystemOverview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const verifiedDonors = await User.countDocuments({ role: 'donor', isVerified: true });
    const activeDonors = await DonorProfile.countDocuments({ isAvailable: true, 'healthStatus.canDonate': true });

    const totalBloodBanks = await BloodBank.countDocuments({ status: 'active' });
    const totalInventoryUnits = await BloodInventoryUnit.countDocuments();
    const availableBloodUnits = await BloodInventoryUnit.countDocuments({
      status: 'available',
      expiryDate: { $gt: new Date() }
    });
    const reservedUnits = await BloodInventoryUnit.countDocuments({ status: 'reserved' });
    const expiredOrDiscardedUnits = await BloodInventoryUnit.countDocuments({
      status: { $in: ['expired', 'discarded'] }
    });

    const totalRequests = await BloodRequest.countDocuments();
    const activeRequests = await BloodRequest.countDocuments({
      status: { $in: ['pending', 'matched', 'partially_fulfilled'] }
    });
    const emergencyRequests = await BloodRequest.countDocuments({
      urgencyLevel: 'emergency',
      status: { $in: ['pending', 'matched', 'partially_fulfilled'] }
    });
    const fulfilledRequests = await BloodRequest.countDocuments({ status: 'fulfilled' });

    const fulfilmentRate = totalRequests > 0 ? Math.round((fulfilledRequests / totalRequests) * 100) : 0;

    res.json({
      success: true,
      metrics: {
        totalDonors,
        verifiedDonors,
        activeDonors,
        totalBloodBanks,
        totalInventoryUnits,
        availableBloodUnits,
        reservedUnits,
        expiredOrDiscardedUnits,
        totalRequests,
        activeRequests,
        emergencyRequests,
        fulfilledRequests,
        fulfilmentRate
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyDonor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { donorUserId, isVerified } = req.body;
    const user = await User.findById(donorUserId);
    if (!user || user.role !== 'donor') {
      res.status(404).json({ success: false, message: 'Donor user not found.' });
      return;
    }

    user.isVerified = isVerified;
    await user.save();

    await logAuditEvent('DONOR_VERIFICATION_UPDATED', 'User', user._id.toString(), req.user, {
      isVerified
    });

    res.json({ success: true, message: `Donor verification status set to ${isVerified}.`, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { limit = 50, action } = req.query;
    const query: any = {};
    if (action) query.action = action;

    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(Number(limit));
    res.json({ success: true, count: logs.length, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetAndSeedData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const summary = await seedDatabase();
    await logAuditEvent('DATABASE_RESEEDED', 'System', undefined, req.user);
    res.json({
      success: true,
      message: 'Database successfully reseeded with rich demonstration records!',
      summary
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
