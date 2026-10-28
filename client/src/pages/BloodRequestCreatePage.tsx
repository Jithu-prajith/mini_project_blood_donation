import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplet, AlertTriangle, ShieldCheck, ArrowRight, Hospital } from 'lucide-react';
import api from '../services/api';
import { BloodGroup, BloodComponent, UrgencyLevel } from '../types';
import { BLOOD_GROUPS, BLOOD_COMPONENTS } from '../utils/compatibility';
import { ClinicalDisclaimer } from '../components/ClinicalDisclaimer';

export const BloodRequestCreatePage: React.FC = () => {
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState<number>(35);
  const [patientGender, setPatientGender] = useState<'male' | 'female' | 'other'>('female');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [component, setComponent] = useState<BloodComponent>('Whole Blood');
  const [unitsNeeded, setUnitsNeeded] = useState<number>(2);
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('urgent');
  const [hospitalName, setHospitalName] = useState('St. John’s Medical College Hospital');
  const [contactNumber, setContactNumber] = useState('+91 98860 22334');
  const [requiredByDate, setRequiredByDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [medicalNotes, setMedicalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/requests', {
        patientName,
        patientAge: Number(patientAge),
        patientGender,
        bloodGroup,
        component,
        unitsNeeded: Number(unitsNeeded),
        hospitalName,
        hospitalCoordinates: [77.6192, 12.9298], // St. John's coordinates
        urgencyLevel,
        requiredByDate,
        contactNumber,
        medicalNotes
      });

      if (res.data.success && res.data.request) {
        navigate(`/matching/${res.data.request._id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit blood request.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6 pb-16">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <Hospital size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Create Blood Request</h1>
            <p className="text-xs text-slate-500">
              Submit patient details to activate automated ABO compatibility matching and inventory discovery
            </p>
          </div>
        </div>
      </div>

      <ClinicalDisclaimer />

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
            {error}
          </div>
        )}

        {/* Urgency Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Urgency Classification
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setUrgencyLevel('emergency')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                urgencyLevel === 'emergency'
                  ? 'bg-red-600 text-white border-red-600 shadow-md scale-[1.02]'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">EMERGENCY</span>
                <AlertTriangle size={14} className={urgencyLevel === 'emergency' ? 'text-white' : 'text-red-500'} />
              </div>
              <p className={`text-[10px] mt-1 ${urgencyLevel === 'emergency' ? 'text-red-100' : 'text-slate-500'}`}>
                Required within 1 hour. Multi-bank escalation enabled.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setUrgencyLevel('urgent')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                urgencyLevel === 'urgent'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-[1.02]'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">URGENT</span>
                <Droplet size={14} className={urgencyLevel === 'urgent' ? 'text-white' : 'text-amber-500'} />
              </div>
              <p className={`text-[10px] mt-1 ${urgencyLevel === 'urgent' ? 'text-amber-100' : 'text-slate-500'}`}>
                Required within 4 hours. Surgery & trauma support.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setUrgencyLevel('routine')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                urgencyLevel === 'routine'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-md scale-[1.02]'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">ROUTINE</span>
                <ShieldCheck size={14} className={urgencyLevel === 'routine' ? 'text-white' : 'text-slate-500'} />
              </div>
              <p className={`text-[10px] mt-1 ${urgencyLevel === 'routine' ? 'text-slate-200' : 'text-slate-500'}`}>
                Required within 24-48 hours. Scheduled therapy.
              </p>
            </button>
          </div>
        </div>

        {/* Patient Details */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Patient Identification</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-red-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Age & Gender</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={patientAge}
                  onChange={(e) => setPatientAge(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
                />
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
                >
                  <option value="male">M</option>
                  <option value="female">F</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Blood Requirements */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Blood Specification</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-bold"
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Component Needed</label>
              <select
                value={component}
                onChange={(e) => setComponent(e.target.value as BloodComponent)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium"
              >
                {BLOOD_COMPONENTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity (Units)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={unitsNeeded}
                onChange={(e) => setUnitsNeeded(Number(e.target.value))}
                required
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Facility & Logistics */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Facility & Logistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital / Medical Center</label>
              <input
                type="text"
                required
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-red-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
              <input
                type="tel"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Required By (Date & Time)</label>
            <input
              type="datetime-local"
              required
              value={requiredByDate}
              onChange={(e) => setRequiredByDate(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes & Indications</label>
            <textarea
              rows={2}
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              placeholder="e.g. Scheduled cardiac bypass, acute gastrointestinal hemorrhage, platelet refractory..."
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-red-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            <span>{loading ? 'Processing Match...' : 'Submit & Match Donors'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </form>
    </div>
  );
};
