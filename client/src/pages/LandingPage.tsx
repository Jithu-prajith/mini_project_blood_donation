import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Droplet,
  Heart,
  Activity,
  ShieldCheck,
  TrendingUp,
  Building2,
  ArrowRight,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { BloodGroup } from '../types';
import { BLOOD_GROUPS, RBC_COMPATIBILITY_MAP } from '../utils/compatibility';
import { BloodDropBadge } from '../components/BloodDropBadge';
import { ClinicalDisclaimer } from '../components/ClinicalDisclaimer';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>('O-');
  const [metrics, setMetrics] = useState({
    totalDonors: 10,
    totalBloodBanks: 3,
    availableBloodUnits: 319,
    fulfilmentRate: 94
  });
  const { demoLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/admin/overview')
      .then((res) => {
        if (res.data.success && res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      })
      .catch(() => {});
  }, []);

  const compatibleDonors = RBC_COMPATIBILITY_MAP[selectedGroup] || [selectedGroup];

  const handlePersona = async (role: any, path: string) => {
    await demoLogin(role);
    navigate(path);
  };

  return (
    <div className="space-y-16 py-6 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white p-8 sm:p-12 lg:p-16 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold backdrop-blur-xs">
            <Sparkles size={14} className="text-amber-400" />
            <span>AI-Driven Healthcare Infrastructure</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            AI-Based Blood Donor–Recipient Matching & Blood Bank Management
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            A real-time, database-connected intelligent healthcare platform connecting donors, recipients, hospitals, and blood banks with explainable compatibility ranking, unit-level inventory tracking, emergency escalation, and predictive demand analytics.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/create-request"
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-sm text-white shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all hover:scale-105"
            >
              <span>Submit Blood Request</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/blood-banks"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur-xs flex items-center gap-2 transition-colors"
            >
              <Search size={16} />
              <span>Explore Blood Banks</span>
            </Link>
          </div>
        </div>

        {/* Live Metrics Counter */}
        <div className="relative z-10 mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 pt-8">
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{metrics.availableBloodUnits}+</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Usable Blood Units</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{metrics.totalDonors}+</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Verified Active Donors</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{metrics.totalBloodBanks}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Certified Regional Banks</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-red-400">{metrics.fulfilmentRate}%</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Emergency Fulfilment Rate</p>
          </div>
        </div>
      </section>

      {/* 1-Click Evaluation Personas */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="max-w-2xl mb-6">
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
            Interactive Academic Evaluation
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Test All 4 System Personas Instantly
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Switch between authorized personas with a single click. Permissions and operational dashboards adapt dynamically.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => handlePersona('donor', '/donor-dashboard')}
            className="p-5 rounded-xl border border-slate-200 hover:border-red-300 bg-slate-50/50 hover:bg-red-50/30 cursor-pointer transition-all hover:shadow-md group"
          >
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Droplet size={20} className="fill-current" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Blood Donor</h3>
            <p className="text-xs text-slate-500 mt-1">Rahul Sharma (O+)</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
              Launch Donor Dashboard &rarr;
            </span>
          </div>

          <div
            onClick={() => handlePersona('recipient', '/recipient-dashboard')}
            className="p-5 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer transition-all hover:shadow-md group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Heart size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Recipient / Patient</h3>
            <p className="text-xs text-slate-500 mt-1">Priya Sharma</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
              Launch Recipient Hub &rarr;
            </span>
          </div>

          <div
            onClick={() => handlePersona('blood_bank', '/inventory')}
            className="p-5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50/50 hover:bg-emerald-50/30 cursor-pointer transition-all hover:shadow-md group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Building2 size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Blood Bank Admin</h3>
            <p className="text-xs text-slate-500 mt-1">Apollo Central Blood Center</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              Launch Inventory System &rarr;
            </span>
          </div>

          <div
            onClick={() => handlePersona('admin', '/admin')}
            className="p-5 rounded-xl border border-slate-200 hover:border-purple-300 bg-slate-50/50 hover:bg-purple-50/30 cursor-pointer transition-all hover:shadow-md group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900">System Administrator</h3>
            <p className="text-xs text-slate-500 mt-1">Dr. Sarah Mitchell</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-purple-600">
              Launch Admin Console &rarr;
            </span>
          </div>
        </div>
      </section>

      {/* Interactive ABO/Rh Compatibility Explorer */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="max-w-2xl">
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
            Clinical Rules & Safety Engine
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Interactive ABO/Rh Compatibility Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Click any recipient blood group below to inspect clinically compatible donor groups evaluated by the matching engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {BLOOD_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGroup(g)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                selectedGroup === g
                  ? 'bg-red-600 text-white border-red-600 shadow-md scale-105'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Recipient: {g}
            </button>
          ))}
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold uppercase">Selected Patient:</span>
              <BloodDropBadge group={selectedGroup} size="lg" />
              {selectedGroup === 'O-' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                  Universal RBC Donor / Most Restricted Recipient
                </span>
              )}
              {selectedGroup === 'AB+' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Universal RBC Recipient
                </span>
              )}
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">
                Compatible Red Blood Cell / Whole Blood Donors ({compatibleDonors.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {compatibleDonors.map((cg) => (
                  <span
                    key={cg}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs shadow-2xs"
                  >
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>{cg}</span>
                    {cg === selectedGroup && (
                      <span className="text-[10px] text-red-600 font-normal ml-0.5">(Exact)</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm">Clinical ABO Compatibility Rule</h4>
            <p>
              Recipients cannot receive blood cells possessing antigens that their plasma contains antibodies against.
              Rh-negative patients should receive Rh-negative blood units to prevent Rh(D) alloimmunization.
            </p>
            <p className="text-[11px] text-slate-500 italic">
              Plasma (FFP) follows reverse compatibility where AB plasma contains neither anti-A nor anti-B and acts as the universal plasma donor.
            </p>
          </div>
        </div>

        <ClinicalDisclaimer compact />
      </section>

      {/* Core Architectural Modules */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
            Architecture
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Engineered Core Modules
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Droplet size={24} className="fill-current" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Module A: AI Matching</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Multi-criteria transparent ranking score evaluating ABO/Rh component compatibility, Haversine geographic distance, cooling-off recency, and availability.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <Building2 size={24} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Module B: Inventory System</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Unit-level barcode tracking across 5 components. Expiry tracking (&lt;3d, &lt;7d), atomic reservation locks, and inter-bank surplus transfer recommendations.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <Clock size={24} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Module C: Emergency Coordination</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Real-time multi-bank escalation protocol for Emergency (&lt;1h) and Urgent (&lt;4h) blood requests, dispatching high-priority alerts to matching donors.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
              <TrendingUp size={24} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Module D: Predictive Analytics</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Random Forest Regressor time-series forecasting across 7, 14, and 30 day horizons with MAE/RMSE metrics, Shortage Risk Index (SRI), and projected wastage alerts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
