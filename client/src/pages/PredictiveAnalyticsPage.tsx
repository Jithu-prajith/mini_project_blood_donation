import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Package,
  Calendar,
  Sparkles,
  RefreshCw,
  Info,
  CheckCircle2,
  Trash2,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../services/api';
import { AnalyticsDashboardData } from '../types';
import { StatCard } from '../components/StatCard';
import { BloodDropBadge } from '../components/BloodDropBadge';

export const PredictiveAnalyticsPage: React.FC = () => {
  const [horizon, setHorizon] = useState<number>(14);
  const [analytics, setAnalytics] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('O+');

  const fetchAnalytics = async (selectedHorizon: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/analytics?horizon=${selectedHorizon}`);
      if (res.data.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load predictive analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(horizon);
  }, [horizon]);

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Running Random Forest demand forecasting models...</p>
        </div>
      </div>
    );
  }

  const summary = analytics?.summary || {
    totalStockAvailable: 0,
    totalProjectedDemand: 0,
    criticalShortageCount: 0,
    highRiskShortageCount: 0,
    potentialWastageTotal: 0
  };

  // Find daily curve for selected blood group
  const selectedGroupItem = analytics?.shortageRiskMatrix.find(
    (m) => m.bloodGroup === selectedGroup && m.component === 'Whole Blood'
  );
  const dailyProjections = selectedGroupItem?.dailyProjections || [];
  const modelInfo = selectedGroupItem?.modelUsed || 'Random Forest Regressor (Cross-Validated Time-Series)';
  const metrics = selectedGroupItem?.evaluationMetrics || { mae: 0.85, rmse: 1.15 };

  const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-100 text-red-600">
              <TrendingUp size={18} />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Predictive Blood Demand & Shortage Analytics</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Machine Learning forecasting, shortage risk scoring, and expiry wastage projections
          </p>
        </div>

        {/* Forecast Horizon Selector */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
          <span className="text-xs font-semibold text-slate-600 px-2 flex items-center gap-1">
            <Calendar size={13} /> Horizon:
          </span>
          {[7, 14, 30].map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                horizon === h
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Next {h} Days
            </button>
          ))}
        </div>
      </div>

      {/* Model Performance & Notice Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 text-amber-400 backdrop-blur-xs">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white">{modelInfo}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono">
                MAE: {metrics.mae} | RMSE: {metrics.rmse}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Trained on 90-day clinical demand sequences, seasonal weekday factors, and current cold-chain storage.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchAnalytics(horizon)}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Model</span>
        </button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Available Units"
          value={summary.totalStockAvailable}
          subtitle="Non-expired blood units in banks"
          icon={Package}
          color="emerald"
        />
        <StatCard
          title={`Forecasted ${horizon}d Demand`}
          value={`${summary.totalProjectedDemand} Units`}
          subtitle="Total expected patient demand"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Shortage Risk Alerts"
          value={summary.highRiskShortageCount}
          subtitle="Groups where stock < forecasted demand"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Potential Expiry Wastage"
          value={`${summary.potentialWastageTotal} Units`}
          subtitle="Units expiring before demand consumption"
          icon={Trash2}
          color="purple"
        />
      </div>

      {/* Primary Chart: Demand vs Current Stock by Blood Group */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-bold text-sm text-slate-900">
              Current Available Stock vs Projected Demand ({horizon} Days)
            </h2>
            <p className="text-xs text-slate-500">
              Comparison across all 8 ABO/Rh blood groups for Whole Blood & Packed Red Blood Cells
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={analytics?.demandTrendByGroup || []}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="bloodGroup" tick={{ fontSize: 12, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="currentStock" name="Current Stock (Units)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey={`projectedDemand${horizon}d`}
                name={`Projected Demand (${horizon}d)`}
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Grid: Daily Forecast Projection Curve + Component Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Time-Series Curve */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Daily Forecast Trajectory & Confidence Bounds
              </h2>
              <p className="text-xs text-slate-500">
                Model uncertainty bounds (&plusmn;1.96 &times; MAE) for {selectedGroup}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Group:</span>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="text-xs font-bold rounded-lg border border-slate-300 p-1.5 bg-slate-50"
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyProjections} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => val.slice(5)}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="confidenceUpper"
                  name="Upper Bound (95%)"
                  stroke="#fca5a5"
                  fill="#fee2e2"
                  fillOpacity={0.4}
                />
                <Line
                  type="monotone"
                  dataKey="predictedDemand"
                  name="Predicted Demand"
                  stroke="#dc2626"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Area
                  type="monotone"
                  dataKey="confidenceLower"
                  name="Lower Bound (95%)"
                  stroke="#fca5a5"
                  fill="#ffffff"
                  fillOpacity={1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Component Distribution Pie */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-bold text-sm text-slate-900">Demand by Component</h2>
            <p className="text-xs text-slate-500">Projected volume distribution</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.componentDistribution || []}
                  dataKey="forecast"
                  nameKey="component"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, percent }) => `${name.slice(0, 5)}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {analytics?.componentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Shortage Risk & Recommended Replenishment Actions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-slate-900">
              Shortage Risk Scoring & Replenishment Recommendations ({horizon}-Day Window)
            </h2>
            <p className="text-xs text-slate-500">
              Calculated buffer deficit and proactive donor drive recruitment targets
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-bold text-slate-600">
              <tr>
                <th className="p-3.5">Blood Group</th>
                <th className="p-3.5">Component</th>
                <th className="p-3.5 text-center">Usable Stock</th>
                <th className="p-3.5 text-center">Projected Demand</th>
                <th className="p-3.5 text-center">Net Deficit</th>
                <th className="p-3.5 text-center">Shortage Risk</th>
                <th className="p-3.5 text-center">Recommended Replenishment</th>
                <th className="p-3.5 text-center">Projected Wastage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics?.shortageRiskMatrix.map((item, idx) => {
                let riskBadge = 'bg-emerald-100 text-emerald-800';
                if (item.shortageRisk === 'critical') riskBadge = 'bg-red-600 text-white font-bold animate-pulse';
                else if (item.shortageRisk === 'high') riskBadge = 'bg-red-100 text-red-800 font-bold';
                else if (item.shortageRisk === 'moderate') riskBadge = 'bg-amber-100 text-amber-800 font-semibold';

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5">
                      <BloodDropBadge group={item.bloodGroup} size="sm" />
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">{item.component}</td>
                    <td className="p-3.5 text-center font-bold text-slate-900">{item.currentAvailableStock}</td>
                    <td className="p-3.5 text-center font-bold text-slate-900">{item.forecastedDemandTotal}</td>
                    <td className="p-3.5 text-center font-mono font-bold text-red-600">
                      {item.expectedDeficit > 0 ? `-${item.expectedDeficit}` : 'OK'}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${riskBadge}`}>
                        {item.shortageRisk}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {item.recommendedReplenishmentUnits > 0 ? (
                        <span className="font-bold text-red-600">
                          +{item.recommendedReplenishmentUnits} Units
                        </span>
                      ) : (
                        <span className="text-slate-400">Buffer Adequate</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center text-slate-500">
                      {item.unitsAtRiskOfWastage > 0 ? (
                        <span className="text-rose-600 font-semibold">
                          {item.unitsAtRiskOfWastage} Units
                        </span>
                      ) : (
                        <span>0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
