import React, { useState } from 'react';
import { Database, X, Check, Copy, ExternalLink, Terminal, ShieldAlert } from 'lucide-react';
import { DatabaseStatus } from '../types';

interface SupabaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DatabaseStatus | null;
  onRefresh: () => void;
}

export const SupabaseGuideModal: React.FC<SupabaseGuideModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefresh,
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const sampleEnvText = `# Supabase PostgreSQL Configuration
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
JWT_SECRET="medpulse-super-secret-jwt-key-min-32-chars"
PORT=3000
NODE_ENV=development`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Supabase PostgreSQL Connection Guide</h3>
              <p className="text-xs text-slate-500">Local Development with Hosted Supabase Database (₹0 / $0 Cost)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Current Status Box */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">Current Status:</span>
                {status?.isConnected ? (
                  <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Connected ({status.isSupabase ? 'Supabase PostgreSQL' : 'Local PostgreSQL'})
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Local Demonstration Mode (Supabase Not Yet Configured)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Host: {status?.host || 'None'} · Latency: {status?.latencyMs ? `${status.latencyMs}ms` : 'N/A'}
              </p>
              <p className="text-xs text-slate-600">{status?.message}</p>
            </div>
            <button
              onClick={onRefresh}
              className="text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition-colors"
            >
              Test Connection
            </button>
          </div>

          {/* Step 1: Create Supabase Project */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs">1</span>
              <span>Create a Free Supabase Project</span>
            </div>
            <p className="text-slate-600 text-xs pl-7">
              Visit Supabase and sign in with your GitHub or Google account. Create a new project (e.g., <code className="text-teal-700 font-mono">medpulse-hospital</code>) under the free plan.
            </p>
            <div className="pl-7">
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-teal-600 font-medium hover:text-teal-700 hover:underline"
              >
                <span>Open Supabase Dashboard</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Step 2: Obtain Connection String */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs">2</span>
              <span>Copy PostgreSQL Connection Strings</span>
            </div>
            <p className="text-slate-600 text-xs pl-7">
              In your Supabase project, navigate to <strong>Project Settings &gt; Database &gt; Connection string</strong>. Select the <strong>URI</strong> tab and choose <strong>Transaction Pooler (Port 6543)</strong> for runtime and <strong>Direct (Port 5432)</strong> for migrations.
            </p>
          </div>

          {/* Step 3: Configure .env */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs">3</span>
              <span>Set Environment Variables in .env</span>
            </div>
            <p className="text-slate-600 text-xs pl-7">
              Create a <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.env</code> file in the project root with your database credentials:
            </p>
            <div className="pl-7 relative">
              <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                {sampleEnvText}
              </pre>
              <button
                onClick={() => copyToClipboard(sampleEnvText, 'env')}
                className="absolute top-2 right-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded flex items-center gap-1"
              >
                {copied === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'env' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Step 4: Run Migrations & Seed */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs">4</span>
              <span>Push Schema &amp; Seed Demonstration Data</span>
            </div>
            <p className="text-slate-600 text-xs pl-7">
              Run the following terminal commands to apply the Prisma relational schema and seed demo records:
            </p>
            <div className="pl-7 space-y-1.5">
              <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-xs font-mono flex items-center justify-between">
                <code>npm run db:push &amp;&amp; npm run db:seed</code>
                <button
                  onClick={() => copyToClipboard('npm run db:push && npm run db:seed', 'cmd')}
                  className="text-slate-400 hover:text-slate-200"
                >
                  {copied === 'cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Offline note */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Local Offline Fallback:</span> If working without an active internet connection, you can point <code className="font-mono">DATABASE_URL</code> to a local PostgreSQL instance on Debian (<code className="font-mono">postgresql://postgres:postgres@localhost:5432/hospital_db</code>) without changing the Prisma architecture.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
