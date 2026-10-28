import React, { useState, useEffect } from 'react';
import { User, Droplet, ShieldCheck, MapPin, Phone, Mail, Save, Building2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BloodGroup } from '../types';
import { BLOOD_GROUPS } from '../utils/compatibility';

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || 'Bangalore');
  const [state, setState] = useState(user?.state || 'Karnataka');

  // Donor attributes
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>((profile as any)?.bloodGroup || 'O+');
  const [weightKg, setWeightKg] = useState<number>((profile as any)?.weightKg || 65);
  const [isAvailable, setIsAvailable] = useState<boolean>((profile as any)?.isAvailable ?? true);
  const [consentContact, setConsentContact] = useState<boolean>((profile as any)?.consentContact ?? true);
  const [preferredRadiusKm, setPreferredRadiusKm] = useState<number>((profile as any)?.preferredRadiusKm || 30);

  // Blood bank attributes
  const [alertThreshold, setAlertThreshold] = useState<number>((profile as any)?.alertThresholdPerGroup || 5);
  const [operatingHours, setOperatingHours] = useState<string>((profile as any)?.operatingHours || '24/7');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
      setCity(user.city);
      setState(user.state);
    }
    if (profile) {
      if (user?.role === 'donor') {
        const dp = profile as any;
        setBloodGroup(dp.bloodGroup || 'O+');
        setWeightKg(dp.weightKg || 65);
        setIsAvailable(dp.isAvailable ?? true);
        setConsentContact(dp.consentContact ?? true);
        setPreferredRadiusKm(dp.preferredRadiusKm || 30);
      } else if (user?.role === 'blood_bank') {
        const bp = profile as any;
        setAlertThreshold(bp.alertThresholdPerGroup || 5);
        setOperatingHours(bp.operatingHours || '24/7');
      }
    }
  }, [user, profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (user?.role === 'donor') {
        await api.put('/donors/profile', {
          bloodGroup,
          weightKg,
          isAvailable,
          consentContact,
          preferredRadiusKm,
          city,
          state
        });
      } else if (user?.role === 'blood_bank' && profile) {
        await api.put(`/blood-banks/${(profile as any)._id}`, {
          alertThresholdPerGroup: alertThreshold,
          operatingHours
        });
      }

      await refreshUser();
      setFeedback('Profile settings updated successfully!');
    } catch (err: any) {
      setFeedback('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Profile & Operational Preferences</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal contact details, privacy consent, and role configurations
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider">
          {user?.role.replace('_', ' ')}
        </span>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold">&times;</button>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        {/* Core Account Details */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Account Credentials</h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                disabled
                value={name}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5"
              />
            </div>
          </div>
        </div>

        {/* Donor Preferences */}
        {user?.role === 'donor' && (
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Donor Medical & Match Settings</h2>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="w-full rounded-xl border border-slate-300 p-2 bg-white font-bold"
                >
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  min="45"
                  max="150"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Travel Radius (km)</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={preferredRadiusKm}
                  onChange={(e) => setPreferredRadiusKm(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-2"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Actively available for emergency matching notifications
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentContact}
                  onChange={(e) => setConsentContact(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Consent to share phone/email with verified clinical coordinators
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Blood Bank Settings */}
        {user?.role === 'blood_bank' && (
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Blood Bank Operational Thresholds</h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Low-Stock Alert Level (Units / Group)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2"
                />
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
