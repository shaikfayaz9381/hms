import React, { useState, useEffect } from 'react';
import { Database, AlertTriangle, CheckCircle2, RefreshCw, Settings2 } from 'lucide-react';
import { api } from '../services/api';
import { DatabaseStatus } from '../types';
import { SupabaseGuideModal } from './SupabaseGuideModal';

export const DatabaseStatusBanner: React.FC = () => {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.getDatabaseStatus();
      setStatus(res);
    } catch {
      setStatus({
        isConnected: false,
        isSupabase: false,
        host: 'Offline',
        databaseName: 'None',
        configuredUrl: 'Unreachable',
        message: 'Could not contact database status service.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <>
      <div className="bg-slate-900 text-slate-200 text-xs px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-100">Database Engine:</span>
          </div>

          {status?.isConnected ? (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{status.isSupabase ? 'Supabase PostgreSQL' : 'Local PostgreSQL'}</span>
              <span className="text-slate-500 font-mono">({status.host} · {status.latencyMs}ms)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Local Demonstration Mode (Supabase not connected)</span>
              <span className="text-slate-400 font-mono hidden sm:inline">— All 14 tables simulated with seed data</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Supabase Setup Guide</span>
          </button>

          <button
            onClick={fetchStatus}
            disabled={loading}
            title="Refresh database connectivity check"
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <SupabaseGuideModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        status={status}
        onRefresh={fetchStatus}
      />
    </>
  );
};
