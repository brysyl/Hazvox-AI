import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  MapPin,
  Cpu,
  Search,
  Filter,
  Volume2,
  RefreshCw,
  Share2,
  Check,
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  ArrowUpDown,
  Building,
} from 'lucide-react';
import type { Incident, HazardLevel, IncidentStatus } from '../types/database.types';

interface LiveIncidentFeedProps {
  incidents: Incident[];
  onToggleStatus: (id: string, currentStatus: IncidentStatus) => Promise<void>;
  onRefresh: () => void;
  isLoading: boolean;
}

export const LiveIncidentFeed: React.FC<LiveIncidentFeedProps> = ({
  incidents,
  onToggleStatus,
  onRefresh,
  isLoading,
}) => {
  const [levelFilter, setLevelFilter] = useState<'all' | HazardLevel>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Derived metrics
  const totalCount = incidents.length;
  const criticalCount = incidents.filter(
    (i) => i.hazard_level === 'critical' && i.status === 'open'
  ).length;
  const mediumCount = incidents.filter(
    (i) => i.hazard_level === 'medium' && i.status === 'open'
  ).length;
  const resolvedCount = incidents.filter((i) => i.status === 'resolved').length;

  const uniqueSectors = Array.from(
    new Set(incidents.map((i) => i.location.split('-')[0]?.trim() || i.location))
  ).length;

  // Filtered incidents
  const filteredIncidents = incidents.filter((incident) => {
    if (levelFilter !== 'all' && incident.hazard_level !== levelFilter) return false;
    if (statusFilter !== 'all' && incident.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEquip = incident.equipment_id.toLowerCase().includes(q);
      const matchLoc = incident.location.toLowerCase().includes(q);
      const matchDesc = incident.description.toLowerCase().includes(q);
      return matchEquip || matchLoc || matchDesc;
    }
    return true;
  });

  const handleCopy = (inc: Incident) => {
    const text = `[HAZVOX ALERT - ${inc.hazard_level.toUpperCase()}] Equipment: ${inc.equipment_id} | Location: ${inc.location} | Details: ${inc.description}`;
    navigator.clipboard.writeText(text);
    setCopiedId(inc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

      if (diffMinutes < 1) return 'JUST NOW';
      if (diffMinutes < 60) return `${diffMinutes}m AGO`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h AGO`;
      return date.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  return (
    <section id="live-incident-feed" className="flex flex-col gap-5">
      {/* Header with Active Incidents and Summary Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            Active Incidents
          </h2>
          <p className="text-sm text-slate-500 font-mono">
            Monitoring Real-time Safety Database
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-red-950/30 border border-red-500/50 rounded text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
            {criticalCount} Critical
          </div>
          <div className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-slate-400 text-[10px] font-black uppercase tracking-widest">
            {resolvedCount} Resolved
          </div>
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric: Total */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Total Logged</span>
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1 text-2xl font-mono font-black text-slate-100">
            {totalCount}
          </div>
          <div className="text-[9px] font-mono text-slate-500 mt-0.5">
            ALL RECORDED EVENTS
          </div>
        </div>

        {/* Metric: Critical Active */}
        <div
          className={`border rounded-lg p-3.5 flex flex-col justify-between transition-all ${
            criticalCount > 0
              ? 'bg-red-950/20 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-black">
              Critical Alerts
            </span>
            <Flame className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="mt-1 text-2xl font-mono font-black text-red-400">
            {criticalCount}
          </div>
          <div className="text-[9px] font-mono text-red-400/70 mt-0.5">
            IMMEDIATE RISK ACTION
          </div>
        </div>

        {/* Metric: Medium Warnings */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-400 font-bold">
              Medium Warnings
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="mt-1 text-2xl font-mono font-black text-yellow-400">
            {mediumCount}
          </div>
          <div className="text-[9px] font-mono text-yellow-500/70 mt-0.5">
            PENDING INSPECTION
          </div>
        </div>

        {/* Metric: Resolved Rate */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
              Resolved
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 text-2xl font-mono font-black text-emerald-400">
            {resolvedCount}
          </div>
          <div className="text-[9px] font-mono text-emerald-500/70 mt-0.5">
            DISPATCH CLOSED
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="incident-search-input"
            type="text"
            placeholder="Search unit, sector, or hazard..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-yellow-400/50"
          />
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-[10px] font-mono font-bold text-slate-500 hidden sm:inline mr-1">
            LEVEL:
          </span>
          {(['all', 'critical', 'medium', 'low'] as const).map((lvl) => (
            <button
              key={lvl}
              id={`filter-level-${lvl}`}
              onClick={() => setLevelFilter(lvl)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase font-black transition-colors whitespace-nowrap ${
                levelFilter === lvl
                  ? lvl === 'critical'
                    ? 'bg-red-600 text-white'
                    : lvl === 'medium'
                    ? 'bg-yellow-400 text-black'
                    : lvl === 'low'
                    ? 'bg-slate-300 text-black'
                    : 'bg-slate-200 text-slate-950'
                  : 'bg-black/40 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Status Filters & Refresh */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-slate-800 text-[10px] font-mono font-bold">
            {(['all', 'open', 'resolved'] as const).map((st) => (
              <button
                key={st}
                id={`filter-status-${st}`}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded capitalize ${
                  statusFilter === st
                    ? 'bg-slate-800 text-yellow-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            id="refresh-feed-btn"
            onClick={onRefresh}
            title="Sync latest live hazards"
            className="p-1.5 rounded-lg bg-black/40 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-yellow-400 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-yellow-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Incident Cards Stream */}
      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-10 text-center flex flex-col items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/60 mb-2" />
            <h3 className="text-sm font-bold font-mono text-slate-300 uppercase tracking-wider">
              No Matching Hazards Found
            </h3>
            <p className="text-xs font-mono text-slate-500 mt-1 max-w-sm">
              All safety reports in this filter category have been resolved or no incidents match your query.
            </p>
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const isCritical = incident.hazard_level === 'critical';
            const isMedium = incident.hazard_level === 'medium';
            const isOpen = incident.status === 'open';

            return (
              <article
                key={incident.id}
                id={`incident-card-${incident.id}`}
                className={
                  isCritical && isOpen
                    ? 'p-5 bg-red-900/10 border-2 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.2)] rounded-lg flex flex-col sm:flex-row items-start gap-5 relative overflow-hidden'
                    : isMedium && isOpen
                    ? 'p-5 bg-slate-900 border border-slate-800 rounded-lg flex flex-col sm:flex-row items-start gap-5'
                    : 'p-5 bg-slate-900 border border-slate-800 rounded-lg flex flex-col sm:flex-row items-start gap-5 opacity-65 hover:opacity-100 transition-opacity'
                }
              >
                {/* Immediate Alert Tag for Critical Incidents */}
                {isCritical && isOpen && (
                  <div className="absolute top-0 right-0 p-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                    Immediate Alert
                  </div>
                )}

                {/* Left Hazard Level Icon Box */}
                <div
                  className={
                    isCritical && isOpen
                      ? 'w-12 h-12 bg-red-600 flex items-center justify-center rounded shrink-0 shadow-lg'
                      : isMedium && isOpen
                      ? 'w-12 h-12 bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center rounded shrink-0 text-yellow-400'
                      : 'w-12 h-12 bg-slate-800 flex items-center justify-center rounded shrink-0 text-slate-500'
                  }
                >
                  {isCritical && isOpen ? (
                    <AlertTriangle className="w-6 h-6 text-white stroke-[2.5]" />
                  ) : isMedium && isOpen ? (
                    <AlertTriangle className="w-6 h-6 text-yellow-400" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className={`text-sm font-black uppercase tracking-wider ${
                        isCritical && isOpen
                          ? 'text-red-500'
                          : isMedium && isOpen
                          ? 'text-yellow-500'
                          : 'text-slate-500'
                      }`}
                    >
                      {isCritical && isOpen
                        ? 'CRITICAL HAZARD'
                        : isMedium && isOpen
                        ? 'MEDIUM HAZARD'
                        : isOpen
                        ? 'LOW PRIORITY'
                        : 'RESOLVED HAZARD'}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      ID: {incident.equipment_id}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                    {incident.description}
                  </h3>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] font-mono text-slate-400 mb-3">
                    <p>
                      <span className="text-slate-600 uppercase font-bold">Location:</span>{' '}
                      {incident.location}
                    </p>
                    <p>
                      <span className="text-slate-600 uppercase font-bold">Status:</span>{' '}
                      <span className={isOpen ? 'text-slate-300 font-bold' : 'text-emerald-400'}>
                        {isOpen ? 'Dispatched' : 'Resolved'}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-600 uppercase font-bold">Reported:</span>{' '}
                      {formatTimestamp(incident.created_at)}
                    </p>
                  </div>

                  {/* Audio Transcript Speech Bubble */}
                  {incident.audio_transcript && (
                    <div className="mb-3 bg-black/40 border border-slate-800 rounded p-2.5 text-xs font-mono text-slate-300">
                      <span className="text-[10px] text-yellow-500 uppercase tracking-wider block font-bold mb-0.5">
                        VOICE DISPATCH TRANSCRIPT:
                      </span>
                      <span className="italic text-slate-200">
                        "{incident.audio_transcript}"
                      </span>
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      id={`toggle-incident-${incident.id}`}
                      onClick={() => onToggleStatus(incident.id, incident.status)}
                      className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                        isOpen
                          ? 'bg-slate-800 hover:bg-emerald-950 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-emerald-400'
                          : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-slate-800 hover:text-slate-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isOpen ? 'MARK RESOLVED' : 'RESOLVED ✓'}</span>
                    </button>

                    <button
                      onClick={() => handleCopy(incident)}
                      className="p-1.5 rounded bg-black/40 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-mono flex items-center gap-1 transition-colors"
                      title="Copy alert"
                    >
                      {copiedId === incident.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400">COPIED</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span className="text-[10px]">SHARE</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};
