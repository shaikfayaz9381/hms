import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Users,
  UserCheck,
  Calendar,
  CreditCard,
  Bed,
  TrendingUp,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

export const DashboardView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        if (user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST') {
          const s = await api.getDashboardStatistics();
          setStats(s);
          const apts = await api.getAppointments();
          setAppointments(apts.slice(0, 6));
        } else if (user?.role === 'DOCTOR') {
          const apts = await api.getAppointments({ doctorId: user.doctorId });
          setAppointments(apts);
          const recs = await api.getMedicalRecords({ doctorId: user.doctorId });
          setRecords(recs.slice(0, 5));
        } else if (user?.role === 'PATIENT') {
          const apts = await api.getAppointments({ patientId: user.patientId });
          setAppointments(apts);
          const recs = await api.getMedicalRecords({ patientId: user.patientId });
          setRecords(recs);
          const rxs = await api.getPrescriptions({ patientId: user.patientId });
          setPrescriptions(rxs);
          const bls = await api.getBills({ patientId: user.patientId });
          setBills(bls);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading clinical workspace...</span>
        </div>
      </div>
    );
  }

  // --- ADMIN & RECEPTIONIST DASHBOARD ---
  if (user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST') {
    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {user.role === 'ADMIN' ? 'Hospital Administration Console' : 'Reception & Patient Triage Desk'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive hospital overview and real-time clinical activity metrics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('appointments')}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              + Schedule Appointment
            </button>
            <button
              onClick={() => onNavigate('patients')}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              + Register Patient
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Total Registered Patients</span>
              <Users className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats?.totalPatients || 0}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Active clinical MRN records</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Attending Physicians</span>
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats?.totalDoctors || 0}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Across 6 specialized departments</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Bed Occupancy</span>
              <Bed className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats?.occupancyRate || 0}%
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {stats?.occupiedRooms || 0} / {stats?.totalRooms || 0} rooms currently occupied
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Simulated Revenue</span>
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              ₹{stats?.totalRevenue ? stats.totalRevenue.toFixed(2) : '0.00'}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Pending: ₹{stats?.pendingRevenue ? stats.pendingRevenue.toFixed(2) : '0.00'}
            </span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Consultation Load */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Department Consultation Volume</h3>
                <p className="text-xs text-slate-500">Appointment distribution across clinical wings</p>
              </div>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.departmentDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                    itemStyle={{ color: '#5eead4' }}
                  />
                  <Bar dataKey="appointments" fill="#0d9488" radius={[4, 4, 0, 0]} name="Appointments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 7-Day Activity Trend */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Weekly Patient Consultation Activity</h3>
                <p className="text-xs text-slate-500">Scheduled vs. Completed consultations</p>
              </div>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.activityTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="scheduled" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} name="Scheduled" />
                  <Line type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Appointments Queue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Appointments Queue</h3>
              <p className="text-xs text-slate-500">Latest consultations booked across all departments</p>
            </div>
            <button
              onClick={() => onNavigate('appointments')}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {appointments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No appointments scheduled today.</div>
            ) : (
              appointments.map(apt => (
                <div key={apt.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">
                        {apt.patient?.firstName} {apt.patient?.lastName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">({apt.patient?.medicalRecordNumber})</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-teal-700 font-medium">
                        Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName} ({apt.doctor?.department?.code})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{apt.reasonForVisit}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-medium text-slate-700">{apt.timeSlot}</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {new Date(apt.scheduledAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- DOCTOR DASHBOARD ---
  if (user?.role === 'DOCTOR') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Welcome back, Dr. {user.firstName} {user.lastName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Consultation schedule, pending clinical notes, and assigned patient histories.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('records')}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              + Create Medical Diagnosis
            </button>
            <button
              onClick={() => onNavigate('prescriptions')}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              + Write Prescription
            </button>
          </div>
        </div>

        {/* Doctor Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">My Assigned Appointments</span>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {appointments.length}
            </div>
            <span className="text-[11px] text-teal-600 mt-1 block">Active patient queue</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Recorded Diagnoses</span>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {records.length}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Saved in patient charts</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Consultation Fee</span>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              ₹{user.doctor?.consultationFee || 150}.00
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Standard outpatient slot</span>
          </div>
        </div>

        {/* Doctor's Today Consultation Queue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">Today's Patient Schedule</h3>
            </div>
            <span className="text-xs text-slate-500">{appointments.length} Consultations</span>
          </div>

          <div className="divide-y divide-slate-100">
            {appointments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                You have no scheduled consultations for today.
              </div>
            ) : (
              appointments.map(apt => (
                <div key={apt.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">
                        {apt.patient?.firstName} {apt.patient?.lastName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">({apt.patient?.medicalRecordNumber})</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[11px] text-slate-600 font-mono">Blood: {apt.patient?.bloodGroup || 'N/A'}</span>
                    </div>
                    <p className="text-xs text-slate-600">Chief Complaint: {apt.reasonForVisit}</p>
                    {apt.vitalsNotes && (
                      <p className="text-[11px] text-teal-700 font-mono">{apt.vitalsNotes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-mono font-semibold text-slate-900">{apt.timeSlot}</div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{apt.status}</span>
                    </div>
                    <button
                      onClick={() => onNavigate('records')}
                      className="px-2.5 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded text-xs font-medium transition-colors cursor-pointer"
                    >
                      Diagnose
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- PATIENT DASHBOARD ---
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Personal Health Portal — {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Access your clinical history, upcoming doctor consultations, prescriptions, and medical bills.
        </p>
      </div>

      {/* Patient Health Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Medical Record No.</span>
          <div className="text-lg font-bold text-teal-700 font-mono mt-1">
            {user?.patient?.medicalRecordNumber || 'MRN-2026-0001'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Blood Group: {user?.patient?.bloodGroup || 'O+'}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Upcoming Visits</span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length}
          </div>
          <span className="text-[11px] text-teal-600 mt-1 block">Scheduled appointments</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Active Prescriptions</span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {prescriptions.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Pharmacy medications</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Pending Statements</span>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-1">
            {bills.filter(b => b.status === 'PENDING').length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Outstanding invoices</span>
        </div>
      </div>

      {/* Patient Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Appointment */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Upcoming Doctor Appointments</h3>
            <button
              onClick={() => onNavigate('appointments')}
              className="text-xs text-teal-600 font-semibold hover:underline cursor-pointer"
            >
              Book New
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              You have no upcoming appointments scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 3).map(apt => (
                <div key={apt.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}</span>
                    <span className="font-mono text-teal-700">{apt.timeSlot}</span>
                  </div>
                  <p className="text-slate-600">{apt.reasonForVisit}</p>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Date: {new Date(apt.scheduledAt).toLocaleDateString()} · Dept: {apt.doctor?.department?.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Prescriptions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Prescribed Medications</h3>
            <button
              onClick={() => onNavigate('prescriptions')}
              className="text-xs text-teal-600 font-semibold hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          {prescriptions.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No active prescriptions on file.
            </div>
          ) : (
            <div className="space-y-3">
              {prescriptions.map(rx => (
                <div key={rx.id} className="p-3 bg-teal-50/50 rounded-lg border border-teal-100 text-xs space-y-2">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>Prescription #{rx.prescriptionNo}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(rx.issuedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {rx.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between text-slate-700">
                        <span className="font-medium text-teal-950">
                          {item.medicine?.name || 'Medication'} ({item.dosage})
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">{item.frequency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
