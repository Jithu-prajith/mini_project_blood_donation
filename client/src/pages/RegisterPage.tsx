import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, Heart, Building2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole, BloodGroup } from '../types';
import { BLOOD_GROUPS } from '../utils/compatibility';

export const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<UserRole>('donor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [city, setCity] = useState('Bangalore');
  const [state, setState] = useState('Karnataka');

  // Donor fields
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [dob, setDob] = useState('1998-05-15');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [weightKg, setWeightKg] = useState(65);
  const [preferredRadiusKm, setPreferredRadiusKm] = useState(30);

  // Recipient fields
  const [hospitalName, setHospitalName] = useState('City Care Hospital');

  // Blood bank fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [storageCapacity, setStorageCapacity] = useState(1500);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      name,
      email,
      password,
      role,
      phone,
      city,
      state,
      bloodGroup: role === 'donor' ? bloodGroup : undefined,
      dateOfBirth: role === 'donor' ? dob : undefined,
      gender: role === 'donor' ? gender : undefined,
      weightKg: role === 'donor' ? weightKg : undefined,
      preferredRadiusKm: role === 'donor' ? preferredRadiusKm : undefined,
      hospitalName: role === 'recipient' ? hospitalName : undefined,
      licenseNumber: role === 'blood_bank' ? licenseNumber : undefined,
      storageCapacityUnits: role === 'blood_bank' ? storageCapacity : undefined
    };

    const res = await register(payload);
    setLoading(false);

    if (res.success) {
      if (role === 'donor') navigate('/donor-dashboard');
      else if (role === 'recipient') navigate('/recipient-dashboard');
      else if (role === 'blood_bank') navigate('/inventory');
      else navigate('/');
    } else {
      setError(res.message || 'Registration failed. Check inputs.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-6 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 mx-auto flex items-center justify-center text-white shadow-md shadow-red-500/20 mb-3">
            <Droplet className="fill-current w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create HemaMatch Account</h2>
          <p className="text-xs text-slate-500 mt-1">Join the intelligent blood donation & inventory network</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setRole('donor')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              role === 'donor' ? 'bg-white text-red-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Droplet size={14} className="fill-current" />
            <span>Donor</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('recipient')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              role === 'recipient' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart size={14} />
            <span>Recipient</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('blood_bank')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              role === 'blood_bank' ? 'bg-white text-emerald-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 size={14} />
            <span>Blood Bank</span>
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Common Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'blood_bank' ? 'Dr. Name / Center Lead' : 'Your Full Name'}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-red-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-red-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-red-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Donor specifics */}
          {role === 'donor' && (
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-3">
              <p className="text-xs font-bold text-rose-900 uppercase">Donor Profile Information</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white"
                  >
                    {BLOOD_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    min="45"
                    max="150"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Travel Radius (km)</label>
                  <input
                    type="number"
                    value={preferredRadiusKm}
                    onChange={(e) => setPreferredRadiusKm(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recipient specifics */}
          {role === 'recipient' && (
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
              <p className="text-xs font-bold text-blue-900 uppercase">Recipient Affiliation</p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital / Clinic Name</label>
                <input
                  type="text"
                  required
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="e.g. St. John's Medical College Hospital"
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
                />
              </div>
            </div>
          )}

          {/* Blood bank specifics */}
          {role === 'blood_bank' && (
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
              <p className="text-xs font-bold text-emerald-900 uppercase">Blood Bank Registration</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Govt. License Number</label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. KA-BB-2026-0982"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Storage Capacity</label>
                  <input
                    type="number"
                    value={storageCapacity}
                    onChange={(e) => setStorageCapacity(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-red-600 hover:text-red-700">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
