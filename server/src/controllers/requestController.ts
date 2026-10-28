import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { BloodRequest } from '../models/BloodRequest';
import { runDonorMatchingEngine } from '../services/matchingEngine';
import { notifyMatchedDonors, broadcastEmergencyEscalation } from '../services/notificationService';
import { logAuditEvent } from '../services/auditService';

export const createBloodRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      patientName,
      patientAge,
      patientGender,
      bloodGroup,
      component = 'Whole Blood',
      unitsNeeded,
      hospitalName,
      hospitalCoordinates, // [lng, lat]
      urgencyLevel = 'routine',
      requiredByDate,
      contactNumber,
      medicalNotes
    } = req.body;

    if (!patientName || !bloodGroup || !unitsNeeded || !hospitalName || !contactNumber) {
      res.status(400).json({ success: false, message: 'Please provide all required blood request parameters.' });
      return;
    }

    const coords = hospitalCoordinates || [77.5946, 12.9716];
    const reqBy = requiredByDate ? new Date(requiredByDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const request = await BloodRequest.create({
      requesterId: req.user!._id,
      patientName,
      patientAge,
      patientGender,
      bloodGroup,
      component,
      unitsNeeded: Number(unitsNeeded),
      hospitalName,
      hospitalLocation: {
        type: 'Point',
        coordinates: coords
      },
      urgencyLevel,
      requiredByDate: reqBy,
      status: 'pending',
      contactNumber,
      medicalNotes,
      statusHistory: [
        {
          status: 'pending',
          changedAt: new Date(),
          changedBy: req.user!._id,
          note: `Blood request submitted. Urgency: ${urgencyLevel.toUpperCase()}`
        }
      ]
    });

    // Run matching engine immediately
    const matchingResult = await runDonorMatchingEngine(request._id.toString());

    // If emergency, automatically notify top matched donors and broadcast to banks
    if (urgencyLevel === 'emergency') {
      const topDonorIds = matchingResult.rankedDonors.slice(0, 10).map((d) => d.donorId);
      await notifyMatchedDonors(request, topDonorIds);
      await broadcastEmergencyEscalation(request);
    }

    await logAuditEvent('BLOOD_REQUEST_CREATED', 'BloodRequest', request._id.toString(), req.user, {
      patientName,
      bloodGroup,
      urgencyLevel
    });

    res.status(201).json({
      success: true,
      message: 'Blood request submitted successfully and matching candidates identified!',
      request,
      matchingResult
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBloodRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, urgency, bloodGroup, search } = req.query;
    const query: any = {};

    if (status && status !== 'all') query.status = status;
    if (urgency && urgency !== 'all') query.urgencyLevel = urgency;
    if (bloodGroup && bloodGroup !== 'all') query.bloodGroup = bloodGroup;
    if (search) {
      query.$or = [
        { patientName: new RegExp(String(search), 'i') },
        { hospitalName: new RegExp(String(search), 'i') }
      ];
    }

    const requests = await BloodRequest.find(query)
      .populate('requesterId', 'name email phone')
      .sort({ urgencyLevel: 1, createdAt: -1 });

    res.json({ success: true, count: requests.length, requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const requests = await BloodRequest.find({ requesterId: userId })
      .populate('reservedUnitIds', 'unitIdentifier bloodGroup component expiryDate')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBloodRequestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const request = await BloodRequest.findById(req.params.id)
      .populate('requesterId', 'name email phone city')
      .populate({
        path: 'reservedUnitIds',
        populate: { path: 'bloodBankId', select: 'name contactPhone address city' }
      });

    if (!request) {
      res.status(404).json({ success: false, message: 'Blood request not found.' });
      return;
    }

    res.json({ success: true, request });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const escalateBloodRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: 'Blood request not found.' });
      return;
    }

    request.escalationLevel = (request.escalationLevel || 0) + 1;
    request.urgencyLevel = 'emergency';
    request.statusHistory.push({
      status: request.status,
      changedAt: new Date(),
      changedBy: req.user!._id,
      note: `Urgent escalation triggered (Level ${request.escalationLevel}). Multi-bank emergency broadcast dispatched.`
    });
    await request.save();

    // Broadcast escalation alert
    await broadcastEmergencyEscalation(request);

    // Re-run matching with expanded radius (100km)
    const matchingResult = await runDonorMatchingEngine(request._id.toString(), 100);
    const topDonorIds = matchingResult.rankedDonors.slice(0, 15).map((d) => d.donorId);
    await notifyMatchedDonors(request, topDonorIds);

    await logAuditEvent('REQUEST_ESCALATED', 'BloodRequest', request._id.toString(), req.user, {
      escalationLevel: request.escalationLevel
    });

    res.json({
      success: true,
      message: 'Request escalated successfully to Emergency priority and alert broadcast to all regional centers.',
      request,
      matchingResult
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRequestStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, note } = req.body;
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: 'Blood request not found.' });
      return;
    }

    const prevStatus = request.status;
    request.status = status;
    request.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user!._id,
      note: note || `Status updated from ${prevStatus} to ${status}`
    });
    await request.save();

    await logAuditEvent('REQUEST_STATUS_UPDATED', 'BloodRequest', request._id.toString(), req.user, {
      from: prevStatus,
      to: status
    });

    res.json({ success: true, message: `Request status updated to ${status}.`, request });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
