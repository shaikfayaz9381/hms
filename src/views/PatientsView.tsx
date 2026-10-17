import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Patient } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Plus,
  AlertCircle,
  FileText,
  Calendar,
  Pill,
  CreditCard,
  X,
  UserPlus,
  Heart,
  ShieldAlert,
} from 'lucide-react';

export const PatientsView: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [bloodFilter, setBloodFilter] = useState('');
  
  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [chartLoading, setChartLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: 'O+',
    contactNumber: '',
    emergencyContact: '',
    address: '',
    allergies: '',
    chronicConditions: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await api.getPatients({
        search: search || undefined,
        gender: genderFilter || undefined,
        bloodGroup: bloodFilter || undefined,
      });
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search, genderFilter, bloodFilter]);

  const handleOpenChart = async (id: string) => {
    setChartLoading(true);
    try {
      const full = await api.getPatient(id);
      setSelectedPatient(full);
    } catch (err: any) {
      alert(err.message || 'Could not load patient chart');
    } finally {
      setChartLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.createPatient(formData as any);
      setIsRegisterOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'MALE',
        bloodGroup: 'O+',
        contactNumber: '',
        emergencyContact: '',
        address: '',
        allergies: '',
        chronicConditions: '',
      });
      fetchPatients();
    } catch (err: any) {
      setFormError(err.message || 'Failed to register patient');
    } finally {
      setSubmitting(false);
    }
  };

  const canRegister = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Patient Directory & Clinical Charts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized outpatient and inpatient records with Medical Record Numbers (MRN).
          </p>
        </div>
        {canRegister && (
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, MRN, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <select
          value={genderFilter}
          onChange={e => setGenderFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>

        <select
          value={bloodFilter}
          onChange={e => setBloodFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Blood Types</option>
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

      {/* Patients Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading patient records...</div>
        ) : patients.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No patients found matching your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">MRN</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Age / Gender</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Allergies / Critical Info</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map(p => {
                  const birthYear = new Date(p.dateOfBirth).getFullYear();
                  const age = !isNaN(birthYear) ? 2026 - birthYear : 'N/A';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-teal-700">
                        {p.medicalRecordNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {p.firstName} {p.lastName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {age} yrs · {p.gender}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800">
                        {p.bloodGroup || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {p.contactNumber}
                      </td>
                      <td className="py-3 px-4">
                        {p.allergies ? (
                          <span className="text-[11px] text-rose-700 font-medium">
                            {p.allergies}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">None on record</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenChart(p.id)}
                          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded font-medium transition-colors cursor-pointer"
                        >
                          View Chart
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Patient Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Patient Clinical Registration</h3>
              </div>
              <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
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
                    value={formData.bloodGroup}
                    onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1-555-0100"
                    value={formData.contactNumber}
                    onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="Name (+1-555-0101)"
                    value={formData.emergencyContact}
                    onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="Street, City, Sector"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Known Allergies</label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Peanuts"
                    value={formData.allergies}
                    onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chronic Conditions</label>
                  <input
                    type="text"
                    placeholder="e.g. Hypertension, Asthma"
                    value={formData.chronicConditions}
                    onChange={e => setFormData({ ...formData, chronicConditions: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  {submitting ? 'Registering...' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Clinical Chart Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Patient Clinical Chart — {selectedPatient.firstName} {selectedPatient.lastName}
                </h3>
                <p className="text-xs text-teal-700 font-mono">
                  {selectedPatient.medicalRecordNumber} · Blood Type: {selectedPatient.bloodGroup || 'N/A'} · Gender: {selectedPatient.gender}
                </p>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Allergy Alert Banner */}
              {selectedPatient.allergies && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-rose-800">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold">Clinical Allergy Warning:</span> {selectedPatient.allergies}
                  </div>
                </div>
              )}

              {/* Patient Core Demographics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-400 block">Phone</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.contactNumber}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Emergency Contact</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.emergencyContact || '—'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Date of Birth</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Chronic Conditions</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.chronicConditions || 'None'}</span>
                </div>
              </div>

              {/* Medical Records / Diagnoses */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>Clinical Diagnoses &amp; Consultation Notes</span>
                </h4>
                {selectedPatient.medicalRecords?.length === 0 ? (
                  <p className="text-slate-400">No clinical diagnoses recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedPatient.medicalRecords?.map(rec => (
                      <div key={rec.id} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-teal-800">Diagnosis: {rec.diagnosis}</span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {new Date(rec.recordedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-600"><strong>Chief Complaint:</strong> {rec.chiefComplaint}</p>
                        <p className="text-slate-600"><strong>Treatment Plan:</strong> {rec.treatmentPlan}</p>
                        {rec.clinicalNotes && <p className="text-slate-500 italic">Notes: {rec.clinicalNotes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prescriptions */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                  <Pill className="w-4 h-4 text-teal-600" />
                  <span>Prescriptions History</span>
                </h4>
                {selectedPatient.prescriptions?.length === 0 ? (
                  <p className="text-slate-400">No prescriptions issued.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedPatient.prescriptions?.map(rx => (
                      <div key={rx.id} className="p-3 bg-teal-50/40 border border-teal-100 rounded-lg space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span>{rx.prescriptionNo}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(rx.issuedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="space-y-1 mt-1">
                          {rx.items?.map(it => (
                            <div key={it.id} className="flex justify-between text-slate-700">
                              <span>{it.medicine?.name || 'Drug'} ({it.dosage}) — {it.frequency}</span>
                              <span className="font-mono text-slate-500">Qty: {it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Close Chart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
