import {
  getCompatibleDonorGroups,
  isDonorCompatible,
  checkDonationEligibility,
  calculateHaversineDistanceKm
} from '../services/compatibilityService';
import { connectDB } from '../config/db';
import { BloodRequest, BloodInventoryUnit, User } from '../models';
import { runDonorMatchingEngine } from '../services/matchingEngine';
import { reserveUnitsForRequest, updateExpiredUnits } from '../services/inventoryService';

export const runTests = async () => {
  console.log('======================================================');
  console.log('   HEMAMATCH TEST SUITE: CLINICAL VERIFICATION TESTS  ');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  };

  // --- 1. ABO/Rh RBC Compatibility Tests ---
  console.log('--- Suite 1: ABO/Rh RBC Compatibility ---');
  const oNegCompatible = getCompatibleDonorGroups('O-', 'Whole Blood');
  assert(
    oNegCompatible.length === 1 && oNegCompatible[0] === 'O-',
    'O- Whole Blood recipient can ONLY receive O- donors'
  );

  const abPosCompatible = getCompatibleDonorGroups('AB+', 'Red Blood Cells');
  assert(
    abPosCompatible.length === 8,
    'AB+ is universal recipient for Red Blood Cells (all 8 groups allowed)'
  );

  assert(
    !isDonorCompatible('A+', 'B+', 'Red Blood Cells'),
    'A+ donor is NOT compatible with B+ recipient for Red Blood Cells'
  );

  assert(
    isDonorCompatible('O-', 'A+', 'Red Blood Cells'),
    'O- (universal donor) IS compatible with A+ recipient for Red Blood Cells'
  );

  // --- 2. Plasma Inverted Compatibility Tests ---
  console.log('\n--- Suite 2: Plasma (FFP) Inverted Compatibility ---');
  const oPlasmaDonors = getCompatibleDonorGroups('O+', 'Fresh Frozen Plasma');
  assert(
    oPlasmaDonors.length === 8,
    'O+ recipient can receive Plasma from all 8 groups (Universal Plasma Recipient)'
  );

  const abPlasmaDonors = getCompatibleDonorGroups('AB+', 'Fresh Frozen Plasma');
  assert(
    abPlasmaDonors.includes('AB+') && !abPlasmaDonors.includes('O+'),
    'AB+ recipient can ONLY receive AB plasma (not O plasma)'
  );

  // --- 3. Medical Cooling-Off / Interval Eligibility ---
  console.log('\n--- Suite 3: Medical Cooling-Off Period ---');
  const now = new Date();
  const date40DaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
  const date80DaysAgo = new Date(now.getTime() - 80 * 24 * 60 * 60 * 1000);

  const elig40 = checkDonationEligibility(date40DaysAgo, 'Whole Blood');
  assert(
    elig40.eligible === false && elig40.remainingDays === 16,
    'Donor at 40 days is INELIGIBLE (< 56 days) with 16 remaining days'
  );

  const elig80 = checkDonationEligibility(date80DaysAgo, 'Whole Blood');
  assert(
    elig80.eligible === true && elig80.remainingDays === 0,
    'Donor at 80 days is ELIGIBLE (>= 56 days)'
  );

  // --- 4. Haversine Distance Accuracy ---
  console.log('\n--- Suite 4: Geographic Distance (Haversine) ---');
  // Distance between Bangalore City Center (12.9716, 77.5946) and Indiranagar (12.9784, 77.6412) ~ 5.1 km
  const dist = calculateHaversineDistanceKm(12.9716, 77.5946, 12.9784, 77.6412);
  assert(dist >= 4.5 && dist <= 5.8, `Haversine calculated ${dist} km (expected ~5.1 km)`);

  // --- 5. Database Integration & Matching Engine ---
  console.log('\n--- Suite 5: Database & Matching Engine ---');
  try {
    await connectDB();

    // Check emergency request matching
    const sampleReq = await BloodRequest.findOne({ urgencyLevel: 'emergency' });
    if (sampleReq) {
      const matchResult = await runDonorMatchingEngine(sampleReq._id.toString());
      assert(
        matchResult.rankedDonors.length > 0,
        `Matching engine found ${matchResult.rankedDonors.length} eligible candidates for request #${sampleReq._id.toString().slice(-6)}`
      );

      // Verify top candidate has highest overall score
      if (matchResult.rankedDonors.length > 1) {
        assert(
          matchResult.rankedDonors[0].overallScore >= matchResult.rankedDonors[1].overallScore,
          'Candidates are sorted in descending order of overall ranking score'
        );
      }
    }

    // --- 6. Inventory Safety & Atomic Reservation ---
    console.log('\n--- Suite 6: Inventory Safety & Atomic Reservation ---');
    const availableUnit = await BloodInventoryUnit.findOne({
      status: 'available',
      expiryDate: { $gt: now }
    });

    if (availableUnit && sampleReq) {
      const admin = await User.findOne({ role: 'admin' });
      const reserveRes = await reserveUnitsForRequest(
        sampleReq._id.toString(),
        [availableUnit._id.toString()],
        admin!._id.toString()
      );

      assert(reserveRes.success === true, 'Successfully reserved available inventory unit');

      const checkUnit = await BloodInventoryUnit.findById(availableUnit._id);
      assert(checkUnit?.status === 'reserved', "Unit status successfully transitioned to 'reserved'");

      // Try double reservation on already reserved unit
      const doubleReserve = await reserveUnitsForRequest(
        sampleReq._id.toString(),
        [availableUnit._id.toString()],
        admin!._id.toString()
      );
      assert(
        doubleReserve.reservedCount === 0,
        'PREVENTED DOUBLE RESERVATION: Reserved unit cannot be reserved again'
      );
    }
  } catch (err: any) {
    console.error('Database suite error:', err.message);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  return { passed, failed };
};

if (require.main === module) {
  runTests().then((res) => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
