import React, { useState } from 'react';
import { X, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { BloodGroup, BloodComponent, BloodBank } from '../types';
import { BLOOD_GROUPS, BLOOD_COMPONENTS } from '../utils/compatibility';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bloodBanks: BloodBank[];
  defaultValues?: {
    sourceBankId?: string;
    targetBankId?: string;
    bloodGroup?: BloodGroup;
    component?: BloodComponent;
    quantity?: number;
    reason?: string;
  };
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  bloodBanks,
  defaultValues
}) => {
  const [sourceBankId, setSourceBankId] = useState(defaultValues?.sourceBankId || '');
  const [targetBankId, setTargetBankId] = useState(defaultValues?.targetBankId || '');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(defaultValues?.bloodGroup || 'O+');
  const [component, setComponent] = useState<BloodComponent>(defaultValues?.component || 'Whole Blood');
  const [quantity, setQuantity] = useState(defaultValues?.quantity || 2);
  const [urgencyLevel, setUrgencyLevel] = useState<'emergency' | 'urgent' | 'routine'>('urgent');
  const [transferReason, setTransferReason] = useState(defaultValues?.reason || 'Critical shortage rebalancing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceBankId || !targetBankId) {
      setError('Please select both source and target blood banks.');
      return;
    }
    if (sourceBankId === targetBankId) {
      setError('Source and target blood banks cannot be identical.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.post('/transfers', {
        sourceBankId,
        targetBankId,
        bloodGroup,
        component,
        quantity: Number(quantity),
        urgencyLevel,
        transferReason
      });

      if (res.data.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to dispatch stock transfer request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-red-100 text-red-600">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Inter-Bank Stock Transfer</h3>
              <p className="text-[11px] text-slate-500">Coordinate surplus allocation between certified blood banks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Source Bank (Surplus)
              </label>
              <select
                value={sourceBankId}
                onChange={(e) => setSourceBankId(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-red-500 focus:outline-hidden"
              >
                <option value="">Select source...</option>
                {bloodBanks.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Bank (Shortage)
              </label>
              <select
                value={targetBankId}
                onChange={(e) => setTargetBankId(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-red-500 focus:outline-hidden"
              >
                <option value="">Select target...</option>
                {bloodBanks.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-red-500 focus:outline-hidden"
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Component</label>
              <select
                value={component}
                onChange={(e) => setComponent(e.target.value as BloodComponent)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-red-500 focus:outline-hidden"
              >
                {BLOOD_COMPONENTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Units (Qty)</label>
              <input
                type="number"
                min="1"
                max="20"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Urgency</label>
            <div className="grid grid-cols-3 gap-2">
              {(['emergency', 'urgent', 'routine'] as const).map((urg) => (
                <button
                  type="button"
                  key={urg}
                  onClick={() => setUrgencyLevel(urg)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-colors capitalize ${
                    urgencyLevel === urg
                      ? 'bg-red-600 text-white border-red-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {urg}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transfer Reason & Notes
            </label>
            <textarea
              rows={2}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="e.g. Critical trauma surge, inter-facility replenishment..."
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-red-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>{loading ? 'Submitting...' : 'Dispatch Transfer'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
