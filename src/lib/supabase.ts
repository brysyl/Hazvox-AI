import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database, Incident, InsertIncident, UpdateIncident } from '../types/database.types';

// Read env variables (supporting Vite import.meta.env and Node process.env)
const envUrl =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  '';

const envKey =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  '';

let supabaseInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(envUrl && envKey && !envUrl.includes('your-project') && !envKey.includes('your-anon-key'));
};

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(envUrl, envKey, {
        auth: {
          persistSession: false,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
};

// Initial Seed Data for immediate hackathon demonstration
const INITIAL_DEMO_INCIDENTS: Incident[] = [
  {
    id: 'inc-90812-crit',
    hazard_level: 'critical',
    equipment_id: 'TURBINE-04',
    location: 'Sector 9 - Power Hall',
    description: 'Severe thermal surge detected on primary stator bearings. Smoke sensors triggered at 420°C.',
    status: 'open',
    reported_by: 'HazVox Voice Agent (Auto)',
    audio_transcript: 'Emergency alert: Critical thermal surge on Turbine 04 in Sector 9, heavy smoke detected.',
    created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: 'inc-90811-med',
    hazard_level: 'medium',
    equipment_id: 'CONVEYOR-CV12',
    location: 'Warehouse B - Bay 3',
    description: 'Hydraulic pressure dropped below safety threshold (38 PSI). Slight drive belt slippage noted.',
    status: 'open',
    reported_by: 'HazVox Voice Agent',
    audio_transcript: 'Logging medium hazard on Conveyor CV12 in Warehouse B Bay 3, hydraulic pressure drop.',
    created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
  },
  {
    id: 'inc-90810-low',
    hazard_level: 'low',
    equipment_id: 'PUMP-P09',
    location: 'Facility Alpha - Loop A',
    description: 'Vibrational resonance harmonics higher than nominal baseline during morning cycle.',
    status: 'resolved',
    reported_by: 'HazVox Voice Agent',
    audio_transcript: 'Low level vibration alert on Pump P09 at Facility Alpha Loop A.',
    created_at: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
  },
];

const LOCAL_STORAGE_KEY = 'hazvox_incidents_store_v1';
const REALTIME_EVENT_NAME = 'hazvox_incident_sync';

// Local storage helpers
export const getLocalIncidents = (): Incident[] => {
  if (typeof window === 'undefined') return INITIAL_DEMO_INCIDENTS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_INCIDENTS));
      return INITIAL_DEMO_INCIDENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_DEMO_INCIDENTS;
  }
};

export const saveLocalIncidents = (incidents: Incident[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(incidents));
    window.dispatchEvent(new CustomEvent(REALTIME_EVENT_NAME, { detail: incidents }));
  } catch (e) {
    console.error('Failed to save to local storage', e);
  }
};

// Unified Data Fetcher & Subscriptions
export async function fetchIncidents(): Promise<Incident[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Incident[];
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to local store:', e);
    }
  }

  // Fallback to local incidents
  return getLocalIncidents();
}

export async function createIncident(incidentData: InsertIncident): Promise<Incident> {
  const supabase = getSupabase();
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .insert([incidentData])
        .select()
        .single();

      if (!error && data) {
        return data as Incident;
      }
      console.warn('Supabase insert failed, persisting locally:', error);
    } catch (e) {
      console.warn('Supabase insert error, persisting locally:', e);
    }
  }

  // Fallback local persistence
  const newRecord: Incident = {
    id: incidentData.id || `inc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    hazard_level: incidentData.hazard_level,
    equipment_id: incidentData.equipment_id.toUpperCase(),
    description: incidentData.description,
    location: incidentData.location,
    status: incidentData.status || 'open',
    audio_transcript: incidentData.audio_transcript || null,
    reported_by: incidentData.reported_by || 'HazVox Voice Agent',
    created_at: incidentData.created_at || new Date().toISOString(),
  };

  const current = getLocalIncidents();
  const updated = [newRecord, ...current];
  saveLocalIncidents(updated);
  return newRecord;
}

export async function updateIncidentStatus(id: string, status: 'open' | 'resolved'): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ status })
        .eq('id', id);

      if (!error) return true;
    } catch (e) {
      console.warn('Supabase update failed:', e);
    }
  }

  const current = getLocalIncidents();
  const updated = current.map((item) => (item.id === id ? { ...item, status } : item));
  saveLocalIncidents(updated);
  return true;
}

export function subscribeToIncidents(callback: (payload: { eventType: string; new?: Incident; old?: Partial<Incident> }) => void) {
  const supabase = getSupabase();
  let channel: any = null;

  if (supabase) {
    try {
      channel = supabase
        .channel('public:incidents')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'incidents' },
          (payload) => {
            callback({
              eventType: payload.eventType,
              new: payload.new as Incident,
              old: payload.old as Partial<Incident>,
            });
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Supabase realtime subscription failed:', e);
    }
  }

  // Also listen for local cross-component events
  const handleLocalEvent = (e: Event) => {
    const customEvent = e as CustomEvent<Incident[]>;
    if (customEvent.detail && customEvent.detail[0]) {
      callback({
        eventType: 'LOCAL_SYNC',
        new: customEvent.detail[0],
      });
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(REALTIME_EVENT_NAME, handleLocalEvent);
  }

  return () => {
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener(REALTIME_EVENT_NAME, handleLocalEvent);
    }
  };
}
