import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  PlusCircle,
  AlertTriangle,
  Clock,
  ArrowLeftRight,
  Filter,
  Search,
  CheckCircle2,
  Trash2,
  ShieldAlert,
  Building2
} from 'lucide-react';
import api from '../services/api';
import { BloodInventoryUnit, BloodBank, BloodGroup, BloodComponent, InventoryStatus } from '../types';
import { BLOOD_GROUPS, BLOOD_COMPONENTS, formatDate } from '../utils/compatibility';
import { BloodDropBadge } from '../components/BloodDropBadge';
import { StatCard } from '../components/StatCard';
import { TransferModal } from '../components/TransferModal';
import { useAuth } from '../context/AuthContext';

export const InventoryManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [units, setUnits] = useState<BloodInventoryUnit[]>([]);
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [stockSummary, setStockSummary] = useState<any>(null);

  // Filters
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [compFilter, setCompFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expiringFilter, setExpiringFilter] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add Unit Form State
  const [newGroup, setNewGroup] = useState<BloodGroup>('O+');
  const [newComp, setNewComp] = useState<BloodComponent>('Whole Blood');
  const [newCollectionDate, setNewCollectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [newVolume, setNewVolume] = useState(450);
  const [newFreezer, setNewFreezer] = useState('FRZ-01');
  const [newShelf, setNewShelf] = useState('SLF-A');
  const [newBarcode, setNewBarcode] = useState('');

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const banksRes = await api.get('/blood-banks');
      if (banksRes.data.success && banksRes.data.bloodBanks.length > 0) {
        setBloodBanks(banksRes.data.bloodBanks);
        const defaultBank = banksRes.data.bloodBanks[0];
        setSelectedBankId(defaultBank._id);
        await loadBankInventory(defaultBank._id);
      }
    } catch (err) {
      console.error('Failed to load blood banks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBankInventory = async (bankId: string) => {
    try {
      setLoading(true);
      const [unitsRes, summaryRes] = await Promise.all([
        api.get(`/inventory?bloodBankId=${bankId}`),
        api.get(`/blood-banks/${bankId}`)
      ]);

      if (unitsRes.data.success) {
        setUnits(unitsRes.data.units);
      }
      if (summaryRes.data.success) {
        setStockSummary(summaryRes.data.stockSummary);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedBankId(newId);
    loadBankInventory(newId);
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/inventory', {
        bloodBankId: selectedBankId,
        bloodGroup: newGroup,
        component: newComp,
        collectionDate: newCollectionDate,
        volumeMl: newVolume,
        freezerId: newFreezer,
        shelfNumber: newShelf,
        unitIdentifier: newBarcode || undefined
      });

      if (res.data.success) {
        setFeedback({ type: 'success', text: `Blood Unit ${res.data.unit.unitIdentifier} registered successfully!` });
        setShowAddModal(false);
        setNewBarcode('');
        await loadBankInventory(selectedBankId);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to add blood unit.' });
    }
  };

  const handleDispose = async (unitId: string, action: 'quarantined' | 'discarded') => {
    const reason = window.prompt(`Reason for marking unit as ${action}:`, 'Quality assurance screening protocol');
    if (!reason) return;

    try {
      const res = await api.post('/inventory/dispose', {
        unitId,
        action,
        reason
      });
      if (res.data.success) {
        setFeedback({ type: 'success', text: `Unit updated to ${action}.` });
        await loadBankInventory(selectedBankId);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Action failed.' });
    }
  };

  // Filtered units
  const filteredUnits = units.filter((u) => {
    if (groupFilter !== 'all' && u.bloodGroup !== groupFilter) return false;
    if (compFilter !== 'all' && u.component !== compFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (expiringFilter) {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const exp = new Date(u.expiryDate);
      if (u.status !== 'available' || exp > in7Days || exp < now) return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!u.unitIdentifier.toLowerCase().includes(term) && !u.bloodGroup.toLowerCase().includes(term)) {
        return false;
      }
    }
    return true;
  });

  const getStatusBadge = (status: InventoryStatus) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'reserved':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'issued':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'expired':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'quarantined':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'discarded':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Intelligent Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Unit-level barcode lifecycle, automatic shelf-life expiry tracking, and inter-bank logistics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Blood Bank Selector */}
          <div className="relative">
            <select
              value={selectedBankId}
              onChange={handleBankChange}
              className="text-xs font-bold rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 text-slate-800 focus:outline-hidden focus:border-red-500"
            >
              {bloodBanks.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowTransferModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeftRight size={14} className="text-slate-600" />
            <span>Transfer Stock</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle size={14} />
            <span>Add Blood Unit</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="font-bold text-xs px-2">
            &times;
          </button>
        </div>
      )}

      {/* 4 Stat Cards for Selected Bank */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Usable Available Units"
          value={stockSummary?.totalAvailableUnits ?? units.filter((u) => u.status === 'available').length}
          subtitle="Cleared for clinical issue"
          icon={PackageCheck}
          color="emerald"
        />
        <StatCard
          title="Reserved Units"
          value={stockSummary?.totalReservedUnits ?? units.filter((u) => u.status === 'reserved').length}
          subtitle="Locked for active patient requests"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Approaching Expiry (<7d)"
          value={stockSummary?.totalExpiringSoonUnits ?? 0}
          subtitle="Priority issue or transfer required"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Quarantined / Discarded"
          value={stockSummary?.totalQuarantinedUnits ?? units.filter((u) => u.status === 'quarantined').length}
          subtitle="Non-allocatable units"
          icon={ShieldAlert}
          color="purple"
        />
      </div>

      {/* Low Stock Alerts Banner (if any) */}
      {stockSummary?.lowStockAlerts?.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 shadow-xs flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-100 text-red-600 mt-0.5">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="font-bold text-red-950 text-xs">Low Stock Threshold Warnings</h3>
            <p className="text-xs text-red-800/90 mt-0.5 leading-relaxed">
              The following blood groups have fallen below safe buffer levels ({stockSummary.lowStockAlerts[0]?.threshold} units):{' '}
              <strong>
                {stockSummary.lowStockAlerts.map((a: any) => `${a.bloodGroup} ${a.component} (${a.availableCount} left)`).join(' • ')}
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search */}
            <div className="relative w-48">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Barcode or group..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-red-500"
              />
            </div>

            {/* Blood Group Filter */}
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 px-2.5 py-1.5 bg-white font-medium"
            >
              <option value="all">All Groups</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {/* Component Filter */}
            <select
              value={compFilter}
              onChange={(e) => setCompFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 px-2.5 py-1.5 bg-white font-medium"
            >
              <option value="all">All Components</option>
              {BLOOD_COMPONENTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 px-2.5 py-1.5 bg-white font-medium capitalize"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="issued">Issued</option>
              <option value="expired">Expired</option>
              <option value="quarantined">Quarantined</option>
            </select>

            {/* Expiring Soon Toggle */}
            <button
              type="button"
              onClick={() => setExpiringFilter(!expiringFilter)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                expiringFilter
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Clock size={12} />
              <span>Expiring &lt;7d</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Showing <strong>{filteredUnits.length}</strong> of {units.length} units
          </span>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-bold text-slate-600">
              <tr>
                <th className="p-3.5">Unit Barcode</th>
                <th className="p-3.5">Blood Group</th>
                <th className="p-3.5">Component</th>
                <th className="p-3.5">Collection Date</th>
                <th className="p-3.5">Expiry Date</th>
                <th className="p-3.5">Storage Location</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading inventory records...
                  </td>
                </tr>
              ) : filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No blood units match the configured filters.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit) => {
                  const now = new Date();
                  const expDate = new Date(unit.expiryDate);
                  const isExpired = expDate <= now;
                  const isExpiringSoon = !isExpired && expDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000;

                  return (
                    <tr key={unit._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{unit.unitIdentifier}</td>
                      <td className="p-3.5">
                        <BloodDropBadge group={unit.bloodGroup} size="sm" />
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">{unit.component}</td>
                      <td className="p-3.5 text-slate-500">{formatDate(unit.collectionDate)}</td>
                      <td className="p-3.5">
                        <span
                          className={`font-semibold ${
                            isExpired ? 'text-rose-600 font-bold' : isExpiringSoon ? 'text-amber-600' : 'text-slate-700'
                          }`}
                        >
                          {formatDate(unit.expiryDate)}
                        </span>
                        {isExpiringSoon && (
                          <span className="block text-[10px] text-amber-600 font-medium">Within 7 days</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {unit.storageLocation?.freezerId || 'FRZ-01'} / {unit.storageLocation?.shelfNumber || 'SLF-A'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold capitalize ${getStatusBadge(
                            unit.status
                          )}`}
                        >
                          {unit.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {unit.status === 'available' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDispose(unit._id, 'quarantined')}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-[11px] font-semibold"
                            >
                              Quarantine
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDispose(unit._id, 'discarded')}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
                              title="Discard unit"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Blood Unit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Register New Blood Unit</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddUnit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value as BloodGroup)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 bg-white font-bold"
                >
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blood Component</label>
                <select
                  value={newComp}
                  onChange={(e) => setNewComp(e.target.value as BloodComponent)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 bg-white font-medium"
                >
                  {BLOOD_COMPONENTS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Collection Date</label>
                  <input
                    type="date"
                    required
                    value={newCollectionDate}
                    onChange={(e) => setNewCollectionDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Volume (ml)</label>
                  <input
                    type="number"
                    value={newVolume}
                    onChange={(e) => setNewVolume(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Freezer ID</label>
                  <input
                    type="text"
                    value={newFreezer}
                    onChange={(e) => setNewFreezer(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shelf Number</label>
                  <input
                    type="text"
                    value={newShelf}
                    onChange={(e) => setNewShelf(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Custom Barcode (Optional)</label>
                <input
                  type="text"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  placeholder="Auto-generated if blank (e.g. WB-OP-0012)"
                  className="w-full rounded-xl border border-slate-300 p-2.5 bg-white uppercase font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs"
                >
                  Save & Check In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inter-Bank Transfer Modal */}
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={() => {
          setFeedback({ type: 'success', text: 'Stock transfer request submitted successfully!' });
          loadBankInventory(selectedBankId);
        }}
        bloodBanks={bloodBanks}
        defaultValues={{ sourceBankId: selectedBankId }}
      />
    </div>
  );
};
