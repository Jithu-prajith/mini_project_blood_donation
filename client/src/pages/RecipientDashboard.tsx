import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Droplet,
  Search,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import api from '../services/api';
import { BloodRequest } from '../types';
import { BloodDropBadge } from '../components/BloodDropBadge';
import { StatCard } from '../components/StatCard';
import { getUrgencyBadge, getStatusBadge, formatDate } from '../utils/compatibility';

export const RecipientDashboard: React.FC = () => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests/my-requests');
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error('Error fetching recipient requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const total = requests.length;
  const pending = requests.filter((r) => r.status === 'pending' || r.status === 'matched').length;
  const fulfilled = requests.filter((r) => r.status === 'fulfilled').length;
  const emergency = requests.filter((r) => r.urgencyLevel === 'emergency').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Recipient Blood Coordination Hub</h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit, track, and coordinate blood requests with verified donors and regional blood banks
          </p>
        </div>
        <Link
          to="/create-request"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all hover:scale-105"
        >
          <PlusCircle size={16} />
          <span>New Blood Request</span>
        </Link>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={total} subtitle="Submitted coordination requests" icon={Heart} color="blue" />
        <StatCard title="Active / Pending" value={pending} subtitle="In matching or allocation" icon={Clock} color="amber" />
        <StatCard title="Fulfilled Units" value={fulfilled} subtitle="Successfully transfused / allocated" icon={CheckCircle2} color="emerald" />
        <StatCard title="Emergency Requests" value={emergency} subtitle="Critical urgency priority" icon={AlertTriangle} color="red" />
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-bold text-sm text-slate-900">Your Submitted Blood Requests</h2>
          <span className="text-xs text-slate-500">{requests.length} total request(s)</span>
        </div>

        {loading ? (
          <div className="text-center py-8 space-y-2">
            <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500">Loading your requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center">
              <Droplet size={24} className="fill-current" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">No blood requests submitted yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              If a patient requires blood components, submit a request to automatically discover compatible donors and nearby inventory.
            </p>
            <Link
              to="/create-request"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs"
            >
              <PlusCircle size={14} /> Submit Request
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((req) => {
              const urgBadge = getUrgencyBadge(req.urgencyLevel);
              const statBadge = getStatusBadge(req.status);

              return (
                <div key={req._id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <BloodDropBadge group={req.bloodGroup} size="md" />
                      <h3 className="font-bold text-sm text-slate-900">{req.patientName}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${urgBadge.className}`}>
                        {urgBadge.label}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statBadge.bg}`}>
                        {statBadge.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Hospital: <strong>{req.hospitalName}</strong></span>
                      <span>&bull;</span>
                      <span>Component: <strong>{req.component}</strong></span>
                      <span>&bull;</span>
                      <span>Required By: <strong>{formatDate(req.requiredByDate)}</strong></span>
                      <span>&bull;</span>
                      <span>Progress: <strong className="text-slate-900">{req.unitsFulfilled} / {req.unitsNeeded} units</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/matching/${req._id}`}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span>AI Matching Results</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
