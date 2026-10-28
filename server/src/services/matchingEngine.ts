import { User, IUser } from '../models/User';
import { DonorProfile, IDonorProfile } from '../models/DonorProfile';
import { BloodRequest, IBloodRequest } from '../models/BloodRequest';
import { DonorMatchingResult } from '../models/DonorMatchingResult';
import { BloodInventoryUnit } from '../models/BloodInventoryUnit';
import { BloodBank } from '../models/BloodBank';
import {
  getCompatibleDonorGroups,
  checkDonationEligibility,
  calculateHaversineDistanceKm
} from './compatibilityService';
import { MATCHING_WEIGHTS, CLINICAL_DISCLAIMER } from '../config/constants';

export interface RankedDonorMatch {
  donorId: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  bloodGroup: string;
  city: string;
  distanceKm: number;
  lastDonationDate?: Date;
  daysSinceLastDonation: number;
  totalDonations: number;
  isAvailable: boolean;
  canDonate: boolean;
  compatibilityScore: number;
  recencyScore: number;
  distanceScore: number;
  overallScore: number;
  rank: number;
  recommendationReason: string;
  matchFactors: {
    bloodMatch: boolean;
    exactMatch: boolean;
    distanceMatch: boolean;
    coolingPeriodOk: boolean;
    availabilityOk: boolean;
  };
  consentContact: boolean;
}

export interface MatchingEngineResult {
  requestId: string;
  requestedBloodGroup: string;
  requestedComponent: string;
  unitsNeeded: number;
  urgencyLevel: string;
  compatibleDonorGroups: string[];
  totalEligibleDonorsFound: number;
  rankedDonors: RankedDonorMatch[];
  nearbyBloodBankInventory: Array<{
    bloodBankId: string;
    bloodBankName: string;
    contactPhone: string;
    address: string;
    distanceKm: number;
    availableUnitsCount: number;
    unitIds: string[];
  }>;
  disclaimer: string;
}

export const runDonorMatchingEngine = async (
  requestId: string,
  maxRadiusKm = 100
): Promise<MatchingEngineResult> => {
  // 1. Validate request
  const request = await BloodRequest.findById(requestId);
  if (!request) {
    throw new Error(`Blood request not found with ID: ${requestId}`);
  }

  const { bloodGroup, component, hospitalLocation, unitsNeeded, urgencyLevel } = request;
  const hospitalCoords = hospitalLocation?.coordinates || [77.5946, 12.9716];
  const [hospLng, hospLat] = hospitalCoords;

  // 2. Apply strict ABO/Rh compatibility rules appropriate to specified blood component
  const compatibleGroups = getCompatibleDonorGroups(bloodGroup, component);

  // 3. Find registered donors matching compatible blood groups
  const eligibleProfiles = await DonorProfile.find({
    bloodGroup: { $in: compatibleGroups },
    'healthStatus.canDonate': true
  }).populate<{ userId: IUser }>('userId');

  const evaluatedCandidates: Array<{
    profile: IDonorProfile & { userId: IUser };
    distanceKm: number;
    daysSinceLastDonation: number;
    exactMatch: boolean;
    coolingOk: boolean;
    compatibilityScore: number;
    distanceScore: number;
    recencyScore: number;
    availScore: number;
    overallScore: number;
    recommendationReason: string;
  }> = [];

  // Filter & calculate scores
  for (const profile of eligibleProfiles) {
    const user = profile.userId;
    if (!user || user.role !== 'donor') continue;

    // Filter out unavailable donors
    if (!profile.isAvailable) continue;

    // Cooling off / interval check
    const elig = checkDonationEligibility(profile.lastDonationDate, component);
    if (!elig.eligible) continue; // must pass medical cooling off

    // Proximity
    const [donorLng, donorLat] = user.location?.coordinates || [77.5946, 12.9716];
    const distanceKm = calculateHaversineDistanceKm(hospLat, hospLng, donorLat, donorLng);

    // Filter by radius if donor set max radius or standard boundary
    const effectiveMaxRadius = Math.max(maxRadiusKm, profile.preferredRadiusKm || 30);
    if (distanceKm > effectiveMaxRadius) continue;

    const exactMatch = profile.bloodGroup === bloodGroup;
    const compatibilityScore = exactMatch ? 1.0 : 0.85;

    // Distance score: 1.0 at 0km, decreasing linearly to 0 at effectiveMaxRadius
    const distanceScore = Math.max(0, 1 - distanceKm / effectiveMaxRadius);

    // Recency score: well-rested donors score higher (56 - 180 days)
    const recencyScore = Math.min(1.0, elig.daysSinceLastDonation / 120);

    // Availability / donor reliability
    const availScore = profile.isAvailable ? 1.0 : 0.0;

    // Multi-criteria overall score (0 - 100)
    const rawScore =
      MATCHING_WEIGHTS.exactMatch * compatibilityScore +
      MATCHING_WEIGHTS.proximity * distanceScore +
      MATCHING_WEIGHTS.recency * recencyScore +
      MATCHING_WEIGHTS.responsiveness * availScore;

    const overallScore = Math.round(rawScore * 100);

    // Generate explainable reason
    const reasonParts = [];
    if (exactMatch) {
      reasonParts.push(`Exact blood group match (${profile.bloodGroup})`);
    } else {
      reasonParts.push(`Clinically compatible universal/alternate donor (${profile.bloodGroup})`);
    }

    reasonParts.push(`located ${distanceKm} km away`);

    if (elig.daysSinceLastDonation >= 999) {
      reasonParts.push('first-time donor verified medically fit');
    } else {
      reasonParts.push(`fully rested (${elig.daysSinceLastDonation} days since last donation)`);
    }

    if (profile.totalDonations > 0) {
      reasonParts.push(`proven donor history (${profile.totalDonations} completed donations)`);
    }

    const recommendationReason = reasonParts.join(', ') + '.';

    evaluatedCandidates.push({
      profile,
      distanceKm,
      daysSinceLastDonation: elig.daysSinceLastDonation,
      exactMatch,
      coolingOk: elig.eligible,
      compatibilityScore,
      distanceScore,
      recencyScore,
      availScore,
      overallScore,
      recommendationReason
    });
  }

  // 4. Rank remaining candidates by overall score descending, then by distance ascending
  evaluatedCandidates.sort((a, b) => {
    if (b.overallScore !== a.overallScore) {
      return b.overallScore - a.overallScore;
    }
    return a.distanceKm - b.distanceKm;
  });

  // Clear previous matching results for this request to prevent stale duplicates
  await DonorMatchingResult.deleteMany({ requestId: request._id });

  const rankedDonors: RankedDonorMatch[] = [];

  for (let i = 0; i < evaluatedCandidates.length; i++) {
    const candidate = evaluatedCandidates[i];
    const rank = i + 1;
    const user = candidate.profile.userId;

    // Persist explainable match result
    await DonorMatchingResult.create({
      requestId: request._id,
      donorId: user._id,
      compatibilityScore: candidate.compatibilityScore * 100,
      distanceKm: candidate.distanceKm,
      recencyScore: Math.round(candidate.recencyScore * 100),
      overallScore: candidate.overallScore,
      rank,
      recommendationReason: candidate.recommendationReason,
      matchFactors: {
        bloodMatch: true,
        exactMatch: candidate.exactMatch,
        distanceMatch: true,
        coolingPeriodOk: candidate.coolingOk,
        availabilityOk: candidate.profile.isAvailable
      },
      status: 'suggested'
    });

    rankedDonors.push({
      donorId: user._id.toString(),
      donorName: user.name,
      donorEmail: candidate.profile.consentContact ? user.email : 'Protected (Consent required)',
      donorPhone: candidate.profile.consentContact ? user.phone : 'Protected (Consent required)',
      bloodGroup: candidate.profile.bloodGroup,
      city: user.city,
      distanceKm: candidate.distanceKm,
      lastDonationDate: candidate.profile.lastDonationDate,
      daysSinceLastDonation: candidate.daysSinceLastDonation,
      totalDonations: candidate.profile.totalDonations,
      isAvailable: candidate.profile.isAvailable,
      canDonate: candidate.profile.healthStatus.canDonate,
      compatibilityScore: Math.round(candidate.compatibilityScore * 100),
      recencyScore: Math.round(candidate.recencyScore * 100),
      distanceScore: Math.round(candidate.distanceScore * 100),
      overallScore: candidate.overallScore,
      rank,
      recommendationReason: candidate.recommendationReason,
      matchFactors: {
        bloodMatch: true,
        exactMatch: candidate.exactMatch,
        distanceMatch: true,
        coolingPeriodOk: candidate.coolingOk,
        availabilityOk: candidate.profile.isAvailable
      },
      consentContact: candidate.profile.consentContact
    });
  }

  // Update request with matched candidate IDs
  request.matchedDonorIds = rankedDonors.map((d) => d.donorId as any);
  if (request.status === 'pending' && rankedDonors.length > 0) {
    request.status = 'matched';
    request.statusHistory.push({
      status: 'matched',
      changedAt: new Date(),
      note: `Matching engine identified ${rankedDonors.length} compatible candidates.`
    });
  }
  await request.save();

  // Search participating blood bank inventory for compatible available units
  const bloodBanks = await BloodBank.find({ status: 'active' });
  const nearbyBloodBankInventory: MatchingEngineResult['nearbyBloodBankInventory'] = [];

  for (const bank of bloodBanks) {
    const [bankLng, bankLat] = bank.location?.coordinates || [77.5946, 12.9716];
    const dist = calculateHaversineDistanceKm(hospLat, hospLng, bankLat, bankLng);

    // Find available, non-expired units in compatible groups
    const availableUnits = await BloodInventoryUnit.find({
      bloodBankId: bank._id,
      bloodGroup: { $in: compatibleGroups },
      component: component,
      status: 'available',
      expiryDate: { $gt: new Date() }
    });

    if (availableUnits.length > 0) {
      nearbyBloodBankInventory.push({
        bloodBankId: bank._id.toString(),
        bloodBankName: bank.name,
        contactPhone: bank.contactPhone,
        address: `${bank.address}, ${bank.city}`,
        distanceKm: dist,
        availableUnitsCount: availableUnits.length,
        unitIds: availableUnits.map((u) => u._id.toString())
      });
    }
  }

  // Sort inventory by distance
  nearbyBloodBankInventory.sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    requestId: request._id.toString(),
    requestedBloodGroup: bloodGroup,
    requestedComponent: component,
    unitsNeeded,
    urgencyLevel,
    compatibleDonorGroups: compatibleGroups,
    totalEligibleDonorsFound: rankedDonors.length,
    rankedDonors,
    nearbyBloodBankInventory,
    disclaimer: CLINICAL_DISCLAIMER
  };
};
