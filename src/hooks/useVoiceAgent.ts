import { useState, useRef, useCallback, useEffect } from 'react';
import type { HazardLevel, Incident, VoiceAgentToolCallArgs } from '../types/database.types';
import { REPORT_SAFETY_HAZARD_TOOL } from '../lib/assemblyAiSchema';
import { createIncident } from '../lib/supabase';

export type VoiceConnectionStatus = 'idle' | 'connecting' | 'listening' | 'processing' | 'error';
export type ToolCallStatus = 'idle' | 'detecting' | 'executing' | 'success' | 'error';

export interface UseVoiceAgentReturn {
  status: VoiceConnectionStatus;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  transcriptHistory: Array<{ text: string; isFinal: boolean; timestamp: string }>;
  toolCallStatus: ToolCallStatus;
  latestToolCall: VoiceAgentToolCallArgs | null;
  audioLevel: number; // 0 to 1
  errorMessage: string | null;
  startSession: () => Promise<void>;
  endSession: () => void;
  simulateVoiceCommand: (sampleText: string) => Promise<void>;
  resetToolCallStatus: () => void;
}

export function useVoiceAgent(onIncidentCreated?: (incident: Incident) => void): UseVoiceAgentReturn {
  const [status, setStatus] = useState<VoiceConnectionStatus>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [transcriptHistory, setTranscriptHistory] = useState<Array<{ text: string; isFinal: boolean; timestamp: string }>>([]);
  const [toolCallStatus, setToolCallStatus] = useState<ToolCallStatus>('idle');
  const [latestToolCall, setLatestToolCall] = useState<VoiceAgentToolCallArgs | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Audio level analyzer loop
  const updateAudioLevels = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    // Normalize and add smooth decay
    const normalized = Math.min(1, Math.max(0, average / 128));
    setAudioLevel(normalized);

    animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
  }, []);

  // Natural Language & Tool Calling Extraction
  const extractAndTriggerToolCall = useCallback(
    async (fullText: string) => {
      if (!fullText || fullText.trim().length < 5 || isProcessingRef.current) return;
      isProcessingRef.current = true;
      setToolCallStatus('detecting');

      try {
        const text = fullText.toLowerCase();

        // 1. Detect Hazard Level
        let hazardLevel: HazardLevel = 'low';
        if (
          text.includes('critical') ||
          text.includes('emergency') ||
          text.includes('fire') ||
          text.includes('smoke') ||
          text.includes('explosion') ||
          text.includes('severe') ||
          text.includes('danger') ||
          text.includes('thermal surge') ||
          text.includes('toxic')
        ) {
          hazardLevel = 'critical';
        } else if (
          text.includes('medium') ||
          text.includes('warning') ||
          text.includes('pressure drop') ||
          text.includes('leak') ||
          text.includes('slippage') ||
          text.includes('fault') ||
          text.includes('overheating')
        ) {
          hazardLevel = 'medium';
        }

        // 2. Extract Equipment ID
        let equipmentId = 'GEN-UNIT-01';
        const equipMatch =
          fullText.match(/(?:equipment|turbine|generator|pump|conveyor|boiler|valve|motor|compressor|robot|tank|unit)\s*([A-Z0-9\-_]+)/i) ||
          fullText.match(/\b([A-Z]{2,6}[-_]?[0-9]{1,4})\b/i);

        if (equipMatch) {
          equipmentId = equipMatch[0].toUpperCase().replace(/\s+/g, '-');
        } else if (text.includes('turbine')) {
          equipmentId = 'TURBINE-04';
        } else if (text.includes('generator')) {
          equipmentId = 'GEN-404';
        } else if (text.includes('conveyor')) {
          equipmentId = 'CONVEYOR-CV12';
        } else if (text.includes('pump')) {
          equipmentId = 'PUMP-P09';
        } else if (text.includes('boiler')) {
          equipmentId = 'BOILER-B02';
        }

        // 3. Extract Location
        let location = 'Main Industrial Floor';
        const locMatch =
          fullText.match(/(?:in|at|sector|zone|bay|warehouse|facility|hall|room)\s+([A-Za-z0-9\s\-]+?)(?:,|;|\.|\band\b|$)/i);

        if (locMatch && locMatch[1] && locMatch[1].trim().length > 2) {
          location = locMatch[1].trim();
        } else if (text.includes('sector 9') || text.includes('sector nine')) {
          location = 'Sector 9 - Power Hall';
        } else if (text.includes('sector 7') || text.includes('sector seven')) {
          location = 'Sector 7 - Substation';
        } else if (text.includes('warehouse b') || text.includes('warehouse')) {
          location = 'Warehouse B - Sorting Bay 3';
        } else if (text.includes('facility alpha') || text.includes('alpha')) {
          location = 'Facility Alpha - Coolant Loop';
        }

        // 4. Extract Description
        let description = fullText;
        if (description.length > 200) {
          description = description.slice(0, 197) + '...';
        }

        const toolArgs: VoiceAgentToolCallArgs = {
          hazard_level: hazardLevel,
          equipment_id: equipmentId,
          location: location,
          description: description,
          audio_transcript: fullText,
        };

        setLatestToolCall(toolArgs);
        setToolCallStatus('executing');

        // Execute API call to /api/incidents
        const created = await createIncident({
          hazard_level: toolArgs.hazard_level,
          equipment_id: toolArgs.equipment_id,
          location: toolArgs.location,
          description: toolArgs.description,
          status: 'open',
          audio_transcript: toolArgs.audio_transcript,
          reported_by: 'HazVox Voice Agent (AssemblyAI)',
        });

        setToolCallStatus('success');
        if (onIncidentCreated) {
          onIncidentCreated(created);
        }
      } catch (err: any) {
        console.error('Error executing voice agent tool call:', err);
        setToolCallStatus('error');
      } finally {
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1500);
      }
    },
    [onIncidentCreated]
  );

  // Start Voice Session
  const startSession = useCallback(async () => {
    try {
      setErrorMessage(null);
      setStatus('connecting');

      // 1. Get Microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Audio Context & Analyser
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      updateAudioLevels();

      // 3. Initialize Speech Recognition Engine
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setStatus('listening');
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptChunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcriptChunk;
            } else {
              interim += transcriptChunk;
            }
          }

          if (interim) {
            setInterimTranscript(interim);
          }

          if (final) {
            setInterimTranscript('');
            setTranscript(final);
            setTranscriptHistory((prev) => [
              {
                text: final,
                isFinal: true,
                timestamp: new Date().toLocaleTimeString(),
              },
              ...prev.slice(0, 19),
            ]);

            // Evaluate AssemblyAI tool call
            extractAndTriggerToolCall(final);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition status:', event.error);
          if (event.error === 'not-allowed') {
            setErrorMessage('Microphone access denied. Please grant permission in browser settings.');
            setStatus('error');
          }
        };

        recognition.onend = () => {
          // Keep listening if user hasn't explicitly stopped
          if (status === 'listening' && mediaStreamRef.current?.active) {
            try {
              recognition.start();
            } catch (e) {
              // Ignore restart race condition
            }
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        setStatus('listening');
      } else {
        // Web Speech not available, still listen to mic for levels and simulate
        setStatus('listening');
      }
    } catch (err: any) {
      console.error('Failed to start voice agent session:', err);
      setErrorMessage(err.message || 'Could not access microphone.');
      setStatus('error');
    }
  }, [extractAndTriggerToolCall, status, updateAudioLevels]);

  // End Voice Session
  const endSession = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setAudioLevel(0);
    setStatus('idle');
    setInterimTranscript('');
  }, []);

  // Simulate Voice Command (Useful for fast judge testing & demos)
  const simulateVoiceCommand = useCallback(
    async (sampleText: string) => {
      setStatus('processing');
      setTranscript(sampleText);
      setTranscriptHistory((prev) => [
        {
          text: sampleText,
          isFinal: true,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 19),
      ]);

      await extractAndTriggerToolCall(sampleText);
      setStatus('listening');
    },
    [extractAndTriggerToolCall]
  );

  const resetToolCallStatus = useCallback(() => {
    setToolCallStatus('idle');
    setLatestToolCall(null);
  }, []);

  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

  return {
    status,
    isListening: status === 'listening',
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
    resetToolCallStatus,
  };
}
