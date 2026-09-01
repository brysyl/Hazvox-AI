import React from 'react';
import {
  ShieldAlert,
  Radio,
  Activity,
  Database as DatabaseIcon,
  Volume2,
  VolumeX,
  Code2,
  PlusCircle,
  Clock,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import type { Incident } from '../types/database.types';

interface TopNavbarProps {
  incidents: Incident[];
  isListening: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSchemaModal: () => void;
  onOpenManualModal: () => void;
  isSupabaseLive: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  incidents,
  isListening,
  soundEnabled,
  onToggleSound,
  onOpenSchemaModal,
  onOpenManualModal,
  isSupabaseLive,
}) => {
  const criticalCount = incidents.filter(
    (inc) => inc.hazard_level === 'critical' && inc.status === 'open'
  ).length;

  const openCount = incidents.filter((inc) => inc.status === 'open').length;

  return (
    <header
      id="top-navbar"
      className="h-16 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40"
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-yellow-400 flex items-center justify-center rounded-sm text-black shadow-[0_0_15px_rgba(250,204,21,0.3)] shrink-0">
          <ShieldAlert className="w-5 h-5 text-black stroke-[2.5]" />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">
            HazVox <span className="text-yellow-400">AI</span>
          </h1>
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] uppercase font-mono tracking-widest font-black bg-slate-800 text-slate-300 rounded border border-slate-700">
            v2.4.0
          </span>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isListening ? 'bg-emerald-500 animate-ping' : 'bg-emerald-500 animate-pulse'
            }`}
          />
          <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest font-semibold">
            {isListening ? 'Voice Agent Active' : 'Voice Agent Standby'}
          </span>
        </div>

        <div className="h-8 w-[1px] bg-slate-800"></div>

        <div className="text-right hidden lg:block">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
            System Status
          </p>
          <p className="text-xs font-mono text-slate-300">
            {criticalCount > 0
              ? `${criticalCount} Critical Hazard${criticalCount > 1 ? 's' : ''}`
              : 'All Nodes Nominal'}
          </p>
        </div>

        <div className="h-8 w-[1px] bg-slate-800 hidden lg:block"></div>

        <div className="hidden xl:flex items-center gap-2">
          <DatabaseIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            DB:
          </span>
          <span
            className={`text-xs font-mono font-bold ${
              isSupabaseLive ? 'text-cyan-400' : 'text-yellow-400'
            }`}
          >
            {isSupabaseLive ? 'REALTIME POSTGRES' : 'LOCAL CACHE'}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        <button
          id="toggle-sound-btn"
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Alert Audio' : 'Unmute Alert Audio'}
          className={`p-2 rounded border text-xs font-mono transition-colors flex items-center gap-1.5 ${
            soundEnabled
              ? 'bg-slate-900 border-slate-700 text-yellow-400 hover:bg-slate-800'
              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline text-[10px] font-mono font-bold">
            {soundEnabled ? 'AUDIO ON' : 'MUTED'}
          </span>
        </button>

        <button
          id="open-schema-modal-btn"
          onClick={onOpenSchemaModal}
          className="px-2.5 py-1.5 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-yellow-400 text-xs font-mono flex items-center gap-1.5 transition-colors"
        >
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
            SQL Schema
          </span>
        </button>

        <button
          id="open-manual-report-btn"
          onClick={onOpenManualModal}
          className="px-3 py-1.5 rounded border border-yellow-400/40 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(250,204,21,0.15)]"
        >
          <PlusCircle className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-[10px] uppercase tracking-wider">Log Hazard</span>
        </button>
      </div>
    </header>
  );
};
