import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Room } from '../types';
import { useAuth } from '../context/AuthContext';
import { Bed, CheckCircle2, AlertCircle, Wrench, Clock, ShieldCheck } from 'lucide-react';

export const RoomsView: React.FC = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const data = await api.getRooms();
      setRooms(data);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleStatusChange = async (roomId: string, newStatus: string) => {
    try {
      await api.updateRoomStatus(roomId, newStatus);
      fetchRooms();
    } catch (err: any) {
      alert(err.message || 'Failed to update room status');
    }
  };

  const filteredRooms = rooms.filter(r => {
    if (filterType && r.type !== filterType) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="text-emerald-700 font-medium">Available</span>;
      case 'OCCUPIED':
        return <span className="text-amber-700 font-medium">Occupied</span>;
      case 'MAINTENANCE':
        return <span className="text-rose-700 font-medium">Maintenance</span>;
      case 'RESERVED':
        return <span className="text-blue-700 font-medium">Reserved</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const canEdit = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Hospital Ward &amp; Bed Allocation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor inpatient wards, ICU suites, operation theatres, and room availability.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Room Types</option>
            <option value="ICU">ICU</option>
            <option value="GENERAL_WARD">General Ward</option>
            <option value="SEMI_PRIVATE">Semi-Private</option>
            <option value="PRIVATE">Private Deluxe</option>
            <option value="OPERATION_THEATRE">Operation Theatre</option>
            <option value="EMERGENCY">Emergency Bay</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="RESERVED">Reserved</option>
          </select>
        </div>
      </div>

      {/* Room Occupancy Grid */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading hospital rooms...</div>
      ) : filteredRooms.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">No rooms match your filter.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredRooms.map(room => (
            <div
              key={room.id}
              className={`p-4 rounded-xl border bg-white shadow-xs space-y-3 transition-all ${
                room.status === 'AVAILABLE'
                  ? 'border-emerald-200'
                  : room.status === 'OCCUPIED'
                  ? 'border-amber-200'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-slate-900">{room.roomNumber}</span>
                <span className="text-[11px] font-mono text-slate-400">Floor {room.floor}</span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  {room.type.replace('_', ' ')}
                </span>
                <span className="text-[11px] text-slate-500">
                  {room.department?.name || 'Inpatient Services'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Daily Rate</span>
                  <span className="font-mono font-bold text-teal-700">${room.dailyRate.toFixed(2)}</span>
                </div>
                <div>
                  {getStatusBadge(room.status)}
                </div>
              </div>

              {canEdit && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1">
                  <select
                    value={room.status}
                    onChange={e => handleStatusChange(room.id, e.target.value)}
                    className="w-full text-[11px] border border-slate-200 rounded p-1 bg-slate-50 text-slate-700"
                  >
                    <option value="AVAILABLE">Mark Available</option>
                    <option value="OCCUPIED">Mark Occupied</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="RESERVED">Reserved</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
