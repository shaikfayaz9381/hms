import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Bill, Patient } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ShieldAlert,
  X,
  Trash2,
} from 'lucide-react';

export const BillingView: React.FC = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // New Invoice Modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    patientId: '',
    notes: 'Outpatient consultation & pharmacy invoice',
    taxRate: 0.05,
    discount: 0,
    items: [
      { description: 'Physician Consultation Fee', quantity: 1, unitPrice: 150.0 },
    ],
  });
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Simulation Feedback
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const data = await api.getBills({
        status: statusFilter || undefined,
      });
      setBills(data);
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
    if (user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST') {
      api.getPatients().then(p => {
        setPatients(p);
        if (p.length > 0 && !invoiceForm.patientId) {
          setInvoiceForm(prev => ({ ...prev, patientId: p[0].id }));
        }
      });
    }
  }, [statusFilter, user]);

  const handleSimulatePayment = async (id: string, billNumber: string) => {
    try {
      const res = await api.payBill(id);
      setPaymentNotice(
        `Invoice ${billNumber} updated to PAID in Supabase PostgreSQL (Simulated academic clearance — no real funds transferred).`
      );
      fetchBills();
      setTimeout(() => setPaymentNotice(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Payment update failed');
    }
  };

  const handleAddItem = () => {
    setInvoiceForm(prev => ({
      ...prev,
      items: [...prev.items, { description: 'Medication or Hospital Service', quantity: 1, unitPrice: 25.0 }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (invoiceForm.items.length <= 1) return;
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setInvoiceForm(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceError(null);
    setSubmittingInvoice(true);
    try {
      await api.createBill(invoiceForm);
      setIsInvoiceModalOpen(false);
      fetchBills();
    } catch (err: any) {
      setInvoiceError(err.message || 'Failed to generate invoice');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const canCreate = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  return (
    <div className="space-y-6">
      {/* Simulation Policy Notice */}
      <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-200 text-teal-900 text-xs flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Academic Simulation Notice:</span> All billing statements, invoices, and payment statuses are strictly simulated for academic demonstration. No third-party payment gateways (Stripe, Razorpay, UPI) are connected, and zero monetary transactions occur.
        </div>
      </div>

      {paymentNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{paymentNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Hospital Invoicing &amp; Simulated Billing</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consolidated itemized statements for consultations, pharmacy prescriptions, and ward charges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Invoices</option>
            <option value="PENDING">Pending Payment</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {canCreate && (
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading invoices...</div>
      ) : bills.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">No invoices on file.</div>
      ) : (
        <div className="space-y-4">
          {bills.map(bill => (
            <div key={bill.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-50 text-teal-700 rounded-md">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 font-mono block">
                      {bill.billNumber}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Patient: {bill.patient?.firstName} {bill.patient?.lastName} ({bill.patient?.medicalRecordNumber})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900 font-mono block">
                      ${bill.totalAmount.toFixed(2)}
                    </span>
                    <span className={`text-[11px] font-semibold font-mono ${bill.status === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {bill.status}
                    </span>
                  </div>

                  {bill.status === 'PENDING' && (
                    <button
                      onClick={() => handleSimulatePayment(bill.id, bill.billNumber)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      Simulate Pay
                    </button>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 font-semibold border-b border-slate-100">
                      <th className="py-1 px-2">Description</th>
                      <th className="py-1 px-2 text-center">Qty</th>
                      <th className="py-1 px-2 text-right">Unit Price</th>
                      <th className="py-1 px-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {bill.items?.map(item => (
                      <tr key={item.id}>
                        <td className="py-1.5 px-2 font-medium">{item.description}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{item.quantity}</td>
                        <td className="py-1.5 px-2 text-right font-mono">${item.unitPrice.toFixed(2)}</td>
                        <td className="py-1.5 px-2 text-right font-mono font-semibold">${item.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Subtotal & Taxes Breakdown */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between text-xs text-slate-500 gap-2">
                <span>{bill.notes || 'Hospital clinical billing service.'}</span>
                <div className="flex gap-4 font-mono text-[11px] text-right">
                  <span>Subtotal: ${bill.subTotal.toFixed(2)}</span>
                  <span>Tax: ${bill.taxAmount.toFixed(2)}</span>
                  {bill.discount > 0 && <span className="text-emerald-600">Discount: -${bill.discount.toFixed(2)}</span>}
                  <span className="font-bold text-slate-900">Total: ${bill.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Invoice Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Generate Simulated Invoice</h3>
              </div>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvoiceSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {invoiceError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {invoiceError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={invoiceForm.patientId}
                  onChange={e => setInvoiceForm({ ...invoiceForm, patientId: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.medicalRecordNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Items */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Billable Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {invoiceForm.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Service or Medication name"
                      value={item.description}
                      onChange={e => handleItemChange(idx, 'description', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded"
                    />
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1.5 border border-slate-300 rounded font-mono text-center"
                    />
                    <input
                      type="number"
                      required
                      min={0}
                      step={0.5}
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={e => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1.5 border border-slate-300 rounded font-mono text-right"
                    />
                    {invoiceForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Notes</label>
                <input
                  type="text"
                  value={invoiceForm.notes}
                  onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvoice}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  {submittingInvoice ? 'Generating...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
