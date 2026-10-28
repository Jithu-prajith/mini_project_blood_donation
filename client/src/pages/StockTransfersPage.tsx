import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, PlusCircle, Building2, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { StockTransfer, TransferRecommendation, BloodBank } from '../types';
import { BloodDropBadge } from '../components/BloodDropBadge';
import { TransferModal } from '../components/TransferModal';
import { formatDate } from '../utils/compatibility';

export const StockTransfersPage: React.FC = () => {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [recommendations, setRecommendations] = useState<TransferRecommendation[]>([]);
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchTransferData = async () => {
    try {
      setLoading(true);
      const [transRes, recRes, banksRes] = await Promise.all([
        api.get('/transfers'),
        api.get('/transfers/recommendations'),
        api.get('/blood-banks')
      ]);

      if (transRes.data.success) setTransfers(transRes.data.transfers || []);
      if (recRes.data.success) setRecommendations(recRes.data.recommendations || []);
      if (banksRes.data.success) setBloodBanks(banksRes.data.bloodBanks || []);
    } catch (err) {
      console.error('Error fetching transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransferData();
  }, []);

  const handleUpdateStatus = async (transferId: string, status: string) => {
    try {
      const res = await api.patch(`/transfers/${transferId}/status`, { status });
      if (res.data.success) {
        setFeedback(`Transfer status updated to ${status}.`);
        await fetchTransferData();
      }
    } catch (err: any) {
      setFeedback('Status update failed.');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-100 text-red-600">
              <ArrowLeftRight size={20} />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Inter-Bank Stock Transfer Logistics</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rebalance blood inventory between surplus facilities and critical shortage centers
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 flex items-center gap-1.5 shrink-0"
        >
          <PlusCircle size={14} />
          <span>New Transfer</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold">&times;</button>
        </div>
      )}

      {/* AI Transfer Recommendations Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-bold text-sm text-slate-900">AI Rebalancing Recommendations</h2>
            <p className="text-xs text-slate-500">
              Algorithmic suggestions matching surplus blood banks with regional centers facing deficit
            </p>
          </div>
          <span className="text-xs text-red-600 font-bold">{recommendations.length} Active Suggestions</span>
        </div>

        {recommendations.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            All blood bank inventories are currently balanced within acceptable regional buffers.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BloodDropBadge group={rec.bloodGroup} size="sm" />
                    <span className="text-xs font-bold text-slate-900">{rec.component}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Recommend: +{rec.recommendedUnits} Units
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block">From (Surplus)</span>
                    <strong className="text-slate-900">{rec.sourceBankName}</strong>
                    <span className="text-[10px] text-emerald-600 block">Stock: {rec.sourceAvailableStock} units</span>
                  </div>
                  <ArrowRight size={16} className="text-slate-400 shrink-0" />
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">To (Shortage)</span>
                    <strong className="text-slate-900">{rec.targetBankName}</strong>
                    <span className="text-[10px] text-red-600 block">Stock: {rec.targetCurrentStock} units</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed bg-white p-2 rounded-lg border border-slate-200/80">
                  {rec.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active & Historical Transfers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-sm text-slate-900">Transfer Records & Dispatch Status</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-bold text-slate-600">
              <tr>
                <th className="p-3.5">Blood Group</th>
                <th className="p-3.5">Component</th>
                <th className="p-3.5">Quantity</th>
                <th className="p-3.5">Source Facility</th>
                <th className="p-3.5">Target Facility</th>
                <th className="p-3.5">Urgency</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Loading transfer logs...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No inter-bank stock transfers requested yet.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/70">
                    <td className="p-3.5">
                      <BloodDropBadge group={t.bloodGroup} size="sm" />
                    </td>
                    <td className="p-3.5 font-medium text-slate-700">{t.component}</td>
                    <td className="p-3.5 font-bold text-slate-900">{t.quantity} Units</td>
                    <td className="p-3.5 text-slate-600">{t.sourceBankId?.name || 'Regional Bank'}</td>
                    <td className="p-3.5 text-slate-600">{t.targetBankId?.name || 'Target Facility'}</td>
                    <td className="p-3.5 uppercase font-bold text-[10px] text-amber-600">{t.urgencyLevel}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-semibold capitalize">
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {t.status === 'requested' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(t._id, 'approved')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px]"
                        >
                          Approve
                        </button>
                      )}
                      {t.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(t._id, 'in_transit')}
                          className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-[11px]"
                        >
                          Dispatch
                        </button>
                      )}
                      {t.status === 'in_transit' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(t._id, 'received')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                        >
                          Mark Received
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransferModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setFeedback('Transfer request recorded successfully!');
          fetchTransferData();
        }}
        bloodBanks={bloodBanks}
      />
    </div>
  );
};
