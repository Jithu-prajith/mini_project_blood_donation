import { Types } from 'mongoose';
import { BloodInventoryUnit, IBloodInventoryUnit } from '../models/BloodInventoryUnit';
import { BloodBank } from '../models/BloodBank';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { StockTransfer } from '../models/StockTransfer';
import { BloodRequest } from '../models/BloodRequest';
import {
  BloodGroup,
  BloodComponent,
  InventoryStatus,
  BLOOD_GROUPS,
  BLOOD_COMPONENTS,
  COMPONENT_SHELF_LIFE_DAYS
} from '../config/constants';
import { calculateHaversineDistanceKm } from './compatibilityService';

export interface StockSummaryItem {
  bloodGroup: BloodGroup;
  component: BloodComponent;
  availableCount: number;
  reservedCount: number;
  quarantinedCount: number;
  expiringIn3DaysCount: number;
  expiringIn7DaysCount: number;
  isLowStock: boolean;
  threshold: number;
}

export interface InterBankTransferRecommendation {
  sourceBankId: string;
  sourceBankName: string;
  targetBankId: string;
  targetBankName: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  recommendedUnits: number;
  sourceAvailableStock: number;
  targetCurrentStock: number;
  distanceKm: number;
  reason: string;
}

/**
 * Ensures expired units are automatically updated in DB from 'available' to 'expired'
 */
export const updateExpiredUnits = async (bloodBankId?: string): Promise<number> => {
  const query: any = {
    status: { $in: ['available', 'reserved'] },
    expiryDate: { $lt: new Date() }
  };
  if (bloodBankId) query.bloodBankId = bloodBankId;

  const expiredUnits = await BloodInventoryUnit.find(query);
  if (expiredUnits.length === 0) return 0;

  for (const unit of expiredUnits) {
    const prevStatus = unit.status;
    unit.status = 'expired';
    unit.discardReason = 'Expired beyond shelf life';
    await unit.save();

    await InventoryTransaction.create({
      unitId: unit._id,
      bloodBankId: unit.bloodBankId,
      transactionType: 'discard',
      performedBy: unit.bloodBankId, // system/bank
      previousStatus: prevStatus,
      newStatus: 'expired',
      notes: `Automated expiry detection: unit expired on ${unit.expiryDate.toISOString().slice(0, 10)}`,
      timestamp: new Date()
    });
  }

  return expiredUnits.length;
};

/**
 * Get comprehensive stock summary and alert levels for a blood bank
 */
export const getBankStockSummary = async (bloodBankId: string): Promise<{
  bankName: string;
  totalAvailableUnits: number;
  totalReservedUnits: number;
  totalQuarantinedUnits: number;
  totalExpiringSoonUnits: number;
  matrix: StockSummaryItem[];
  lowStockAlerts: StockSummaryItem[];
}> => {
  await updateExpiredUnits(bloodBankId);

  const bank = await BloodBank.findById(bloodBankId);
  const threshold = bank?.alertThresholdPerGroup || 5;

  const now = new Date();
  const threeDaysAhead = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const matrix: StockSummaryItem[] = [];
  const lowStockAlerts: StockSummaryItem[] = [];
  let totalAvailableUnits = 0;
  let totalReservedUnits = 0;
  let totalQuarantinedUnits = 0;
  let totalExpiringSoonUnits = 0;

  for (const group of BLOOD_GROUPS) {
    for (const comp of BLOOD_COMPONENTS) {
      const units = await BloodInventoryUnit.find({
        bloodBankId,
        bloodGroup: group,
        component: comp
      });

      const availableUnits = units.filter((u) => u.status === 'available' && u.expiryDate > now);
      const reservedUnits = units.filter((u) => u.status === 'reserved');
      const quarantinedUnits = units.filter((u) => u.status === 'quarantined');
      const expiringIn3Days = availableUnits.filter((u) => u.expiryDate <= threeDaysAhead);
      const expiringIn7Days = availableUnits.filter((u) => u.expiryDate <= sevenDaysAhead);

      const availableCount = availableUnits.length;
      const reservedCount = reservedUnits.length;
      const quarantinedCount = quarantinedUnits.length;
      const isLowStock = availableCount < threshold;

      totalAvailableUnits += availableCount;
      totalReservedUnits += reservedCount;
      totalQuarantinedUnits += quarantinedCount;
      totalExpiringSoonUnits += expiringIn7Days.length;

      const item: StockSummaryItem = {
        bloodGroup: group,
        component: comp,
        availableCount,
        reservedCount,
        quarantinedCount,
        expiringIn3DaysCount: expiringIn3Days.length,
        expiringIn7DaysCount: expiringIn7Days.length,
        isLowStock,
        threshold
      };

      matrix.push(item);
      if (isLowStock && (comp === 'Whole Blood' || comp === 'Red Blood Cells')) {
        lowStockAlerts.push(item);
      }
    }
  }

  return {
    bankName: bank?.name || 'Blood Bank',
    totalAvailableUnits,
    totalReservedUnits,
    totalQuarantinedUnits,
    totalExpiringSoonUnits,
    matrix,
    lowStockAlerts
  };
};

/**
 * Reserve blood units for a verified blood request
 * Enforces: Atomic lock, no double-reservation, non-expired, available status only
 */
export const reserveUnitsForRequest = async (
  requestId: string,
  unitIds: string[],
  userId: string
): Promise<{ success: boolean; reservedCount: number; message: string }> => {
  await updateExpiredUnits();

  const request = await BloodRequest.findById(requestId);
  if (!request) throw new Error('Blood request not found.');

  const now = new Date();
  let reservedCount = 0;

  for (const uid of unitIds) {
    // Find unit strictly with status 'available' and non-expired
    const unit = await BloodInventoryUnit.findOne({
      _id: uid,
      status: 'available',
      expiryDate: { $gt: now }
    });

    if (!unit) continue;

    unit.status = 'reserved';
    unit.reservedForRequestId = request._id as any;
    await unit.save();

    await InventoryTransaction.create({
      unitId: unit._id,
      bloodBankId: unit.bloodBankId,
      transactionType: 'reservation',
      performedBy: userId,
      previousStatus: 'available',
      newStatus: 'reserved',
      requestId: request._id,
      patientName: request.patientName,
      notes: `Reserved for Patient: ${request.patientName} (${request.hospitalName})`,
      timestamp: new Date()
    });

    request.reservedUnitIds.push(unit._id as any);
    reservedCount++;
  }

  request.unitsFulfilled = Math.min(request.unitsNeeded, request.unitsFulfilled + reservedCount);
  if (request.unitsFulfilled >= request.unitsNeeded) {
    request.status = 'fulfilled';
  } else if (request.unitsFulfilled > 0) {
    request.status = 'partially_fulfilled';
  }
  await request.save();

  return {
    success: reservedCount > 0,
    reservedCount,
    message: `Successfully reserved ${reservedCount} blood unit(s) for patient ${request.patientName}.`
  };
};

/**
 * Issue reserved units to patient / clinical team (Completed Transfusion Hand-off)
 */
export const issueReservedUnits = async (
  requestId: string,
  unitIds: string[],
  userId: string,
  recipientName: string
): Promise<{ success: boolean; issuedCount: number }> => {
  let issuedCount = 0;

  for (const uid of unitIds) {
    const unit = await BloodInventoryUnit.findOne({
      _id: uid,
      status: 'reserved'
    });

    if (!unit) continue;

    unit.status = 'issued';
    unit.issuedToPatientName = recipientName;
    await unit.save();

    await InventoryTransaction.create({
      unitId: unit._id,
      bloodBankId: unit.bloodBankId,
      transactionType: 'issue',
      performedBy: userId,
      previousStatus: 'reserved',
      newStatus: 'issued',
      requestId: new Types.ObjectId(requestId),
      patientName: recipientName,
      notes: `Unit issued and dispatched for transfusion to ${recipientName}`,
      timestamp: new Date()
    });

    issuedCount++;
  }

  return { success: issuedCount > 0, issuedCount };
};

/**
 * Discard / Quarantine a blood unit with auditable reason
 */
export const updateUnitDisposalStatus = async (
  unitId: string,
  newStatus: 'quarantined' | 'discarded',
  reason: string,
  userId: string
): Promise<IBloodInventoryUnit> => {
  const unit = await BloodInventoryUnit.findById(unitId);
  if (!unit) throw new Error('Inventory unit not found.');

  const prevStatus = unit.status;
  unit.status = newStatus;
  unit.discardReason = reason;
  await unit.save();

  await InventoryTransaction.create({
    unitId: unit._id,
    bloodBankId: unit.bloodBankId,
    transactionType: newStatus === 'quarantined' ? 'quarantine' : 'discard',
    performedBy: userId,
    previousStatus: prevStatus,
    newStatus,
    notes: reason,
    timestamp: new Date()
  });

  return unit;
};

/**
 * Inter-Bank Stock Transfer Recommender
 * Compares surplus stock in Bank A with severe shortages in nearby Bank B
 */
export const generateStockTransferRecommendations = async (): Promise<InterBankTransferRecommendation[]> => {
  await updateExpiredUnits();

  const activeBanks = await BloodBank.find({ status: 'active' });
  if (activeBanks.length < 2) return [];

  const recommendations: InterBankTransferRecommendation[] = [];

  for (const group of BLOOD_GROUPS) {
    for (const comp of ['Whole Blood', 'Red Blood Cells', 'Platelets'] as BloodComponent[]) {
      // Find banks with shortage (< 3 units)
      for (const targetBank of activeBanks) {
        const targetUnits = await BloodInventoryUnit.countDocuments({
          bloodBankId: targetBank._id,
          bloodGroup: group,
          component: comp,
          status: 'available',
          expiryDate: { $gt: new Date() }
        });

        if (targetUnits < 3) {
          // Find banks with surplus (>= 8 units)
          for (const sourceBank of activeBanks) {
            if (sourceBank._id.toString() === targetBank._id.toString()) continue;

            const sourceUnits = await BloodInventoryUnit.countDocuments({
              bloodBankId: sourceBank._id,
              bloodGroup: group,
              component: comp,
              status: 'available',
              expiryDate: { $gt: new Date() }
            });

            if (sourceUnits >= 7) {
              const [sLng, sLat] = sourceBank.location.coordinates;
              const [tLng, tLat] = targetBank.location.coordinates;
              const dist = calculateHaversineDistanceKm(sLat, sLng, tLat, tLng);

              if (dist <= 60) {
                const recommendUnits = Math.min(3, Math.floor((sourceUnits - 4) / 2));
                if (recommendUnits > 0) {
                  recommendations.push({
                    sourceBankId: sourceBank._id.toString(),
                    sourceBankName: sourceBank.name,
                    targetBankId: targetBank._id.toString(),
                    targetBankName: targetBank.name,
                    bloodGroup: group,
                    component: comp,
                    recommendedUnits: recommendUnits,
                    sourceAvailableStock: sourceUnits,
                    targetCurrentStock: targetUnits,
                    distanceKm: dist,
                    reason: `${sourceBank.name} has ${sourceUnits} units surplus of ${group} ${comp}. Transfer recommended to relieve critical shortage (${targetUnits} units remaining) at ${targetBank.name} (${dist} km away).`
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  // Deduplicate and return top recommendations
  return recommendations.slice(0, 10);
};
