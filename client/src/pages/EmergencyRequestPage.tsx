import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  Heart,
  Droplet,
  MapPin,
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Phone
} from 'lucide-react';
import api from '../services/api';
import { BloodRequest, UrgencyLevel } from '../types';
import { BloodDropBadge } from '../components/BloodDropBadge';
import { StatCard } from '../components/StatCard';
import { getUrgencyBadge, getStatusBadge, formatDate } from '../utils/compatibility';

export const EmergencyRequestPage: React.FC = () => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests');
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error('Failed to load emergency requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleEscalate = async (requestId: string) => {
    try {
      const res = await api.post(`/requests/${requestId}/escalate`);
      if (res.data.success) {
        setFeedback('Emergency escalation broadcast dispatched to all regional centers!');
        await fetchRequests();
      }
    } catch (err: any) {
      setFeedback('Failed to escalate request.');
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      const res = await api.patch(`/requests/${requestId}/status`, { status: newStatus });
      if (res.data.success) {
        setFeedback(`Request status updated to ${newStatus}.`);
        await fetchRequests();
      }
    } catch (err) {
      setFeedback('Status update failed.');
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (urgencyFilter !== 'all' && r.urgencyLevel !== urgencyFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!r.patientName.toLowerCase().includes(term) && !r.hospitalName.toLowerCase().includes(term)) {
        return false;
      }
    }
    return true;
  });

  const emergencyCount = requests.filter((r) => r.urgencyLevel === 'emergency' && r.status !== 'fulfilled').length;
  const urgentCount = requests.filter((r) => r.urgencyLevel === 'urgent' && r.status !== 'fulfilled').length;
  const unfulfilledCount = requests.filter((r) => r.status === 'pending' || r.status === 'matched').length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-100 text-red-600">
              <AlertTriangle size={18} />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Emergency Blood Coordination Command</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracking of high-priority blood needs, regional escalations, and donor matching
          </p>
        </div>

        <Link
          to="/create-request"
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 flex items-center gap-2 transition-colors shrink-0"
        >
          <span>Submit Emergency Request</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold">&times;</button>
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Emergencies (< 1h)"
          value={emergencyCount}
          subtitle="Immediate clinical response required"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Urgent Surgeries (< 4h)"
          value={urgentCount}
          subtitle="Pre-transfusion crossmatch required"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Total Unfulfilled"
          value={unfulfilledCount}
          subtitle="Requests actively awaiting complete units"
          icon={Heart}
          color="blue"
        />
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-52">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patient or hospital..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-red-500"
            />
          </div>

          {/* Urgency */}
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-2.5 py-1.5 bg-white font-medium"
          >
            <option value="all">All Urgency Levels</option>
            <option value="emergency">Emergency (&lt; 1h)</option>
            <option value="urgent">Urgent (&lt; 4h)</option>
            <option value="routine">Routine (&lt; 24h)</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-2.5 py-1.5 bg-white font-medium capitalize"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="matched">Matched</option>
            <option value="partially_fulfilled">Partially Fulfilled</option>
            <option value="fulfilled">Fulfilled</option>
          </select>
        </div>

        <span className="text-slate-500 font-medium">
          Showing <strong>{filteredRequests.length}</strong> active requests
        </span>
      </div>

      {/* Requests Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Refreshing emergency stream...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-900">No matching requests found</p>
            <p className="text-xs text-slate-500 mt-0.5">All clinical blood requests have been fulfilled or filtered.</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const urgBadge = getUrgencyBadge(req.urgencyLevel);
            const statBadge = getStatusBadge(req.status);
            const isUnfulfilled = req.status !== 'fulfilled' && req.status !== 'cancelled';

            return (
              <div
                key={req._id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all space-y-3 ${
                  req.urgencyLevel === 'emergency'
                    ? 'border-red-300 ring-1 ring-red-400/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BloodDropBadge group={req.bloodGroup} size="lg" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">{req.patientName}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${urgBadge.className}`}>
                          {urgBadge.label}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statBadge.bg}`}>
                          {statBadge.label}
                        </span>
                        {req.escalationLevel > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                            Escalation Level {req.escalationLevel}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <MapPin size={12} className="text-slate-400" />
                        <span>{req.hospitalName} &bull; Component: <strong>{req.component}</strong></span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:justify-end">
                    <Link
                      to={`/matching/${req._id}`}
                      className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>AI Matching & Inventory</span>
                      <ArrowRight size={13} />
                    </Link>

                    {isUnfulfilled && (
                      <button
                        type="button"
                        onClick={() => handleEscalate(req._id)}
                        className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Escalate
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Required Units</span>
                    <span className="font-bold text-slate-900">{req.unitsNeeded} Units</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Fulfilled Progress</span>
                    <span className="font-bold text-emerald-600">{req.unitsFulfilled} / {req.unitsNeeded}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Contact Phone</span>
                    <span className="font-bold text-slate-900">{req.contactNumber}</span>
                  </div>
                  <div className="flex items-center justify-end">
                    <select
                      value={req.status}
                      onChange={(e) => handleUpdateStatus(req._id, e.target.value)}
                      className="text-xs font-semibold rounded-lg border border-slate-300 p-1 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="matched">Matched</option>
                      <option value="partially_fulfilled">Partially Fulfilled</option>
                      <option value="fulfilled">Fulfilled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {req.medicalNotes && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                    Notes: {req.medicalNotes}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
