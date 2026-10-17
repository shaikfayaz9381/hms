import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, Stethoscope, UserCheck, HeartPulse, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';

export const LoginView: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

  const demoAccounts: { role: UserRole; title: string; email: string; icon: any; color: string }[] = [
    {
      role: 'ADMIN',
      title: 'Hospital Administrator',
      email: 'admin@hospital.local',
      icon: ShieldCheck,
      color: 'border-slate-300 hover:border-slate-500 bg-white',
    },
    {
      role: 'DOCTOR',
      title: 'Attending Doctor',
      email: 'doctor@hospital.local',
      icon: Stethoscope,
      color: 'border-teal-200 hover:border-teal-400 bg-teal-50/50',
    },
    {
      role: 'RECEPTIONIST',
      title: 'Front Desk Reception',
      email: 'reception@hospital.local',
      icon: UserCheck,
      color: 'border-blue-200 hover:border-blue-400 bg-blue-50/50',
    },
    {
      role: 'PATIENT',
      title: 'Patient Portal',
      email: 'patient@hospital.local',
      icon: HeartPulse,
      color: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/50',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 bg-teal-600 text-white rounded-2xl shadow-md mb-3">
          <Activity className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">MedPulse Clinical System</h2>
        <p className="mt-1 text-xs text-slate-500">
          Supabase PostgreSQL · Express REST API · Prisma ORM
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Work Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="doctor@hospital.local"
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

          {/* 1-Click Quick Demo Switcher */}
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
        </div>

        <div className="mt-4 text-center text-[11px] text-slate-400">
          Academic College Demonstration Project · HIPAA-inspired design
        </div>
      </div>
    </div>
  );
};
