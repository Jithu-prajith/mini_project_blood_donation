import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { BloodInventoryUnit } from '../models/BloodInventoryUnit';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { BloodBank } from '../models/BloodBank';
import {
  reserveUnitsForRequest,
  issueReservedUnits,
  updateUnitDisposalStatus,
  updateExpiredUnits
} from '../services/inventoryService';
import { COMPONENT_SHELF_LIFE_DAYS, BloodComponent } from '../config/constants';
import { logAuditEvent } from '../services/auditService';

export const getInventoryList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { bloodBankId, bloodGroup, component, status, expiringSoon } = req.query;
    await updateExpiredUnits(bloodBankId ? String(bloodBankId) : undefined);

    const query: any = {};
    if (bloodBankId) query.bloodBankId = bloodBankId;
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (component) query.component = component;
    if (status) {
      query.status = status;
    } else {
      // default: do not hide any, or show all
    }

    if (expiringSoon === 'true') {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      query.status = 'available';
      query.expiryDate = { $gte: now, $lte: in7Days };
    }

    const units = await BloodInventoryUnit.find(query)
      .populate('bloodBankId', 'name address city')
      .populate('reservedForRequestId', 'patientName hospitalName urgencyLevel')
      .sort({ expiryDate: 1 });

    res.json({ success: true, count: units.length, units });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addInventoryUnit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      bloodBankId,
      bloodGroup,
      component = 'Whole Blood',
      collectionDate,
      volumeMl = 450,
      freezerId = 'FRZ-01',
      shelfNumber = 'SLF-A',
      unitIdentifier
    } = req.body;

    if (!bloodBankId || !bloodGroup || !component) {
      res.status(400).json({ success: false, message: 'Missing required blood unit attributes.' });
      return;
    }

    // Auto-calculate expiryDate from standard shelf life if not provided
    const colDate = collectionDate ? new Date(collectionDate) : new Date();
    const shelfLife = COMPONENT_SHELF_LIFE_DAYS[component as BloodComponent] || 35;
    const expiryDate = new Date(colDate.getTime() + shelfLife * 24 * 60 * 60 * 1000);

    // Auto-generate identifier if not provided
    const barcode =
      unitIdentifier ||
      `${component.slice(0, 2).toUpperCase()}-${bloodGroup.replace('+', 'P').replace('-', 'N')}-${Date.now().toString().slice(-6)}`;

    // Verify unique barcode
    const existing = await BloodInventoryUnit.findOne({ unitIdentifier: barcode });
    if (existing) {
      res.status(400).json({ success: false, message: `Barcode/Unit Identifier ${barcode} already exists.` });
      return;
    }

    const unit = await BloodInventoryUnit.create({
      unitIdentifier: barcode,
      bloodBankId,
      bloodGroup,
      component,
      collectionDate: colDate,
      expiryDate,
      volumeMl,
      status: 'available',
      storageLocation: {
        freezerId,
        shelfNumber
      }
    });

    // Record auditable transaction
    await InventoryTransaction.create({
      unitId: unit._id,
      bloodBankId,
      transactionType: 'receipt',
      performedBy: req.user!._id,
      previousStatus: 'available',
      newStatus: 'available',
      notes: `New blood unit registered: ${unit.unitIdentifier} (${bloodGroup} ${component})`,
      timestamp: new Date()
    });

    await logAuditEvent('INVENTORY_UNIT_ADDED', 'BloodInventoryUnit', unit._id.toString(), req.user, {
      barcode,
      bloodGroup,
      component
    });

    res.status(201).json({ success: true, message: 'Blood unit registered successfully!', unit });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reserveUnits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { requestId, unitIds } = req.body;
    if (!requestId || !unitIds || !Array.isArray(unitIds) || unitIds.length === 0) {
      res.status(400).json({ success: false, message: 'Invalid request or unit IDs.' });
      return;
    }

    const result = await reserveUnitsForRequest(requestId, unitIds, req.user!._id.toString());
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const issueUnits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { requestId, unitIds, recipientName } = req.body;
    if (!requestId || !unitIds || !Array.isArray(unitIds) || unitIds.length === 0) {
      res.status(400).json({ success: false, message: 'Missing issue details.' });
      return;
    }

    const result = await issueReservedUnits(requestId, unitIds, req.user!._id.toString(), recipientName || 'Patient');
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const discardOrQuarantineUnit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { unitId, action, reason } = req.body;
    if (!unitId || !['quarantined', 'discarded'].includes(action)) {
      res.status(400).json({ success: false, message: "Action must be 'quarantined' or 'discarded'." });
      return;
    }

    const unit = await updateUnitDisposalStatus(unitId, action, reason || 'Clinical discretion', req.user!._id.toString());
    res.json({ success: true, message: `Unit marked as ${action}.`, unit });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInventoryTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { bloodBankId, limit = 50 } = req.query;
    const query: any = {};
    if (bloodBankId) query.bloodBankId = bloodBankId;

    const transactions = await InventoryTransaction.find(query)
      .populate('unitId', 'unitIdentifier bloodGroup component')
      .populate('performedBy', 'name role email')
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: transactions.length, transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
