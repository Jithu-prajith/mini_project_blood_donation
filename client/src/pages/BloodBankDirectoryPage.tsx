import React, { useState, useEffect } from 'react';
import { Building2, Search, MapPin, Phone, Mail, Clock, PackageCheck, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { BloodBank } from '../types';
import { MapViewer } from '../components/MapViewer';
import { StatCard } from '../components/StatCard';

export const BloodBankDirectoryPage: React.FC = () => {
  const [banks, setBanks] = useState<BloodBank[]>([]);
  const [search, setSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/blood-banks?search=${encodeURIComponent(search)}&lat=12.9716&lng=77.5946`);
      if (res.data.success) {
        setBanks(res.data.bloodBanks);
      }
    } catch (err) {
      console.error('Failed to load blood banks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, [search]);

  const handleInspectBank = async (bankId: string) => {
    try {
      const res = await api.get(`/blood-banks/${bankId}`);
      if (res.data.success) {
        setSelectedBank(res.data);
      }
    } catch (err) {
      console.error('Failed to load bank detail:', err);
    }
  };

  const mapLocations = banks.map((b) => ({
    id: b._id,
    lat: b.location.coordinates[1],
    lng: b.location.coordinates[0],
    title: b.name,
    subtitle: `${b.address} • License: ${b.licenseNumber}`,
    type: 'blood_bank' as const
  }));

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Participating Blood Banks Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Certified facilities with refrigerated storage, screening, and inter-bank logistics support
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, address, area..."
            className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:border-red-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Map of Regional Banks */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Regional Facility Map
        </h2>
        <MapViewer center={[12.9716, 77.5946]} zoom={12} locations={mapLocations} height="280px" />
      </div>

      {/* Blood Bank Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12">
            <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Searching certified blood banks...</p>
          </div>
        ) : banks.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-500">No blood banks matched your search query.</p>
          </div>
        ) : (
          banks.map((bank) => (
            <div
              key={bank._id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-red-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 rounded-xl bg-red-50 text-red-600">
                    <Building2 size={20} />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Facility
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900">{bank.name}</h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Lic: {bank.licenseNumber}</p>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-1">
                  <p className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{bank.address}, {bank.city}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span>{bank.contactPhone}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span>{bank.operatingHours}</span>
                  </p>
                  {typeof bank.distanceKm === 'number' && (
                    <p className="text-xs font-semibold text-red-600 mt-1">
                      Distance: {bank.distanceKm} km
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Capacity: <strong>{bank.storageCapacityUnits} Units</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleInspectBank(bank._id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-800 hover:text-red-700 text-xs font-semibold transition-colors"
                >
                  View Inventory &rarr;
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected Bank Stock Modal */}
      {selectedBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">{selectedBank.bloodBank.name}</h3>
                <p className="text-xs text-slate-500">{selectedBank.bloodBank.address}</p>
              </div>
              <button
                onClick={() => setSelectedBank(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Total Available</span>
                <span className="text-base font-bold text-emerald-600">
                  {selectedBank.stockSummary?.totalAvailableUnits} Units
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Reserved</span>
                <span className="text-base font-bold text-amber-600">
                  {selectedBank.stockSummary?.totalReservedUnits} Units
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Quarantined</span>
                <span className="text-base font-bold text-slate-600">
                  {selectedBank.stockSummary?.totalQuarantinedUnits} Units
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Expiring &lt;7d</span>
                <span className="text-base font-bold text-rose-600">
                  {selectedBank.stockSummary?.totalExpiringSoonUnits} Units
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase">Available Stock by Blood Group</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-bold text-slate-600 text-left">
                    <tr>
                      <th className="p-2.5">Blood Group</th>
                      <th className="p-2.5">Component</th>
                      <th className="p-2.5 text-center">Available Units</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedBank.stockSummary?.matrix
                      ?.filter((m: any) => m.component === 'Whole Blood' || m.component === 'Red Blood Cells')
                      .slice(0, 8)
                      .map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-bold">{row.bloodGroup}</td>
                          <td className="p-2.5 text-slate-600">{row.component}</td>
                          <td className="p-2.5 text-center font-bold">{row.availableCount}</td>
                          <td className="p-2.5 text-center">
                            {row.isLowStock ? (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Sufficient
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBank(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
