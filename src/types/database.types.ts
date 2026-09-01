export type HazardLevel = 'low' | 'medium' | 'critical';
export type IncidentStatus = 'open' | 'resolved';

export interface Incident {
  id: string;
  hazard_level: HazardLevel;
  equipment_id: string;
  description: string;
  status: IncidentStatus;
  location: string;
  audio_transcript?: string | null;
  reported_by?: string | null;
  created_at: string;
}

export type InsertIncident = Omit<Incident, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type UpdateIncident = Partial<Omit<Incident, 'id' | 'created_at'>>;

export interface Database {
  public: {
    Tables: {
      incidents: {
        Row: Incident;
        Insert: InsertIncident;
        Update: UpdateIncident;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      hazard_level_enum: HazardLevel;
      incident_status_enum: IncidentStatus;
    };
  };
}

export interface VoiceAgentToolCallArgs {
  hazard_level: HazardLevel;
  equipment_id: string;
  location: string;
  description: string;
  audio_transcript?: string;
}
