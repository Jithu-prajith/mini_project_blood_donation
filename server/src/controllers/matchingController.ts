import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { runDonorMatchingEngine } from '../services/matchingEngine';
import { DonorMatchingResult } from '../models/DonorMatchingResult';
import { BloodRequest } from '../models/BloodRequest';
import { sendNotification } from '../services/notificationService';
import { logAuditEvent } from '../services/auditService';

export const getMatchingDonors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const { radiusKm } = req.query;

    const results = await runDonorMatchingEngine(
      requestId,
      radiusKm ? Number(radiusKm) : 50
    );

    res.json({ success: true, ...results });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const contactMatchedDonor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { requestId, donorId } = req.body;
    if (!requestId || !donorId) {
      res.status(400).json({ success: false, message: 'Request ID and Donor ID are required.' });
      return;
    }

    const request = await BloodRequest.findById(requestId);
    if (!request) {
      res.status(404).json({ success: false, message: 'Blood request not found.' });
      return;
    }

    // Update status in matching result
    await DonorMatchingResult.findOneAndUpdate(
      { requestId, donorId },
      { status: 'notified', contactedAt: new Date() }
    );

    // Send in-app notification
    await sendNotification(
      donorId,
      `Direct Contact Request: ${request.bloodGroup} Blood Needed`,
      `The clinical coordination team for patient ${request.patientName} (${request.hospitalName}) has contacted you regarding request #${request._id.toString().slice(-6)}. Contact number: ${request.contactNumber}.`,
      'request_match',
      request._id.toString(),
      'request',
      request.urgencyLevel === 'emergency' ? 'high' : 'normal'
    );

    await logAuditEvent('DONOR_CONTACTED', 'DonorMatchingResult', donorId, req.user, {
      requestId
    });

    res.json({
      success: true,
      message: 'Notification and contact request dispatched to donor successfully.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
