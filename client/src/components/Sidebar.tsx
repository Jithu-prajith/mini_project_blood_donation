import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  Droplet,
  PackageCheck,
  AlertTriangle,
  TrendingUp,
  Building2,
  Bell,
  User,
  ShieldAlert,
  ArrowLeftRight,
  PlusCircle,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const baseLinks = [
    { to: '/', label: 'Home / Overview', icon: Home, end: true },
    { to: '/blood-banks', label: 'Blood Bank Directory', icon: Building2 },
    { to: '/emergency-requests', label: 'Emergency Requests', icon: AlertTriangle }
  ];

  const roleLinks = [];

  if (role === 'donor') {
    roleLinks.push(
      { to: '/donor-dashboard', label: 'Donor Dashboard', icon: LayoutDashboard },
      { to: '/notifications', label: 'Matching Alerts', icon: Bell }
    );
  } else if (role === 'recipient') {
    roleLinks.push(
      { to: '/recipient-dashboard', label: 'Recipient Dashboard', icon: LayoutDashboard },
      { to: '/create-request', label: 'Create Blood Request', icon: PlusCircle },
      { to: '/emergency-requests', label: 'Active Requests', icon: Search }
    );
  } else if (role === 'blood_bank') {
    roleLinks.push(
      { to: '/inventory', label: 'Inventory Management', icon: PackageCheck },
      { to: '/stock-transfers', label: 'Stock Transfers', icon: ArrowLeftRight },
      { to: '/predictive-analytics', label: 'Demand Forecasting', icon: TrendingUp }
    );
  } else if (role === 'admin') {
    roleLinks.push(
      { to: '/admin', label: 'Admin Console', icon: ShieldAlert },
      { to: '/inventory', label: 'Global Inventory', icon: PackageCheck },
      { to: '/stock-transfers', label: 'Stock Transfers', icon: ArrowLeftRight },
      { to: '/predictive-analytics', label: 'AI Demand Analytics', icon: TrendingUp }
    );
  }

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] p-4 hidden md:block">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
            Navigation
          </p>
          <nav className="space-y-1">
            {baseLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-red-50 text-red-700 shadow-2xs font-bold border border-red-100'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {roleLinks.length > 0 && (
          <div>
            <p className="px-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              Role Workspace
            </p>
            <nav className="space-y-1">
              {roleLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-red-50 text-red-700 shadow-2xs font-bold border border-red-100'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                  >
                    <Icon size={16} className="shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}

        <div>
          <p className="px-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
            Intelligence & Tools
          </p>
          <nav className="space-y-1">
            <NavLink
              to="/predictive-analytics"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-red-50 text-red-700 shadow-2xs font-bold border border-red-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <TrendingUp size={16} className="shrink-0" />
              <span>Predictive Analytics</span>
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-red-50 text-red-700 shadow-2xs font-bold border border-red-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <User size={16} className="shrink-0" />
              <span>Profile & Settings</span>
            </NavLink>
          </nav>
        </div>
      </div>
    </aside>
  );
};
