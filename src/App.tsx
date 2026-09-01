import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Radio,
  Activity,
  AlertTriangle,
  Flame,
  Terminal,
  Cpu,
  RefreshCw,
  HardHat,
} from 'lucide-react';
import type { Incident, IncidentStatus, InsertIncident } from './types/database.types';
import {
  fetchIncidents,
  createIncident,
  updateIncidentStatus,
  subscribeToIncidents,
  isSupabaseConfigured,
} from './lib/supabase';
import { useVoiceAgent } from './hooks/useVoiceAgent';
import { TopNavbar } from './components/TopNavbar';
import { VoiceAgentSidebar } from './components/VoiceAgentSidebar';
import { LiveIncidentFeed } from './components/LiveIncidentFeed';
import { SchemaModal } from './components/SchemaModal';
import { ManualReportModal } from './components/ManualReportModal';
import { ToastNotification, ToastData } from './components/ToastNotification';
import { TelemetrySidebar } from './components/TelemetrySidebar';
import { playAlertSound } from './lib/soundEffects';

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState<boolean>(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const isSupabaseLive = isSupabaseConfigured();

  // Toast dispatcher
  const showHazardToast = useCallback(
    (incident: Incident) => {
      const newToast: ToastData = {
        id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        hazardLevel: incident.hazard_level,
        equipmentId: incident.equipment_id,
        location: incident.location,
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

      if (soundEnabled) {
        playAlertSound(incident.hazard_level);
      }

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 5000);
    },
    [soundEnabled]
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load Incidents
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchIncidents();
      setIncidents(data);
    } catch (e) {
      console.error('Failed to load incident feed:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Supabase Realtime & Cross-tab Subscription
    const unsubscribe = subscribeToIncidents((payload) => {
      if (payload.new) {
        const newInc = payload.new;
        setIncidents((prev) => {
          // If already exists, replace; otherwise prepend
          const exists = prev.some((i) => i.id === newInc.id);
          if (exists) {
            return prev.map((i) => (i.id === newInc.id ? newInc : i));
          }
          return [newInc, ...prev];
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  // Voice Agent Hook with Optimistic Callback
  const voiceAgent = useVoiceAgent((newIncident) => {
    // Optimistically prepend to feed
    setIncidents((prev) => {
      const filtered = prev.filter((i) => i.id !== newIncident.id);
      return [newIncident, ...filtered];
    });

    // Flash Toast HUD
    showHazardToast(newIncident);
  });

  // Toggle Status
  const handleToggleStatus = async (id: string, currentStatus: IncidentStatus) => {
    const newStatus: IncidentStatus = currentStatus === 'open' ? 'resolved' : 'open';

    // Optimistic state update
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: newStatus } : inc))
    );

    await updateIncidentStatus(id, newStatus);
  };

  // Manual Dispatch Submit
  const handleManualSubmit = async (data: InsertIncident) => {
    const created = await createIncident(data);
    setIncidents((prev) => [created, ...prev.filter((i) => i.id !== created.id)]);
    showHazardToast(created);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-yellow-400 selection:text-slate-950">
      {/* Top Industrial Command Bar */}
      <TopNavbar
        incidents={incidents}
        isListening={voiceAgent.isListening}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        onOpenManualModal={() => setIsManualModalOpen(true)}
        isSupabaseLive={isSupabaseLive}
      />

      {/* Main Industrial Dispatch Grid */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Hackathon Dispatch Center Sub-Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-yellow-400">
              <HardHat className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white uppercase tracking-wider font-mono">
                  HazVox Command Center
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-black bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 uppercase">
                  REAL-TIME VOICE AI
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Verbal industrial hazard detection with automated AssemblyAI tool calling & Supabase synchronization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-300">DISPATCH NETWORK ACTIVE</span>
          </div>
        </div>

        {/* Responsive Multi-Column Command Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Live Audio Controls Sidebar */}
          <div className="lg:col-span-4 xl:col-span-4 w-full">
            <VoiceAgentSidebar voiceAgent={voiceAgent} />
          </div>

          {/* Center Column: Main Content (Live Incident Feed) */}
          <div className="lg:col-span-8 xl:col-span-5 w-full">
            <LiveIncidentFeed
              incidents={incidents}
              onToggleStatus={handleToggleStatus}
              onRefresh={loadData}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column: System Telemetry & Personnel */}
          <div className="lg:col-span-12 xl:col-span-3 w-full">
            <TelemetrySidebar
              incidents={incidents}
              isListening={voiceAgent.isListening}
              isSupabaseLive={isSupabaseLive}
            />
          </div>
        </div>
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs font-mono text-slate-600">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>HAZVOX AI • INDUSTRIAL SAFETY COMMAND CENTER</span>
          <span>ASSEMBLYAI VOICE AGENT + SUPABASE POSTGRESQL + NEXT.JS/REACT</span>
        </div>
      </footer>

      {/* Modals & HUD Notifications */}
      <SchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

      <ManualReportModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSubmit={handleManualSubmit}
      />

      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
