import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { StockTransfer } from '../models/StockTransfer';
import { BloodInventoryUnit } from '../models/BloodInventoryUnit';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { generateStockTransferRecommendations } from '../services/inventoryService';
import { sendNotification } from '../services/notificationService';
import { logAuditEvent } from '../services/auditService';
import { BloodBank } from '../models/BloodBank';

export const getTransferRecommendations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const recommendations = await generateStockTransferRecommendations();
    res.json({ success: true, count: recommendations.length, recommendations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTransferRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sourceBankId, targetBankId, bloodGroup, component, quantity, urgencyLevel, transferReason } = req.body;

    if (!sourceBankId || !targetBankId || !bloodGroup || !component || !quantity) {
      res.status(400).json({ success: false, message: 'Missing required transfer details.' });
      return;
    }

    const transfer = await StockTransfer.create({
      sourceBankId,
      targetBankId,
      bloodGroup,
      component,
      quantity: Number(quantity),
      urgencyLevel: urgencyLevel || 'urgent',
      status: 'requested',
      transferReason: transferReason || 'Regional shortage rebalancing'
    });

    // Notify source blood bank
    const sourceBank = await BloodBank.findById(sourceBankId);
    if (sourceBank) {
      await sendNotification(
        sourceBank.userId.toString(),
        `Stock Transfer Request: ${quantity} units of ${bloodGroup} ${component}`,
        `A stock transfer request was initiated by another facility. Reason: ${transfer.transferReason}`,
        'transfer_notice',
        transfer._id.toString(),
        'transfer'
      );
    }

    await logAuditEvent('STOCK_TRANSFER_REQUESTED', 'StockTransfer', transfer._id.toString(), req.user);

    res.status(201).json({ success: true, message: 'Stock transfer requested successfully.', transfer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTransferStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, unitIds } = req.body;
    const transfer = await StockTransfer.findById(req.params.id);

    if (!transfer) {
      res.status(404).json({ success: false, message: 'Transfer record not found.' });
      return;
    }

    const prevStatus = transfer.status;
    transfer.status = status;

    if (status === 'in_transit') {
      transfer.dispatchedAt = new Date();
      transfer.dispatchedBy = req.user!._id;

      // Update units to in_transit / reserved for transfer
      if (unitIds && Array.isArray(unitIds)) {
        transfer.unitIds = unitIds as any;
        for (const uid of unitIds) {
          const unit = await BloodInventoryUnit.findById(uid);
          if (unit) {
            unit.status = 'reserved';
            await unit.save();

            await InventoryTransaction.create({
              unitId: unit._id,
              bloodBankId: transfer.sourceBankId,
              transactionType: 'transfer_out',
              performedBy: req.user!._id,
              previousStatus: 'available',
              newStatus: 'reserved',
              notes: `Dispatched in stock transfer #${transfer._id.toString().slice(-6)} to target bank`,
              timestamp: new Date()
            });
          }
        }
      }
    } else if (status === 'received') {
      transfer.receivedAt = new Date();
      transfer.receivedBy = req.user!._id;

      // Transfer unit ownership to target blood bank
      for (const uid of transfer.unitIds) {
        const unit = await BloodInventoryUnit.findById(uid);
        if (unit) {
          unit.bloodBankId = transfer.targetBankId;
          unit.status = 'available';
          await unit.save();

          await InventoryTransaction.create({
            unitId: unit._id,
            bloodBankId: transfer.targetBankId,
            transactionType: 'transfer_in',
            performedBy: req.user!._id,
            previousStatus: 'reserved',
            newStatus: 'available',
            notes: `Received from source bank in transfer #${transfer._id.toString().slice(-6)}`,
            timestamp: new Date()
          });
        }
      }
    }

    await transfer.save();
    await logAuditEvent('STOCK_TRANSFER_STATUS_UPDATED', 'StockTransfer', transfer._id.toString(), req.user, {
      from: prevStatus,
      to: status
    });

    res.json({ success: true, message: `Transfer marked as ${status}.`, transfer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTransfers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { bloodBankId } = req.query;
    const query: any = {};

    if (bloodBankId) {
      query.$or = [{ sourceBankId: bloodBankId }, { targetBankId: bloodBankId }];
    }

    const transfers = await StockTransfer.find(query)
      .populate('sourceBankId', 'name city contactPhone')
      .populate('targetBankId', 'name city contactPhone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: transfers.length, transfers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
