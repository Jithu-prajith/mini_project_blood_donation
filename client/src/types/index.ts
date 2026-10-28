export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type BloodComponent = 'Whole Blood' | 'Red Blood Cells' | 'Platelets' | 'Fresh Frozen Plasma' | 'Cryoprecipitate';
export type UrgencyLevel = 'emergency' | 'urgent' | 'routine';
export type RequestStatus = 'pending' | 'matched' | 'partially_fulfilled' | 'fulfilled' | 'cancelled' | 'expired';
export type InventoryStatus = 'available' | 'reserved' | 'issued' | 'expired' | 'quarantined' | 'discarded';
export type UserRole = 'donor' | 'recipient' | 'blood_bank' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  city: string;
  state: string;
  location?: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  isVerified: boolean;
}

export interface DonorProfile {
  _id: string;
  userId: string | User;
  bloodGroup: BloodGroup;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  weightKg: number;
  lastDonationDate?: string;
  totalDonations: number;
  isAvailable: boolean;
  healthStatus: {
    canDonate: boolean;
    reason?: string;
    hemoglobin?: number;
  };
  consentContact: boolean;
  preferredRadiusKm: number;
}

export interface RecipientProfile {
  _id: string;
  userId: string;
  hospitalName?: string;
  defaultDeliveryAddress?: string;
  contactPerson?: string;
  emergencyPhone?: string;
}

export interface BloodBank {
  _id: string;
  userId: string;
  name: string;
  licenseNumber: string;
  storageCapacityUnits: number;
  operatingHours: string;
  contactPhone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  status: 'active' | 'pending' | 'suspended';
  alertThresholdPerGroup: number;
  distanceKm?: number;
}

export interface BloodInventoryUnit {
  _id: string;
  unitIdentifier: string;
  bloodBankId: string | BloodBank;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  collectionDate: string;
  expiryDate: string;
  volumeMl: number;
  status: InventoryStatus;
  storageLocation: {
    freezerId: string;
    shelfNumber: string;
  };
  reservedForRequestId?: any;
  issuedToPatientName?: string;
  discardReason?: string;
  createdAt: string;
}

export interface BloodRequest {
  _id: string;
  requesterId: string | User;
  patientName: string;
  patientAge?: number;
  patientGender?: 'male' | 'female' | 'other';
  bloodGroup: BloodGroup;
  component: BloodComponent;
  unitsNeeded: number;
  unitsFulfilled: number;
  hospitalName: string;
  hospitalLocation: {
    type: string;
    coordinates: [number, number];
  };
  urgencyLevel: UrgencyLevel;
  requiredByDate: string;
  status: RequestStatus;
  contactNumber: string;
  medicalNotes?: string;
  matchedDonorIds: string[];
  reservedUnitIds: any[];
  escalationLevel: number;
  statusHistory: Array<{
    status: RequestStatus;
    changedAt: string;
    changedBy?: any;
    note?: string;
  }>;
  createdAt: string;
}

export interface RankedDonorMatch {
  donorId: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  bloodGroup: BloodGroup;
  city: string;
  distanceKm: number;
  lastDonationDate?: string;
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

export interface MatchingEngineResponse {
  requestId: string;
  requestedBloodGroup: BloodGroup;
  requestedComponent: BloodComponent;
  unitsNeeded: number;
  urgencyLevel: UrgencyLevel;
  compatibleDonorGroups: BloodGroup[];
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

export interface BankStockSummary {
  bankName: string;
  totalAvailableUnits: number;
  totalReservedUnits: number;
  totalQuarantinedUnits: number;
  totalExpiringSoonUnits: number;
  matrix: StockSummaryItem[];
  lowStockAlerts: StockSummaryItem[];
}

export interface StockTransfer {
  _id: string;
  sourceBankId: BloodBank;
  targetBankId: BloodBank;
  unitIds: any[];
  bloodGroup: BloodGroup;
  component: BloodComponent;
  quantity: number;
  urgencyLevel: UrgencyLevel;
  status: 'recommended' | 'requested' | 'approved' | 'in_transit' | 'received' | 'rejected' | 'cancelled';
  transferReason: string;
  dispatchedAt?: string;
  receivedAt?: string;
  createdAt: string;
}

export interface TransferRecommendation {
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

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type:
    | 'request_match'
    | 'status_change'
    | 'shortage_alert'
    | 'expiry_warning'
    | 'emergency_escalation'
    | 'donation_reminder'
    | 'transfer_notice';
  referenceId?: string;
  referenceType?: string;
  isRead: boolean;
  priority: 'high' | 'normal' | 'low';
  createdAt: string;
}

export interface AnalyticsDashboardData {
  horizonDays: number;
  summary: {
    totalStockAvailable: number;
    totalProjectedDemand: number;
    criticalShortageCount: number;
    highRiskShortageCount: number;
    potentialWastageTotal: number;
  };
  shortageRiskMatrix: Array<{
    bloodGroup: BloodGroup;
    component: BloodComponent;
    horizonDays: number;
    currentAvailableStock: number;
    forecastedDemandTotal: number;
    expectedDeficit: number;
    shortageRisk: 'critical' | 'high' | 'moderate' | 'low';
    recommendedReplenishmentUnits: number;
    unitsAtRiskOfWastage: number;
    modelUsed: string;
    evaluationMetrics: { mae: number; rmse: number };
    dailyProjections: Array<{
      date: string;
      predictedDemand: number;
      confidenceLower: number;
      confidenceUpper: number;
    }>;
  }>;
  demandTrendByGroup: Array<{
    bloodGroup: BloodGroup;
    currentStock: number;
    projectedDemand7d: number;
    projectedDemand14d: number;
    projectedDemand30d: number;
    shortageRisk: string;
  }>;
  componentDistribution: Array<{
    component: string;
    stock: number;
    forecast: number;
  }>;
  historicalDailyActivity: Array<{
    date: string;
    requests: number;
    donations: number;
    unitsFulfilled: number;
  }>;
  dataNotice: string;
}
