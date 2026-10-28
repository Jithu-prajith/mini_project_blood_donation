import { BloodGroup, BloodComponent, UrgencyLevel, RequestStatus } from '../types';

export const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
export const BLOOD_COMPONENTS: BloodComponent[] = [
  'Whole Blood',
  'Red Blood Cells',
  'Platelets',
  'Fresh Frozen Plasma',
  'Cryoprecipitate'
];

export const RBC_COMPATIBILITY_MAP: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
};

export const getUrgencyBadge = (urgency: UrgencyLevel) => {
  switch (urgency) {
    case 'emergency':
      return {
        label: 'EMERGENCY (< 1h)',
        className: 'bg-red-600 text-white animate-pulse font-semibold shadow-red-200 shadow-sm'
      };
    case 'urgent':
      return {
        label: 'URGENT (< 4h)',
        className: 'bg-amber-500 text-white font-medium'
      };
    case 'routine':
    default:
      return {
        label: 'ROUTINE (< 24h)',
        className: 'bg-slate-200 text-slate-800'
      };
  }
};

export const getStatusBadge = (status: RequestStatus) => {
  switch (status) {
    case 'pending':
      return { label: 'Pending Match', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'matched':
      return { label: 'Donors Matched', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'partially_fulfilled':
      return { label: 'Partially Fulfilled', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'fulfilled':
      return { label: 'Fulfilled', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-slate-100 text-slate-600 border-slate-200' };
    case 'expired':
      return { label: 'Expired', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: status, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
};

export const formatDate = (dateStr?: string | Date) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatDateTime = (dateStr?: string | Date) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
