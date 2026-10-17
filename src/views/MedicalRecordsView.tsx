import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MedicalRecord, Patient, Doctor } from '../types';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, X, Search, ShieldCheck, Stethoscope } from 'lucide-react';

export const MedicalRecordsView: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: user?.doctorId || '',
    chiefComplaint: '',
    diagnosis: '',
    treatmentPlan: '',
    clinicalNotes: '',
    labResults: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await api.getMedicalRecords();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    if (user?.role === 'ADMIN' || user?.role === 'DOCTOR') {
      api.getPatients().then(p => {
        setPatients(p);
        if (p.length > 0 && !formData.patientId) {
          setFormData(prev => ({ ...prev, patientId: p[0].id }));
        }
      });
      api.getDoctors().then(d => {
        setDoctors(d);
        if (d.length > 0 && !formData.doctorId) {
          setFormData(prev => ({ ...prev, doctorId: user.doctorId || d[0].id }));
        }
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.createMedicalRecord(formData);
      setIsModalOpen(false);
      setFormData({
        patientId: patients[0]?.id || '',
        doctorId: user?.doctorId || (doctors[0]?.id || ''),
        chiefComplaint: '',
        diagnosis: '',
        treatmentPlan: '',
        clinicalNotes: '',
        labResults: '',
      });
      fetchRecords();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create medical record');
    } finally {
      setSubmitting(false);
    }
  };

  const canCreate = user?.role === 'DOCTOR' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Clinical Medical Records &amp; Diagnoses</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Documented patient consultations, differential diagnoses, and treatment plans.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Diagnosis</span>
          </button>
        )}
      </div>

      {/* Medical Records Cards */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading clinical records...</div>
      ) : records.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">No medical records on file.</div>
      ) : (
        <div className="space-y-4">
          {records.map(rec => (
            <div key={rec.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-50 text-teal-700 rounded-md">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{rec.diagnosis}</h3>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {rec.recordNumber} · Patient: {rec.patient?.firstName} {rec.patient?.lastName} ({rec.patient?.medicalRecordNumber})
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="font-medium text-slate-800">
                    Dr. {rec.doctor?.user?.firstName} {rec.doctor?.user?.lastName}
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {new Date(rec.recordedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Chief Complaint</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {rec.chiefComplaint}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Prescribed Treatment Plan</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {rec.treatmentPlan}
                  </p>
                </div>
              </div>

              {(rec.clinicalNotes || rec.labResults) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                  {rec.clinicalNotes && (
                    <div>
                      <span className="font-semibold text-slate-500 text-[11px] block">Doctor's Clinical Notes</span>
                      <p className="text-slate-600 italic text-[11px]">{rec.clinicalNotes}</p>
                    </div>
                  )}
                  {rec.labResults && (
                    <div>
                      <span className="font-semibold text-slate-500 text-[11px] block">Diagnostic &amp; Lab Observations</span>
                      <p className="text-slate-600 font-mono text-[11px]">{rec.labResults}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Medical Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Create Clinical Medical Record</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient *</label>
                  <select
                    required
                    value={formData.patientId}
                    onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.medicalRecordNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Attending Physician *</label>
                  <select
                    required
                    value={formData.doctorId}
                    onChange={e => setFormData({ ...formData, doctorId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.user?.firstName} {d.user?.lastName} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chief Complaint *</label>
                <input
                  type="text"
                  required
                  placeholder="Primary symptom described by patient..."
                  value={formData.chiefComplaint}
                  onChange={e => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Diagnosis *</label>
                <input
                  type="text"
                  required
                  placeholder="Confirmed or differential medical diagnosis..."
                  value={formData.diagnosis}
                  onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Treatment Plan *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Medication regimen, lifestyle instructions, or referrals..."
                  value={formData.treatmentPlan}
                  onChange={e => setFormData({ ...formData, treatmentPlan: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinical Observations</label>
                  <textarea
                    rows={2}
                    placeholder="Physical examination notes..."
                    value={formData.clinicalNotes}
                    onChange={e => setFormData({ ...formData, clinicalNotes: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Diagnostic / Lab Results</label>
                  <textarea
                    rows={2}
                    placeholder="Lab values, ECG findings, imaging..."
                    value={formData.labResults}
                    onChange={e => setFormData({ ...formData, labResults: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving Diagnosis...' : 'Save Diagnosis Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
