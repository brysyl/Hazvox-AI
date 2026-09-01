import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Activity,
  Cpu,
  Terminal,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Play,
  Volume2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { UseVoiceAgentReturn } from '../hooks/useVoiceAgent';
import { REPORT_SAFETY_HAZARD_TOOL } from '../lib/assemblyAiSchema';

interface VoiceAgentSidebarProps {
  voiceAgent: UseVoiceAgentReturn;
}

const SAMPLE_COMMANDS = [
  {
    title: '🚨 Critical Thermal Surge',
    command: 'Emergency alert! Critical thermal surge on Turbine TURBINE-04 in Sector 9, heavy smoke and temperature over 400 degrees.',
    level: 'critical',
  },
  {
    title: '⚠️ Medium Hydraulic Drop',
    command: 'Logging medium hazard on Conveyor CONVEYOR-CV12 in Warehouse B, hydraulic pressure dropping below 35 PSI with belt friction.',
    level: 'medium',
  },
  {
    title: '🟡 Low Vibration Anomaly',
    command: 'Low priority maintenance notice: Minor vibrational oscillation anomaly observed on Pump PUMP-P09 in Facility Alpha.',
    level: 'low',
  },
  {
    title: '⚡ Critical Arc Flash Risk',
    command: 'Critical safety breach! Visible electrical sparking on Substation Breaker TRANSFORMER-T3 in West Yard Sector 7.',
    level: 'critical',
  },
];

export const VoiceAgentSidebar: React.FC<VoiceAgentSidebarProps> = ({ voiceAgent }) => {
  const {
    status,
    isListening,
    transcript,
    interimTranscript,
    transcriptHistory,
    toolCallStatus,
    latestToolCall,
    audioLevel,
    errorMessage,
    startSession,
    endSession,
    simulateVoiceCommand,
  } = voiceAgent;

  const [showToolSchema, setShowToolSchema] = useState(false);

  // Generate 16 bars for the audio equalizer
  const bars = Array.from({ length: 16 }, (_, i) => {
    const factor = Math.sin((i / 16) * Math.PI);
    const heightPercent = isListening
      ? Math.max(12, Math.min(100, (audioLevel * factor * 160 + (i % 3) * 15 + Math.random() * 20)))
      : 8;
    return heightPercent;
  });

  return (
    <aside
      id="voice-agent-sidebar"
      className="flex flex-col gap-6 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden"
    >
      {/* Live Control Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            Live Control
          </h2>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-slate-800 text-[10px] font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status === 'listening'
                  ? 'bg-emerald-400 animate-ping'
                  : status === 'processing'
                  ? 'bg-yellow-400 animate-pulse'
                  : status === 'error'
                  ? 'bg-red-400'
                  : 'bg-slate-600'
              }`}
            />
            <span className="text-slate-400 uppercase font-semibold">{status}</span>
          </div>
        </div>

        <div className="relative group cursor-pointer my-2">
          <div
            className={`absolute inset-0 ${
              isListening ? 'bg-red-600/20' : 'bg-yellow-400/10'
            } blur-xl rounded-full transition-all`}
          />
          <button
            id="voice-agent-toggle-btn"
            onClick={isListening ? endSession : startSession}
            className={`relative w-full aspect-square max-w-[200px] mx-auto rounded-full bg-slate-900 border-4 border-slate-800 flex flex-col items-center justify-center gap-3 shadow-2xl transition-all ${
              isListening ? 'hover:border-red-600/50' : 'hover:border-yellow-400/50'
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.5)]'
                  : 'bg-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)]'
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-black" />
              )}
            </div>
            <span className="text-sm font-black text-white uppercase tracking-widest">
              {isListening ? 'Stop Agent' : 'Start Agent'}
            </span>
            <span
              className={`text-[10px] font-mono font-bold ${
                isListening ? 'text-red-500/80 animate-pulse' : 'text-slate-500'
              }`}
            >
              {isListening ? 'RECORDING...' : 'STANDBY READY'}
            </span>
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-2.5 bg-red-950/60 border border-red-500/50 rounded-lg text-red-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Audio Stream Equalizer */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            Audio Stream
          </h2>
          <span className="text-[10px] font-mono text-slate-500">
            {isListening ? `${Math.round(audioLevel * 100)}% GAIN` : 'OFFLINE'}
          </span>
        </div>

        <div className="flex items-end justify-between h-12 gap-1 px-2 bg-black/40 border border-slate-800 rounded-lg py-1">
          {bars.map((height, idx) => {
            const barColor = isListening
              ? idx % 4 === 2
                ? 'bg-red-500'
                : idx % 4 === 3
                ? 'bg-red-400'
                : idx % 2 === 0
                ? 'bg-slate-600'
                : 'bg-slate-700'
              : 'bg-slate-800';

            return (
              <div
                key={idx}
                className={`w-2 rounded-t-sm transition-all duration-75 ${barColor}`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Real-time Tool Call Execution Card */}
      {toolCallStatus !== 'idle' && (
        <div>
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
            Tool Execution
          </h2>
          <div className="bg-slate-950 border border-yellow-400/40 rounded-xl p-3 text-xs font-mono space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                <Zap className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                <span>report_safety_hazard()</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                  toolCallStatus === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : toolCallStatus === 'executing'
                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 animate-pulse'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {toolCallStatus}
              </span>
            </div>

            {latestToolCall && (
              <div className="bg-black/50 rounded p-2 border border-slate-800 space-y-1 text-slate-300 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase">hazard_level:</span>
                  <span
                    className={`font-bold uppercase ${
                      latestToolCall.hazard_level === 'critical'
                        ? 'text-red-400'
                        : latestToolCall.hazard_level === 'medium'
                        ? 'text-yellow-400'
                        : 'text-cyan-400'
                    }`}
                  >
                    {latestToolCall.hazard_level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase">equipment_id:</span>
                  <span className="text-yellow-400 font-bold">{latestToolCall.equipment_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase">location:</span>
                  <span className="text-slate-200">{latestToolCall.location}</span>
                </div>
                <div className="pt-1 border-t border-slate-800/80 text-slate-400 italic">
                  "{latestToolCall.description}"
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transcript Window */}
      <div className="flex-1 flex flex-col min-h-0">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
          Transcript
        </h2>
        <div className="flex-1 bg-black/40 rounded border border-slate-800 p-4 font-mono text-xs overflow-y-auto max-h-48 min-h-[110px] space-y-2">
          {interimTranscript && (
            <p className="text-yellow-400 mb-2 leading-relaxed flex items-start gap-1">
              <span className="inline-block w-2 h-4 bg-yellow-500 animate-pulse shrink-0 mt-0.5"></span>
              <span>"{interimTranscript}"</span>
            </p>
          )}

          {transcriptHistory.length === 0 && !interimTranscript && (
            <div className="text-slate-600 italic text-[11px] py-4 text-center">
              Awaiting live radio transmission. Press button above or trigger sample dispatch below.
            </div>
          )}

          {transcriptHistory.map((item, idx) => (
            <div key={idx} className="mb-2">
              <p className="text-slate-400 text-[10px] mb-0.5">
                <span className="text-yellow-500">[{item.timestamp}]</span> Voice Dispatch:
              </p>
              <p className="text-white leading-relaxed text-[11px]">"{item.text}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* Test Voice Prompts (1-Click) */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            Test Simulation Prompts
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {SAMPLE_COMMANDS.map((cmd, i) => (
            <button
              key={i}
              id={`simulate-cmd-${i}`}
              onClick={() => simulateVoiceCommand(cmd.command)}
              className="text-left px-3 py-2 rounded bg-black/40 hover:bg-slate-800/80 border border-slate-800 hover:border-yellow-400/40 text-xs font-mono transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2 truncate">
                <Play className="w-3 h-3 text-slate-500 group-hover:text-yellow-400 shrink-0" />
                <span className="text-slate-300 group-hover:text-yellow-300 font-medium truncate text-[11px]">
                  {cmd.title}
                </span>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                  cmd.level === 'critical'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : cmd.level === 'medium'
                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                }`}
              >
                {cmd.level}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* AssemblyAI JSON Schema Accordion */}
      <div className="border-t border-slate-800 pt-2">
        <button
          onClick={() => setShowToolSchema(!showToolSchema)}
          className="w-full text-left flex items-center justify-between text-[10px] font-mono font-bold uppercase text-slate-400 hover:text-slate-200 py-1"
        >
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            ASSEMBLYAI TOOL SCHEMA
          </span>
          {showToolSchema ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showToolSchema && (
          <pre className="mt-2 p-2.5 bg-black/50 rounded text-[10px] font-mono text-cyan-300/90 overflow-x-auto max-h-48 border border-slate-800">
            {JSON.stringify(REPORT_SAFETY_HAZARD_TOOL, null, 2)}
          </pre>
        )}
      </div>
    </aside>
  );
};
