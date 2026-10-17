import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Prescription, Medicine, Patient, Doctor } from '../types';
import { useAuth } from '../context/AuthContext';
import { Pill, Plus, X, Trash2, Package, Check, AlertTriangle, ArrowUpDown } from 'lucide-react';

export const PrescriptionsView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'medicines'>('prescriptions');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // New Prescription Modal State
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [rxForm, setRxForm] = useState({
    patientId: '',
    doctorId: user?.doctorId || '',
    generalAdvice: '',
    items: [
      { medicineId: '', dosage: '500mg', frequency: 'Twice daily (BD)', duration: '5 days', instructions: 'Take after food', quantity: 10 },
    ],
  });
  const [rxError, setRxError] = useState<string | null>(null);
  const [submittingRx, setSubmittingRx] = useState(false);

  // Restock State
  const [restockMed, setRestockMed] = useState<Medicine | null>(null);
  const [restockAmount, setRestockAmount] = useState(50);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rxs, meds] = await Promise.all([
        api.getPrescriptions(),
        api.getMedicines(),
      ]);
      setPrescriptions(rxs);
      setMedicines(meds);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (user?.role === 'ADMIN' || user?.role === 'DOCTOR') {
      api.getPatients().then(p => {
        setPatients(p);
        if (p.length > 0 && !rxForm.patientId) {
          setRxForm(prev => ({ ...prev, patientId: p[0].id }));
        }
      });
      api.getDoctors().then(d => {
        setDoctors(d);
        if (d.length > 0 && !rxForm.doctorId) {
          setRxForm(prev => ({ ...prev, doctorId: user.doctorId || d[0].id }));
        }
      });
    }
  }, [user]);

  const handleAddItem = () => {
    setRxForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { medicineId: medicines[0]?.id || '', dosage: '1 tablet', frequency: 'Once daily (OD)', duration: '7 days', instructions: 'Take with water', quantity: 7 },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (rxForm.items.length <= 1) return;
    setRxForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setRxForm(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleRxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRxError(null);

    // Validate item selection
    const missingMed = rxForm.items.some(i => !i.medicineId);
    if (missingMed) {
      setRxError('Please select a valid medicine for all prescribed items.');
      return;
    }

    setSubmittingRx(true);
    try {
      await api.createPrescription(rxForm);
      setIsRxModalOpen(false);
      fetchData();
    } catch (err: any) {
      setRxError(err.message || 'Failed to issue prescription');
    } finally {
      setSubmittingRx(false);
    }
  };

  const handleRestock = async () => {
    if (!restockMed) return;
    try {
      await api.updateMedicineStock(restockMed.id, restockAmount);
      setRestockMed(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update medicine inventory');
    }
  };

  const canWriteRx = user?.role === 'DOCTOR' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Digital Pharmacy &amp; Prescriptions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Prescription writing, pharmaceutical catalog, dosage tracking, and inventory control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented View Switcher */}
          <div className="flex items-center p-1 bg-slate-200/70 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'prescriptions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Prescriptions
            </button>
            <button
              onClick={() => setActiveTab('medicines')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'medicines' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pharmacy Inventory ({medicines.length})
            </button>
          </div>

          {canWriteRx && activeTab === 'prescriptions' && (
            <button
              onClick={() => {
                if (medicines.length > 0 && !rxForm.items[0].medicineId) {
                  setRxForm(prev => ({
                    ...prev,
                    items: [{ ...prev.items[0], medicineId: medicines[0].id }],
                  }));
                }
                setIsRxModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Write Prescription</span>
            </button>
          )}
        </div>
      </div>

      {/* PRESCRIPTIONS TAB */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading prescriptions...</div>
          ) : prescriptions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No prescriptions issued yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prescriptions.map(rx => (
                <div key={rx.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-teal-50 text-teal-700 rounded-md">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 block font-mono">{rx.prescriptionNo}</span>
                        <span className="text-[11px] text-slate-500">
                          Patient: {rx.patient?.firstName} {rx.patient?.lastName} ({rx.patient?.medicalRecordNumber})
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-[11px] font-mono text-slate-400">
                      {new Date(rx.issuedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Prescribed Medications
                    </span>
                    <div className="divide-y divide-slate-100 bg-slate-50/60 rounded-lg p-2.5 border border-slate-100">
                      {rx.items?.map(it => (
                        <div key={it.id} className="py-1.5 first:pt-0 last:pb-0 text-xs">
                          <div className="flex justify-between font-semibold text-slate-800">
                            <span>{it.medicine?.name} ({it.dosage})</span>
                            <span className="font-mono text-teal-700 text-[11px]">Qty: {it.quantity}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {it.frequency} · {it.duration}
                            {it.instructions && <span className="text-slate-400 font-normal"> · {it.instructions}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {rx.generalAdvice && (
                    <div className="text-xs text-slate-600 bg-teal-50/40 p-2 rounded border border-teal-100">
                      <strong>Physician Advice:</strong> {rx.generalAdvice}
                    </div>
                  )}

                  <div className="pt-2 text-[11px] text-slate-400 flex justify-between">
                    <span>Prescribed by: Dr. {rx.doctor?.user?.firstName} {rx.doctor?.user?.lastName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PHARMACY MEDICINES TAB */}
      {activeTab === 'medicines' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Item Code</th>
                  <th className="py-3 px-4">Drug Name &amp; Generic</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Dosage Form</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Stock Level</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map(m => {
                  const isLowStock = m.stockQuantity <= m.reorderLevel;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">{m.code}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-[11px] text-slate-400">{m.genericName || '—'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{m.category}</td>
                      <td className="py-3 px-4 text-slate-600">{m.dosageForm} ({m.strength})</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">${m.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono">
                        <span className={`inline-flex items-center gap-1 font-semibold ${isLowStock ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {isLowStock && <AlertTriangle className="w-3.5 h-3.5" />}
                          <span>{m.stockQuantity} units</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST') && (
                          <button
                            onClick={() => {
                              setRestockMed(m);
                              setRestockAmount(50);
                            }}
                            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded font-medium transition-colors cursor-pointer"
                          >
                            Restock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Digital Prescription Builder Modal */}
      {isRxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Digital Prescription Builder</h3>
              </div>
              <button onClick={() => setIsRxModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRxSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {rxError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {rxError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
                  <select
                    required
                    value={rxForm.patientId}
                    onChange={e => setRxForm({ ...rxForm, patientId: e.target.value })}
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
                  <label className="block font-semibold text-slate-700 mb-1">Prescribing Doctor *</label>
                  <select
                    required
                    value={rxForm.doctorId}
                    onChange={e => setRxForm({ ...rxForm, doctorId: e.target.value })}
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

              {/* Dynamic Medicine Items */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Prescribed Medicine Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Medicine</span>
                  </button>
                </div>

                {rxForm.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between font-semibold text-slate-700">
                      <span>Item #{idx + 1}</span>
                      {rxForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-600 hover:text-rose-800 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Medicine *</label>
                        <select
                          required
                          value={item.medicineId}
                          onChange={e => handleItemChange(idx, 'medicineId', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white"
                        >
                          {medicines.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.strength}) - Stock: {m.stockQuantity}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Dosage *</label>
                        <input
                          type="text"
                          required
                          value={item.dosage}
                          onChange={e => handleItemChange(idx, 'dosage', e.target.value)}
                          placeholder="e.g. 500mg, 1 tablet"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Frequency *</label>
                        <input
                          type="text"
                          required
                          value={item.frequency}
                          onChange={e => handleItemChange(idx, 'frequency', e.target.value)}
                          placeholder="e.g. Twice daily (BD)"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Duration *</label>
                        <input
                          type="text"
                          required
                          value={item.duration}
                          onChange={e => handleItemChange(idx, 'duration', e.target.value)}
                          placeholder="e.g. 5 days"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Quantity *</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={item.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">General Physician Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Drink plenty of water. Return if fever persists beyond 3 days."
                  value={rxForm.generalAdvice}
                  onChange={e => setRxForm({ ...rxForm, generalAdvice: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRxModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRx}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  {submittingRx ? 'Issuing...' : 'Issue Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Medicine Modal */}
      {restockMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 p-5 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">
              Restock {restockMed.name} ({restockMed.strength})
            </h3>
            <p className="text-slate-500">
              Current inventory: <strong className="font-mono text-slate-800">{restockMed.stockQuantity} units</strong>
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Units to Add</label>
              <input
                type="number"
                min={1}
                value={restockAmount}
                onChange={e => setRestockAmount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRestockMed(null)}
                className="px-3 py-1.5 border border-slate-200 rounded font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRestock}
                className="px-3 py-1.5 bg-teal-600 text-white rounded font-semibold"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
