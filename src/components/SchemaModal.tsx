import React, { useState } from 'react';
import { X, Copy, Check, Database, Terminal, Shield, Key } from 'lucide-react';

interface SchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCHEMA_CONTENT = `-- HazVox AI: Industrial Safety Incident Reporting Schema (Supabase PostgreSQL)
CREATE TYPE hazard_level_enum AS ENUM ('low', 'medium', 'critical');
CREATE TYPE incident_status_enum AS ENUM ('open', 'resolved');

CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hazard_level hazard_level_enum NOT NULL DEFAULT 'low',
    equipment_id VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status incident_status_enum NOT NULL DEFAULT 'open',
    location VARCHAR(255) NOT NULL,
    audio_transcript TEXT,
    reported_by VARCHAR(255) DEFAULT 'HazVox Voice Agent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Demo RLS Policies
CREATE POLICY "Allow public select for hackathon demo" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Allow public insert for hackathon demo" ON public.incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for hackathon demo" ON public.incidents FOR UPDATE USING (true);

-- Realtime Channel Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;`;

export const SchemaModal: React.FC<SchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_CONTENT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-black font-mono text-white uppercase tracking-wider">
                Supabase PostgreSQL Schema & RLS
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Batch 1 Database Foundation (schema.sql)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs text-slate-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-black/40 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
                <Database className="w-4 h-4" />
                <span>TABLE: incidents</span>
              </div>
              <p className="text-[11px] text-slate-400">
                UUID, Enums (hazard_level, status), timestamps, audio transcript logs.
              </p>
            </div>

            <div className="p-3 bg-black/40 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5 text-yellow-400 font-bold mb-1">
                <Shield className="w-4 h-4" />
                <span>ROW LEVEL SECURITY</span>
              </div>
              <p className="text-[11px] text-slate-400">
                RLS enabled with public hackathon policies for instant live testing.
              </p>
            </div>

            <div className="p-3 bg-black/40 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                <Terminal className="w-4 h-4" />
                <span>REALTIME PUB</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Postgres changes streamed over WebSockets directly to React frontend.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between bg-black/60 px-4 py-2 rounded-t-lg border-t border-x border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold">SQL SCRIPT (schema.sql)</span>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1.5 transition-colors font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'COPIED!' : 'COPY SQL'}</span>
              </button>
            </div>
            <pre className="p-4 bg-black/80 border border-slate-800 rounded-b-lg overflow-x-auto text-[11px] text-emerald-400 leading-relaxed font-mono">
              {SQL_SCHEMA_CONTENT}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-yellow-400 hover:bg-yellow-300 text-black font-mono font-black text-xs uppercase tracking-wider transition-colors"
          >
            CLOSE VIEWER
          </button>
        </div>
      </div>
    </div>
  );
};
