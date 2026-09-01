import React from 'react';
import { ShieldCheck, UserCheck, Shield, Cpu, Wifi, Radio } from 'lucide-react';
import { Incident } from '../types/database.types';

interface TelemetrySidebarProps {
  isListening?: boolean;
  isSupabaseLive?: boolean;
  incidents?: Incident[];
}

export const TelemetrySidebar: React.FC<TelemetrySidebarProps> = ({
  isListening = false,
  isSupabaseLive = true,
  incidents = [],
}) => {
  const criticalCount = incidents.filter((i) => i.hazard_level === 'critical' && i.status === 'open').length;
  const totalCount = incidents.length;

  return (
    <aside
      id="telemetry-sidebar"
      className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-5 lg:p-6 flex flex-col gap-6 backdrop-blur-sm"
    >
      {/* Personnel Active */}
      <div>
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
          Personnel Active
        </h2>
        <div className="space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-[10px]">
              JD
            </div>
            <div>
              <p className="text-xs font-bold text-white">John Doe</p>
              <p className="text-[10px] text-slate-500 font-mono">Response Team A • Deck 4</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-[10px]">
              SM
            </div>
            <div>
              <p className="text-xs font-bold text-white">Sarah Miller</p>
              <p className="text-[10px] text-slate-500 font-mono">Lead Safety Inspector</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 font-bold text-[10px]">
              AL
            </div>
            <div>
              <p className="text-xs font-bold text-white">HazVox Voice Agent</p>
              <p className="text-[10px] text-slate-500 font-mono">
                {isListening ? 'Streaming Audio (Active)' : 'Voice Node Standby'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 opacity-60">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 font-bold text-[10px]">
              RK
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400">Ryan Knight</p>
              <p className="text-[10px] text-slate-600 font-mono">Off-shift</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Telemetry */}
      <div>
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
          System Telemetry
        </h2>
        <div className="space-y-3 bg-black/40 p-4 border border-slate-800 rounded-xl">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase">CPU Load</span>
              <span className="text-[10px] font-mono text-emerald-400">12%</span>
            </div>
            <div className="h-1.5 bg-slate-800 w-full rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[12%] rounded-full"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Latency</span>
              <span className="text-[10px] font-mono text-emerald-400">24ms</span>
            </div>
            <div className="h-1.5 bg-slate-800 w-full rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[24%] rounded-full"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase">API Uptime</span>
              <span className="text-[10px] font-mono text-emerald-400">99.9%</span>
            </div>
            <div className="h-1.5 bg-slate-800 w-full rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[99.9%] rounded-full"></div>
            </div>
          </div>

          <div className="pt-1 flex justify-between items-center text-[10px] font-mono border-t border-slate-800/80 mt-2">
            <span className="text-slate-500">DATABASE SYNC</span>
            <span className={isSupabaseLive ? 'text-cyan-400 font-bold' : 'text-amber-400 font-bold'}>
              {isSupabaseLive ? 'POSTGRES REALTIME' : 'LOCAL CACHE READY'}
            </span>
          </div>
        </div>
      </div>

      {/* Secure Protocol Badge */}
      <div className="mt-auto pt-5 border-t border-slate-800">
        <div className="flex items-center gap-2 mb-1.5">
          <Shield className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">
            Secure Protocol
          </span>
        </div>
        <p className="text-[9px] font-mono text-slate-500 leading-tight">
          End-to-end encrypted dispatch channel. HazVox v2.4.0
        </p>
      </div>
    </aside>
  );
};
