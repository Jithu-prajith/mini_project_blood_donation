import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, Lock, Mail, ArrowRight, Sparkles, Building2, HeartHandshake, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.message || 'Invalid email or password.');
    }
  };

  const handleDemo = async (role: UserRole, targetRoute: string) => {
    setError('');
    await demoLogin(role);
    navigate(targetRoute);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 mx-auto flex items-center justify-center text-white shadow-md shadow-red-500/20 mb-3">
            <Droplet className="fill-current w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to HemaMatch</h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your healthcare dashboard, donor matches & inventory
          </p>
        </div>

        {/* 1-Click Evaluation Buttons */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            <Sparkles size={13} className="text-amber-500" />
            <span>1-Click Demo Evaluation Sign In</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemo('donor', '/donor-dashboard')}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-red-300 text-slate-800 hover:text-red-700 font-semibold flex items-center gap-2 shadow-2xs transition-colors"
            >
              <Droplet size={14} className="text-red-500 fill-current" />
              <span>Donor (Rahul)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('recipient', '/recipient-dashboard')}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-800 hover:text-blue-700 font-semibold flex items-center gap-2 shadow-2xs transition-colors"
            >
              <HeartHandshake size={14} className="text-blue-500" />
              <span>Recipient (Priya)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('blood_bank', '/inventory')}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-800 hover:text-emerald-700 font-semibold flex items-center gap-2 shadow-2xs transition-colors"
            >
              <Building2 size={14} className="text-emerald-500" />
              <span>Blood Bank (Apollo)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('admin', '/admin')}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-purple-300 text-slate-800 hover:text-purple-700 font-semibold flex items-center gap-2 shadow-2xs transition-colors"
            >
              <ShieldAlert size={14} className="text-purple-500" />
              <span>Admin (Dr. Sarah)</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:border-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:border-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-red-600 hover:text-red-700">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
