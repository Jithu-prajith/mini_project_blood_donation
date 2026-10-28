import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Droplet,
  Calendar,
  Clock,
  Heart,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Bell,
  Sliders,
  Check,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BloodDropBadge } from '../components/BloodDropBadge';
import { StatCard } from '../components/StatCard';
import { ClinicalDisclaimer } from '../components/ClinicalDisclaimer';
import { formatDate } from '../utils/compatibility';

export const DonorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [nearbyRequests, setNearbyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchDonorData = async () => {
    try {
      setLoading(true);
      const [profRes, donRes, reqRes] = await Promise.all([
        api.get('/donors/profile'),
        api.get('/donors/donations'),
        api.get('/requests?urgency=emergency')
      ]);

      if (profRes.data.success) {
        setProfileData(profRes.data);
      }
      if (donRes.data.success) {
        setDonations(donRes.data.donations || []);
      }
      if (reqRes.data.success) {
        setNearbyRequests(reqRes.data.requests || []);
      }
    } catch (err) {
      console.error('Error loading donor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonorData();
  }, []);

  const handleToggleAvailability = async () => {
    try {
      setToggling(true);
      const res = await api.patch('/donors/availability');
      if (res.data.success) {
        setProfileData((prev: any) => ({
          ...prev,
          profile: {
            ...prev.profile,
            isAvailable: res.data.isAvailable
          }
        }));
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Loading donor profile & eligibility...</p>
        </div>
      </div>
    );
  }

  const profile = profileData?.profile || {};
  const eligibility = profileData?.eligibility || { eligible: true, daysSinceLastDonation: 999, remainingDays: 0 };
  const isAvailable = profile.isAvailable;
  const daysRequired = eligibility.daysRequired || 56;
  const daysSince = eligibility.daysSinceLastDonation || 0;
  const progressPercent = Math.min(100, Math.round((daysSince / daysRequired) * 100));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center text-white text-xl font-black shadow-md shadow-red-500/20">
            {profile.bloodGroup || 'O+'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> Verified Donor
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <MapPin size={13} /> {user?.city}, {user?.state} &bull; Radius: {profile.preferredRadiusKm || 30} km
            </p>
          </div>
        </div>

        {/* Live Availability Switcher */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-900">
              {isAvailable ? 'Active for Matches' : 'Inactive (Paused)'}
            </p>
            <p className="text-[10px] text-slate-500">
              {isAvailable ? 'Visible to emergency searches' : 'Hidden from match requests'}
            </p>
          </div>
          <button
            type="button"
            disabled={toggling}
            onClick={handleToggleAvailability}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isAvailable ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                isAvailable ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Blood Group"
          value={profile.bloodGroup || 'O+'}
          subtitle={profile.bloodGroup === 'O-' ? 'Universal Donor' : 'Compatible with selected groups'}
          icon={Droplet}
          color="red"
        />
        <StatCard
          title="Total Donations"
          value={`${profile.totalDonations || 0} Units`}
          subtitle="Lives impacted through donation"
          icon={Heart}
          color="emerald"
        />
        <StatCard
          title="Eligibility Status"
          value={eligibility.eligible ? 'Ready to Donate' : `Resting (${eligibility.remainingDays}d)`}
          subtitle={eligibility.eligible ? 'Cooling-off completed' : 'Minimum 56 days cooling interval'}
          icon={CheckCircle2}
          color={eligibility.eligible ? 'blue' : 'amber'}
        />
        <StatCard
          title="Active Emergencies"
          value={nearbyRequests.length}
          subtitle="Regional emergency blood requests"
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Cooling-off Progress Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Cooling-Off Interval Compliance</h2>
            <p className="text-xs text-slate-500">
              Mandatory clinical rest period between whole blood donations (56 days / 8 weeks)
            </p>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              eligibility.eligible ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {eligibility.eligible ? 'Eligible Now' : `${eligibility.remainingDays} Days Remaining`}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                eligibility.eligible ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Last Donation: {formatDate(profile.lastDonationDate) || 'None recorded'}</span>
            <span>{daysSince >= 900 ? 'No prior record (Fit)' : `${daysSince} / ${daysRequired} days`}</span>
          </div>
        </div>
      </div>

      {/* Grid: Live Emergency Alerts & Donation History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Matching Requests */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-100 text-red-600">
                <AlertCircle size={16} />
              </span>
              <h2 className="font-bold text-sm text-slate-900">Live Regional Blood Requests</h2>
            </div>
            <Link to="/emergency-requests" className="text-xs font-semibold text-red-600 hover:text-red-700">
              View All &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {nearbyRequests.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No active critical emergency requests at this moment.
              </p>
            ) : (
              nearbyRequests.slice(0, 3).map((req) => (
                <div
                  key={req._id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-red-200 bg-slate-50/50 hover:bg-white transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BloodDropBadge group={req.bloodGroup} size="sm" />
                      <span className="font-bold text-xs text-slate-900">{req.patientName}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-600 text-white uppercase">
                      {req.urgencyLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <MapPin size={12} className="text-slate-400" />
                    <span>{req.hospitalName} &bull; {req.unitsNeeded} units needed</span>
                  </p>
                  <div className="pt-1 flex justify-end">
                    <Link
                      to={`/matching/${req._id}`}
                      className="text-xs font-bold text-red-600 hover:text-red-700"
                    >
                      Inspect Match Ranking &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Donation History */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                <Calendar size={16} />
              </span>
              <h2 className="font-bold text-sm text-slate-900">Donation History & Certificates</h2>
            </div>
          </div>

          <div className="space-y-3">
            {donations.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-slate-500">No previous donations logged yet.</p>
                <p className="text-[11px] text-slate-400">
                  When you complete a blood donation at any participating center, your record will appear here.
                </p>
              </div>
            ) : (
              donations.map((don) => (
                <div
                  key={don._id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">
                      {don.bloodBankId?.name || 'Regional Blood Center'}
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {formatDate(don.donationDate)} &bull; {don.unitsCollected} unit ({don.component})
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                    Completed
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ClinicalDisclaimer compact />
    </div>
  );
};
