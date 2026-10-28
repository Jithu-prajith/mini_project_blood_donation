import {
  BloodGroup,
  BloodComponent,
  RBC_COMPATIBILITY,
  PLASMA_COMPATIBILITY,
  PLATELET_COMPATIBILITY,
  MIN_DONATION_INTERVAL_DAYS
} from '../config/constants';

/**
 * Returns list of compatible donor blood groups for a given recipient blood group & component
 */
export const getCompatibleDonorGroups = (
  recipientGroup: BloodGroup,
  component: BloodComponent
): BloodGroup[] => {
  switch (component) {
    case 'Fresh Frozen Plasma':
    case 'Cryoprecipitate':
      return PLASMA_COMPATIBILITY[recipientGroup] || [recipientGroup];
    case 'Platelets':
      return PLATELET_COMPATIBILITY[recipientGroup] || [recipientGroup];
    case 'Whole Blood':
    case 'Red Blood Cells':
    default:
      return RBC_COMPATIBILITY[recipientGroup] || [recipientGroup];
  }
};

/**
 * Checks if a specific donor blood group is compatible with recipient blood group for a component
 */
export const isDonorCompatible = (
  donorGroup: BloodGroup,
  recipientGroup: BloodGroup,
  component: BloodComponent
): boolean => {
  const compatibleList = getCompatibleDonorGroups(recipientGroup, component);
  return compatibleList.includes(donorGroup);
};

/**
 * Verifies cooling-off / rest interval between donations
 */
export const checkDonationEligibility = (
  lastDonationDate?: Date,
  component: BloodComponent = 'Whole Blood'
): { eligible: boolean; daysSinceLastDonation: number; daysRequired: number; remainingDays: number } => {
  const daysRequired = MIN_DONATION_INTERVAL_DAYS[component] || 56;

  if (!lastDonationDate) {
    return {
      eligible: true,
      daysSinceLastDonation: 999,
      daysRequired,
      remainingDays: 0
    };
  }

  const now = new Date();
  const diffTime = Math.abs(now.getTime() - new Date(lastDonationDate).getTime());
  const daysSinceLastDonation = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, daysRequired - daysSinceLastDonation);

  return {
    eligible: daysSinceLastDonation >= daysRequired,
    daysSinceLastDonation,
    daysRequired,
    remainingDays
  };
};

/**
 * Calculates Great-Circle distance between two coordinates in kilometers using Haversine formula
 */
export const calculateHaversineDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};
