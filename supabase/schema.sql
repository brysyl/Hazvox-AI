-- ==============================================================================
-- HazVox AI: Industrial Safety Incident Reporting Schema
-- Supabase PostgreSQL with Row Level Security (RLS) and Realtime Subscriptions
-- ==============================================================================

-- 1. Create Enums for Hazard Levels and Incident Statuses
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hazard_level_enum') THEN
        CREATE TYPE hazard_level_enum AS ENUM ('low', 'medium', 'critical');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_status_enum') THEN
        CREATE TYPE incident_status_enum AS ENUM ('open', 'resolved');
    END IF;
END $$;

-- 2. Create the Incidents Table
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

-- 3. Create Indexes for High-Speed Querying & Real-time Feeds
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_hazard_level ON public.incidents (hazard_level);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_equipment ON public.incidents (equipment_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies (Hackathon Demo Open Access)
-- Policy: Allow Public Read Access
CREATE POLICY "Allow public select for hackathon demo"
    ON public.incidents
    FOR SELECT
    USING (true);

-- Policy: Allow Public Insert Access (Voice Agent & Dispatch)
CREATE POLICY "Allow public insert for hackathon demo"
    ON public.incidents
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow Public Update Access (Resolution toggles)
CREATE POLICY "Allow public update for hackathon demo"
    ON public.incidents
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy: Allow Public Delete Access (Demo cleanup)
CREATE POLICY "Allow public delete for hackathon demo"
    ON public.incidents
    FOR DELETE
    USING (true);

-- 6. Enable Supabase Realtime for the Incidents Table
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;

-- 7. Seed Initial Demo Data
INSERT INTO public.incidents (hazard_level, equipment_id, location, description, status, audio_transcript)
VALUES
    ('critical', 'TURBINE-04', 'Sector 9 - Power Generation Hall', 'Severe thermal runaway detected on primary stator bearings. Smoke visible.', 'open', 'Voice report: Critical warning on Turbine 04 in Sector 9, high thermal surge with visible smoke.'),
    ('medium', 'CONVEYOR-CV12', 'Warehouse B - Sorting Bay 3', 'Hydraulic fluid pressure drop below 40 PSI. Slight belt misalignment observed.', 'open', 'Voice report: Medium hazard on Conveyor CV12 in Warehouse B Sorting Bay 3, hydraulic pressure is dropping.'),
    ('low', 'PUMP-P09', 'Facility Alpha - Coolant Loop', 'Minor vibrational resonance anomaly during shift startup sequence.', 'resolved', 'Voice report: Low priority alert on Pump P09 at Facility Alpha coolant loop, slight vibration.')
ON CONFLICT DO NOTHING;
