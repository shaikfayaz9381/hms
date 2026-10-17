import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Appointment, Doctor, Patient } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Plus,
  AlertCircle,
  CheckCircle2,
  X,
  User,
  Stethoscope,
  Filter,
} from 'lucide-react';

export const AppointmentsView: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookData, setBookData] = useState({
    patientId: user?.patientId || '',
    doctorId: '',
    scheduledAt: new Date().toISOString().split('T')[0],
    timeSlot: '09:30 AM',
    reasonForVisit: '',
    vitalsNotes: '',
  });
  const [bookError, setBookError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  ];

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await api.getAppointments({
        status: statusFilter || undefined,
        date: dateFilter || undefined,
      });
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    async function loadSelectData() {
      try {
        const [docs, pats] = await Promise.all([
          api.getDoctors(),
          api.getPatients(),
        ]);
        setDoctors(docs);
        setPatients(pats);
        if (docs.length > 0 && !bookData.doctorId) {
          setBookData(prev => ({ ...prev, doctorId: docs[0].id }));
        }
        if (pats.length > 0 && !bookData.patientId && user?.role !== 'PATIENT') {
          setBookData(prev => ({ ...prev, patientId: pats[0].id }));
        }
      } catch (err) {
        console.error('Failed to load doctors/patients for booking:', err);
      }
    }
    loadSelectData();
  }, [user]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookError(null);
    setBooking(true);
    try {
      await api.createAppointment(bookData);
      setIsBookModalOpen(false);
      setBookData({
        patientId: user?.patientId || (patients[0]?.id || ''),
        doctorId: doctors[0]?.id || '',
        scheduledAt: new Date().toISOString().split('T')[0],
        timeSlot: '09:30 AM',
        reasonForVisit: '',
        vitalsNotes: '',
      });
      fetchAppointments();
    } catch (err: any) {
      setBookError(err.message || 'Slot conflict or booking failure');
    } finally {
      setBooking(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await api.updateAppointmentStatus(id, newStatus);
      fetchAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <span className="text-teal-700 font-medium">Scheduled</span>;
      case 'CONFIRMED':
        return <span className="text-blue-700 font-medium">Confirmed</span>;
      case 'IN_PROGRESS':
        return <span className="text-amber-700 font-medium">In Progress</span>;
      case 'COMPLETED':
        return <span className="text-emerald-700 font-medium">Completed</span>;
      case 'CANCELLED':
        return <span className="text-rose-700 font-medium">Cancelled</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Appointment Management &amp; Scheduling</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Book consultations, manage triage statuses, and prevent time-slot conflicts.
          </p>
        </div>

        <button
          onClick={() => {
            setBookError(null);
            setIsBookModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600">Filters:</span>
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono"
        />

        {(statusFilter || dateFilter) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setDateFilter('');
            }}
            className="text-teal-600 hover:underline font-semibold"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No appointments found matching your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Apt #</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Attending Doctor</th>
                  <th className="py-3 px-4">Date &amp; Slot</th>
                  <th className="py-3 px-4">Reason for Visit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-teal-700">
                      {apt.appointmentNo}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {apt.patient?.firstName} {apt.patient?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {apt.patient?.medicalRecordNumber}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {apt.doctor?.department?.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="font-semibold text-slate-900">{apt.timeSlot}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(apt.scheduledAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                      {apt.reasonForVisit}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(apt.status)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {apt.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleStatusUpdate(apt.id, 'CONFIRMED')}
                          className="px-2 py-0.5 text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-medium cursor-pointer"
                        >
                          Confirm
                        </button>
                      )}
                      {(apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED') && (
                        <button
                          onClick={() => handleStatusUpdate(apt.id, 'IN_PROGRESS')}
                          className="px-2 py-0.5 text-[11px] bg-amber-50 text-amber-700 hover:bg-amber-100 rounded font-medium cursor-pointer"
                        >
                          Triage
                        </button>
                      )}
                      {apt.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleStatusUpdate(apt.id, 'COMPLETED')}
                          className="px-2 py-0.5 text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-medium cursor-pointer"
                        >
                          Complete
                        </button>
                      )}
                      {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleStatusUpdate(apt.id, 'CANCELLED')}
                          className="px-2 py-0.5 text-[11px] bg-rose-50 text-rose-700 hover:bg-rose-100 rounded font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book Appointment Modal with Conflict Detection */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Schedule Clinical Appointment</h3>
              </div>
              <button onClick={() => setIsBookModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {bookError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Scheduling Conflict:</span>
                    <span>{bookError}</span>
                  </div>
                </div>
              )}

              {/* Patient Selector */}
              {user?.role !== 'PATIENT' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
                  <select
                    required
                    value={bookData.patientId}
                    onChange={e => setBookData({ ...bookData, patientId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.medicalRecordNumber})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 block">Patient</span>
                  <span className="font-semibold text-slate-800">
                    {user?.firstName} {user?.lastName} ({user?.patient?.medicalRecordNumber})
                  </span>
                </div>
              )}

              {/* Doctor Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attending Physician *</label>
                <select
                  required
                  value={bookData.doctorId}
                  onChange={e => setBookData({ ...bookData, doctorId: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.user?.firstName} {d.user?.lastName} — {d.department?.name} (${d.consultationFee})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    value={bookData.scheduledAt}
                    onChange={e => setBookData({ ...bookData, scheduledAt: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Slot *</label>
                  <select
                    required
                    value={bookData.timeSlot}
                    onChange={e => setBookData({ ...bookData, timeSlot: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white font-mono"
                  >
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reason for Visit */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Visit / Chief Complaint *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe current symptoms or consultation goal..."
                  value={bookData.reasonForVisit}
                  onChange={e => setBookData({ ...bookData, reasonForVisit: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Vitals Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Triage Vitals (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. BP: 120/80 mmHg, Pulse: 72 bpm, Temp: 98.6F"
                  value={bookData.vitalsNotes}
                  onChange={e => setBookData({ ...bookData, vitalsNotes: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={booking}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  {booking ? 'Checking Availability...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
