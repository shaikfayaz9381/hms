import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Doctor, Department } from '../types';
import { Stethoscope, Building2, Award, DollarSign, Calendar, Clock } from 'lucide-react';

export const DoctorsView: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [docs, depts] = await Promise.all([
          api.getDoctors(selectedDept || undefined),
          api.getDepartments(),
        ]);
        setDoctors(docs);
        setDepartments(depts);
      } catch (err) {
        console.error('Failed to load doctors:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedDept]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Physicians &amp; Clinical Departments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Board-certified medical specialists, consultation fees, and hospital department wings.
          </p>
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Filter Department:</label>
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Departments Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {departments.map(dept => (
          <button
            key={dept.id}
            onClick={() => setSelectedDept(selectedDept === dept.id ? '' : dept.id)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedDept === dept.id
                ? 'bg-teal-50 border-teal-500 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="font-bold text-xs text-slate-900">{dept.name}</div>
            <div className="text-[11px] font-mono text-teal-700">{dept.code}</div>
            <div className="text-[10px] text-slate-400 mt-1">
              {dept._count?.doctors || 0} Doctors · {dept._count?.rooms || 0} Rooms
            </div>
          </button>
        ))}
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading physician profiles...</div>
      ) : doctors.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">No doctors found for this department.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Dr. {doc.user?.firstName} {doc.user?.lastName}
                  </h3>
                  <span className="text-xs text-teal-700 font-medium block">
                    {doc.specialization}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Lic: {doc.licenseNumber}
                  </span>
                </div>
                <div className="p-2 bg-teal-50 rounded-lg text-teal-700">
                  <Stethoscope className="w-4 h-4" />
                </div>
              </div>

              <div className="text-xs text-slate-600 line-clamp-2">
                {doc.bio || 'General medical consultation and patient care.'}
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Department</span>
                  <span className="font-semibold text-slate-800">{doc.department?.name}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Experience</span>
                  <span className="font-semibold text-slate-800 font-mono">{doc.experienceYears} Years</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Consultation Fee</span>
                  <span className="font-bold text-teal-700 font-mono">${doc.consultationFee.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Contact</span>
                  <span className="font-mono text-slate-700 text-[11px]">{doc.user?.phoneNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
