import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Building2,
  PackageCheck,
  HeartHandshake,
  Activity,
  CheckCircle2,
  RotateCcw,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import { StatCard } from '../components/StatCard';
import { formatDateTime } from '../utils/compatibility';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reseeding, setReseeding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [overRes, logRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/audit-logs?limit=30')
      ]);

      if (overRes.data.success) setMetrics(overRes.data.metrics);
      if (logRes.data.success) setAuditLogs(logRes.data.logs || []);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleReseed = async () => {
    if (!window.confirm('Reset database and reload clean demonstration records?')) return;
    try {
      setReseeding(true);
      const res = await api.post('/admin/reseed-data');
      if (res.data.success) {
        setFeedback('Database successfully reseeded with fresh clinical demonstration records!');
        await fetchAdminData();
      }
    } catch (err: any) {
      setFeedback('Reseeding failed.');
    } finally {
      setReseeding(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <ShieldAlert size={20} />
            </span>
            <h1 className="text-xl font-bold text-slate-900">System Administration Console</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global healthcare metrics, security audit trail, and database demonstration control
          </p>
        </div>

        <button
          type="button"
          disabled={reseeding}
          onClick={handleReseed}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/20 flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RotateCcw size={14} className={reseeding ? 'animate-spin' : ''} />
          <span>{reseeding ? 'Resetting Database...' : 'Reset & Reseed Demo Data'}</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold">&times;</button>
        </div>
      )}

      {/* 6 Key System Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Registered Donors"
          value={metrics?.totalDonors ?? 0}
          subtitle={`${metrics?.activeDonors ?? 0} actively ready for matching`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Usable Blood Inventory"
          value={`${metrics?.availableBloodUnits ?? 0} Units`}
          subtitle={`${metrics?.reservedUnits ?? 0} currently reserved`}
          icon={PackageCheck}
          color="emerald"
        />
        <StatCard
          title="Fulfilment Rate"
          value={`${metrics?.fulfilmentRate ?? 0}%`}
          subtitle="Requests completed successfully"
          icon={Activity}
          color="purple"
        />
        <StatCard
          title="Active Requests"
          value={metrics?.activeRequests ?? 0}
          subtitle={`${metrics?.emergencyRequests ?? 0} Critical Emergencies`}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Participating Blood Banks"
          value={metrics?.totalBloodBanks ?? 0}
          subtitle="Certified regional centers"
          icon={Building2}
          color="amber"
        />
        <StatCard
          title="Expired / Discarded Units"
          value={metrics?.expiredOrDiscardedUnits ?? 0}
          subtitle="Strictly non-allocatable"
          icon={ShieldCheck}
          color="purple"
        />
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-bold text-sm text-slate-900">Regulatory Security & Transaction Audit Trail</h2>
            <p className="text-xs text-slate-500">Immutable ledger of system decisions, reservations, and updates</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Last 30 Events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-bold text-slate-600">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Actor / Role</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Context & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    Loading audit trail...
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70">
                    <td className="p-3 text-slate-500 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                    <td className="p-3 font-bold text-slate-900">{log.action}</td>
                    <td className="p-3 text-slate-600">{log.entityType}</td>
                    <td className="p-3 text-slate-700">
                      <span className="font-sans font-semibold">{log.performedByName || 'System'}</span>{' '}
                      <span className="text-[10px] text-slate-400 font-mono">({log.performedByRole || 'sys'})</span>
                    </td>
                    <td className="p-3 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="p-3 text-slate-600 font-sans max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : 'Standard system operation'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
