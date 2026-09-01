import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// In-memory fallback cache for fast response and real-time demonstration
let inMemoryIncidents = [
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

// ==========================================
// 1. API: Incidents Endpoint (GET & POST)
// ==========================================
app.get('/api/incidents', async (req, res) => {
  try {
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return res.json({ success: true, incidents: data });
      }
    }
    return res.json({ success: true, incidents: inMemoryIncidents });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/incidents', async (req, res) => {
  try {
    const { hazard_level, equipment_id, description, location, audio_transcript } = req.body;

    if (!hazard_level || !equipment_id || !description || !location) {
      return res.status(400).json({
        error: 'Missing required incident fields: hazard_level, equipment_id, description, location are mandatory.',
      });
    }

    const validLevels = ['low', 'medium', 'critical'];
    if (!validLevels.includes(hazard_level.toLowerCase())) {
      return res.status(400).json({
        error: `Invalid hazard_level '${hazard_level}'. Must be one of: low, medium, critical.`,
      });
    }

    const newRecord = {
      id: `inc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      hazard_level: hazard_level.toLowerCase(),
      equipment_id: equipment_id.trim().toUpperCase(),
      description: description.trim(),
      location: location.trim(),
      status: 'open',
      audio_transcript: audio_transcript || null,
      reported_by: 'HazVox Voice Agent (AssemblyAI)',
      created_at: new Date().toISOString(),
    };

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('incidents')
        .insert([
          {
            hazard_level: newRecord.hazard_level,
            equipment_id: newRecord.equipment_id,
            description: newRecord.description,
            location: newRecord.location,
            status: newRecord.status,
            audio_transcript: newRecord.audio_transcript,
            reported_by: newRecord.reported_by,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        inMemoryIncidents = [data, ...inMemoryIncidents];
        return res.status(201).json({ success: true, incident: data });
      }
    }

    inMemoryIncidents = [newRecord, ...inMemoryIncidents];
    return res.status(201).json({ success: true, incident: newRecord });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Update Incident Status
app.patch('/api/incidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('incidents').update({ status }).eq('id', id);
    }

    inMemoryIncidents = inMemoryIncidents.map((inc) =>
      inc.id === id ? { ...inc, status } : inc
    );

    return res.json({ success: true, id, status });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// AssemblyAI temporary token endpoint (if ASSEMBLYAI_API_KEY is configured)
app.post('/api/assemblyai/token', async (req, res) => {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        configured: false,
        message: 'AssemblyAI API key not set; using client-side WebRTC/WebSpeech audio engine fallback.',
      });
    }

    const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ expires_in: 3600 }),
    });

    const data = await response.json();
    return res.json({ configured: true, token: data.token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// System Status Endpoint
app.get('/api/system-status', (req, res) => {
  res.json({
    status: 'operational',
    service: 'HazVox AI Safety Dispatch Engine',
    supabaseConnected: Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')),
    assemblyAiConfigured: Boolean(process.env.ASSEMBLYAI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// Vite Middleware / Static Asset Setup
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HazVox AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
