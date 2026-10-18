import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, Stethoscope, UserCheck, HeartPulse, ArrowRight, ArrowLeft, UserPlus, Mail, Lock, Calendar, Phone, X, ChevronRight } from 'lucide-react';
import { UserRole } from '../types';

interface LoginViewProps {
  /** When provided, shows a link back to the public hospital website. */
  onBackToHome?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onBackToHome }) => {
  const { login, register, switchDemoRole } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Registration form state
  const [regData, setRegData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    dateOfBirth: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    bloodGroup: 'O+',
    contactNumber: '',
    emergencyContact: '',
    address: '',
    pincode: '',
    allergies: '',
    chronicConditions: '',
  });
  const [regError, setRegError] = useState<string | null>(null);
  const [regSubmitting, setRegSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSubmitting(true);
    try {
      await register({
        firstName: regData.firstName,
        lastName: regData.lastName,
        email: regData.email,
        password: regData.password,
        dateOfBirth: regData.dateOfBirth,
        gender: regData.gender,
        bloodGroup: regData.bloodGroup,
        contactNumber: regData.contactNumber,
        emergencyContact: regData.emergencyContact || undefined,
        address: regData.address || undefined,
        pincode: regData.pincode || undefined,
        allergies: regData.allergies || undefined,
        chronicConditions: regData.chronicConditions || undefined,
      });
      // Switch back to login and pre-fill email
      setEmail(regData.email);
      setShowRegister(false);
      setRegError(null);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please try again.');
    } finally {
      setRegSubmitting(false);
    }
  };

  const demoAccounts: { role: UserRole; title: string; email: string; icon: any; color: string }[] = [
    {
      role: 'ADMIN',
      title: 'Hospital Administrator',
      email: 'admin@medpulse.in',
      icon: ShieldCheck,
      color: 'border-slate-300 hover:border-slate-500 bg-white',
    },
    {
      role: 'DOCTOR',
      title: 'Attending Doctor',
      email: 'doctor@medpulse.in',
      icon: Stethoscope,
      color: 'border-teal-200 hover:border-teal-400 bg-teal-50/50',
    },
    {
      role: 'RECEPTIONIST',
      title: 'Front Desk Reception',
      email: 'reception@medpulse.in',
      icon: UserCheck,
      color: 'border-blue-200 hover:border-blue-400 bg-blue-50/50',
    },
    {
      role: 'PATIENT',
      title: 'Patient Portal',
      email: 'patient@medpulse.in',
      icon: HeartPulse,
      color: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/50',
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {onBackToHome && (
        <button
          type="button"
          onClick={onBackToHome}
          className="absolute top-5 left-5 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to hospital website
        </button>
      )}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 bg-teal-600 text-white rounded-2xl shadow-md mb-3">
          <Activity className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">MedPulse Clinical System</h2>
        <p className="mt-1 text-xs text-slate-500">
          Secure Patient &amp; Staff Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-slate-200 sm:px-10">
          {!showRegister ? (
            <>
              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Work Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="doctor@medpulse.in"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Signing in...' : 'Sign in to MedPulse'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
                  Quick 1-Click Demo Logins
                </div>
                <p className="text-[11px] text-slate-400 text-center mb-3">
                  Standard dev password: <code className="font-mono text-slate-600">Password123!</code>
                </p>

                <div className="grid grid-cols-1 gap-2">
                  {demoAccounts.map(demo => {
                    const Icon = demo.icon;
                    return (
                      <button
                        key={demo.role}
                        type="button"
                        onClick={() => switchDemoRole(demo.role)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs text-left transition-all cursor-pointer ${demo.color}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-slate-700" />
                          <div>
                            <div className="font-semibold text-slate-800">{demo.title}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{demo.email}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-[11px] text-slate-500">
                  New patient?{' '}
                  <button
                    type="button"
                    onClick={() => { setShowRegister(true); setError(null); }}
                    className="font-medium text-teal-600 hover:text-teal-500 underline cursor-pointer"
                  >
                    Register as patient
                  </button>
                </p>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setShowRegister(false); setRegError(null); }}
                className="text-[11px] text-slate-400 hover:text-slate-600 mb-3 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Back to sign in
              </button>

              {regError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                  {regError}
                </div>
              )}

              <form className="space-y-3 text-xs" onSubmit={handleRegisterSubmit}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">First Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={regData.firstName}
                      onChange={e => setRegData({ ...regData, firstName: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Last Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={regData.lastName}
                      onChange={e => setRegData({ ...regData, lastName: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address <span className="text-rose-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={regData.email}
                    onChange={e => setRegData({ ...regData, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password <span className="text-rose-500">*</span></label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={regData.password}
                    onChange={e => setRegData({ ...regData, password: e.target.value })}
                    placeholder="•••••••• (8+ chars)"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Must be at least 8 characters</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date of Birth <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={regData.dateOfBirth}
                      onChange={e => setRegData({ ...regData, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gender <span className="text-rose-500">*</span></label>
                    <select
                      required
                      value={regData.gender}
                      onChange={e => setRegData({ ...regData, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                    <select
                      value={regData.bloodGroup}
                      onChange={e => setRegData({ ...regData, bloodGroup: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone <span className="text-rose-500">*</span></label>
                  <input
                    type="tel"
                    required
                    value={regData.contactNumber}
                    onChange={e => setRegData({ ...regData, contactNumber: e.target.value })}
                    placeholder="+91-98765-43210"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={regData.emergencyContact}
                    onChange={e => setRegData({ ...regData, emergencyContact: e.target.value })}
                    placeholder="Name + phone"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={regData.address}
                    onChange={e => setRegData({ ...regData, address: e.target.value })}
                    placeholder="House No, Street, Area, City"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={regData.pincode}
                    onChange={e => setRegData({ ...regData, pincode: e.target.value })}
                    placeholder="110001"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Known Allergies</label>
                    <input
                      type="text"
                      value={regData.allergies}
                      onChange={e => setRegData({ ...regData, allergies: e.target.value })}
                      placeholder="e.g. Penicillin"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Chronic Conditions</label>
                    <input
                      type="text"
                      value={regData.chronicConditions}
                      onChange={e => setRegData({ ...regData, chronicConditions: e.target.value })}
                      placeholder="e.g. Asthma"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowRegister(false); setRegError(null); }}
                    className="px-3.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={regSubmitting}
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {regSubmitting ? 'Creating account...' : 'Create Account'}
                  </button>
                </div>
              </form>

              <div className="mt-4 text-center text-[11px] text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setShowRegister(false); setRegError(null); }}
                  className="font-medium text-teal-600 hover:text-teal-500 underline cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 text-center text-[11px] text-slate-400">
          Academic College Demonstration Project · HIPAA-inspired design
        </div>
      </div>
    </div>
  );
};
