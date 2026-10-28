import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Clock,
  Heart,
  Droplet,
  Send,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ShieldAlert,
  ChevronRight,
  Phone,
  Mail,
  Package
} from 'lucide-react';
import api from '../services/api';
import { MatchingEngineResponse, BloodRequest } from '../types';
import { BloodDropBadge } from '../components/BloodDropBadge';
import { MapViewer } from '../components/MapViewer';
import { ClinicalDisclaimer } from '../components/ClinicalDisclaimer';
import { getUrgencyBadge, getStatusBadge } from '../utils/compatibility';

export const DonorMatchingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [matchingData, setMatchingData] = useState<MatchingEngineResponse | null>(null);
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactingDonorId, setContactingDonorId] = useState<string | null>(null);
  const [reservingUnitId, setReservingUnitId] = useState<string | null>(null);
  const [escalating, setEscalating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMatchingResults = async () => {
    try {
      setLoading(true);
      const [matchRes, reqRes] = await Promise.all([
        api.get(`/matching/${id}?radiusKm=60`),
        api.get(`/requests/${id}`)
      ]);

      if (matchRes.data.success) {
        setMatchingData(matchRes.data);
      }
      if (reqRes.data.success) {
        setRequest(reqRes.data.request);
      }
    } catch (err: any) {
      console.error('Error loading matching candidates:', err);
      setFeedbackMsg({ type: 'error', text: 'Could not load matching results.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchMatchingResults();
  }, [id]);

  const handleContactDonor = async (donorId: string) => {
    try {
      setContactingDonorId(donorId);
      const res = await api.post('/matching/contact', {
        requestId: id,
        donorId
      });
      if (res.data.success) {
        setFeedbackMsg({ type: 'success', text: 'Contact notification dispatched to donor!' });
        await fetchMatchingResults();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || 'Failed to contact donor.' });
    } finally {
      setContactingDonorId(null);
    }
  };

  const handleReserveInventoryUnit = async (unitId: string) => {
    try {
      setReservingUnitId(unitId);
      const res = await api.post('/inventory/reserve', {
        requestId: id,
        unitIds: [unitId]
      });
      if (res.data.success) {
        setFeedbackMsg({ type: 'success', text: res.data.message || 'Unit reserved successfully!' });
        await fetchMatchingResults();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || 'Failed to reserve unit.' });
    } finally {
      setReservingUnitId(null);
    }
  };

  const handleEscalate = async () => {
    if (!window.confirm('Escalate this request to Regional Multi-Bank Emergency Broadcast?')) return;
    try {
      setEscalating(true);
      const res = await api.post(`/requests/${id}/escalate`);
      if (res.data.success) {
        setFeedbackMsg({ type: 'success', text: 'Emergency escalation broadcast sent to all regional banks & donors!' });
        await fetchMatchingResults();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || 'Escalation failed.' });
    } finally {
      setEscalating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Running explainable AI donor matching algorithm...</p>
        </div>
      </div>
    );
  }

  if (!matchingData || !request) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-sm text-slate-500">Blood request could not be found.</p>
        <Link to="/recipient-dashboard" className="text-xs font-semibold text-red-600">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  const urgBadge = getUrgencyBadge(request.urgencyLevel);
  const statBadge = getStatusBadge(request.status);
  const [hospLng, hospLat] = request.hospitalLocation?.coordinates || [77.5946, 12.9716];

  // Map locations: Hospital + Matched Donors + Nearby Blood Banks
  const mapLocations: any[] = [
    {
      id: 'hosp',
      lat: hospLat,
      lng: hospLng,
      title: request.hospitalName,
      subtitle: `Patient: ${request.patientName}`,
      type: 'hospital',
      bloodGroup: request.bloodGroup
    }
  ];

  matchingData.rankedDonors.slice(0, 8).forEach((d) => {
    // Offset slightly for demo map markers if precise coords are identical
    mapLocations.push({
      id: d.donorId,
      lat: hospLat + (d.distanceKm * 0.007) * (d.rank % 2 === 0 ? 1 : -1),
      lng: hospLng + (d.distanceKm * 0.007) * (d.rank % 3 === 0 ? 1 : -1),
      title: d.donorName,
      subtitle: `${d.distanceKm} km away • Score: ${d.overallScore}/100`,
      type: 'donor',
      bloodGroup: d.bloodGroup,
      rank: d.rank
    });
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/recipient-dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={14} /> Back to Requests
        </Link>
        <span className="text-xs text-slate-400 font-mono">REQ ID: #{request._id.slice(-6).toUpperCase()}</span>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs font-bold px-2">
            &times;
          </button>
        </div>
      )}

      {/* Request Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BloodDropBadge group={request.bloodGroup} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{request.patientName}</h1>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full ${urgBadge.className}`}>
                  {urgBadge.label}
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${statBadge.bg}`}>
                  {statBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <MapPin size={13} /> {request.hospitalName} &bull; Component: <strong>{request.component}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {request.status !== 'fulfilled' && (
              <button
                type="button"
                onClick={handleEscalate}
                disabled={escalating}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 flex items-center gap-1.5 transition-colors"
              >
                <AlertTriangle size={14} />
                <span>{escalating ? 'Escalating...' : 'Emergency Escalate'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Units Needed</span>
            <span className="font-bold text-slate-900 text-sm">{request.unitsNeeded} Units</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Units Allocated / Fulfilled</span>
            <span className="font-bold text-emerald-600 text-sm">{request.unitsFulfilled} Units</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Emergency Contact</span>
            <span className="font-bold text-slate-900 text-sm">{request.contactNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Compatible Donor Groups</span>
            <span className="font-bold text-red-600 text-xs">
              {matchingData.compatibleDonorGroups.join(', ')}
            </span>
          </div>
        </div>
      </div>

      <ClinicalDisclaimer />

      {/* Geographical Map of Hospital & Candidates */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Geographical Candidate & Resource Visualization
          </h2>
          <span className="text-xs text-slate-500">Search Radius: 50 km</span>
        </div>
        <MapViewer
          center={[hospLat, hospLng]}
          zoom={12}
          locations={mapLocations}
          highlightRadiusKm={30}
          height="320px"
        />
      </div>

      {/* Main Matching Results List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-100 text-red-600">
              <Sparkles size={16} />
            </span>
            <h2 className="font-bold text-sm text-slate-900">
              Ranked Compatible Donor Candidates ({matchingData.totalEligibleDonorsFound})
            </h2>
          </div>
          <span className="text-xs text-slate-500">Ranked by Transparent Weighted AI Engine</span>
        </div>

        {matchingData.rankedDonors.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <AlertTriangle size={32} className="text-amber-500 mx-auto" />
            <h3 className="font-bold text-sm text-slate-900">No matching donors in direct radius</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Consider using the "Emergency Escalate" button above to broadcast an urgent regional alert across all participating blood centers.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matchingData.rankedDonors.map((donor) => {
              const isExact = donor.bloodGroup === request.bloodGroup;

              return (
                <div
                  key={donor.donorId}
                  className="p-4 rounded-xl border border-slate-200 hover:border-red-300 bg-white shadow-2xs hover:shadow-xs transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                        #{donor.rank}
                      </div>
                      <BloodDropBadge group={donor.bloodGroup} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900">{donor.donorName}</h3>
                          {isExact ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-50 text-red-700 font-semibold border border-red-200">
                              Exact Match
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                              Compatible Alternate
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <MapPin size={12} /> {donor.distanceKm} km away &bull; {donor.city}
                        </p>
                      </div>
                    </div>

                    {/* Matching Score Badge */}
                    <div className="flex items-center gap-3 sm:justify-end">
                      <div className="text-right">
                        <span className="text-lg font-black text-slate-900">{donor.overallScore}</span>
                        <span className="text-xs text-slate-400 font-normal"> / 100</span>
                        <span className="block text-[10px] text-slate-500">Matching Score</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleContactDonor(donor.donorId)}
                        disabled={contactingDonorId === donor.donorId}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                      >
                        <Send size={13} />
                        <span>{contactingDonorId === donor.donorId ? 'Sending...' : 'Alert Donor'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Explainable AI Rationale */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                    <p className="font-semibold text-slate-900 flex items-center gap-1 mb-1">
                      <Sparkles size={13} className="text-amber-500" />
                      <span>Recommendation Rationale:</span>
                    </p>
                    <p className="text-slate-600 leading-relaxed">{donor.recommendationReason}</p>
                  </div>

                  {/* Contact Info (if consent permits) */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-slate-400" /> {donor.donorPhone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail size={12} className="text-slate-400" /> {donor.donorEmail}
                    </span>
                    <span>&bull;</span>
                    <span>Total Donations: <strong>{donor.totalDonations}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Inventory in Nearby Blood Banks */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
              <Building2 size={16} />
            </span>
            <h2 className="font-bold text-sm text-slate-900">
              Nearby Blood Bank Inventory ({matchingData.nearbyBloodBankInventory.length} Facilities)
            </h2>
          </div>
          <span className="text-xs text-slate-500">Verified Compatible Stored Units</span>
        </div>

        {matchingData.nearbyBloodBankInventory.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">
            No compatible units currently in stock at nearby participating blood banks.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchingData.nearbyBloodBankInventory.map((bank) => (
              <div
                key={bank.bloodBankId}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">{bank.bloodBankName}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
                      {bank.availableUnitsCount} Unit(s) Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin size={12} /> {bank.address} &bull; {bank.distanceKm} km away
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Phone size={12} /> {bank.contactPhone}
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleReserveInventoryUnit(bank.unitIds[0])}
                    disabled={reservingUnitId === bank.unitIds[0]}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Package size={13} />
                    <span>{reservingUnitId === bank.unitIds[0] ? 'Reserving...' : 'Reserve 1 Unit'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
