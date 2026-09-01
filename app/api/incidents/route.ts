import { createClient } from '@supabase/supabase-js';
import type { Database, InsertIncident } from '@/src/types/database.types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hazard_level, equipment_id, description, location, audio_transcript } = body;

    // Validate required fields
    if (!hazard_level || !equipment_id || !description || !location) {
      return new Response(
        JSON.stringify({
          error: 'Missing required incident fields: hazard_level, equipment_id, description, location are mandatory.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate hazard_level enum
    const validLevels = ['low', 'medium', 'critical'];
    if (!validLevels.includes(hazard_level.toLowerCase())) {
      return new Response(
        JSON.stringify({
          error: `Invalid hazard_level '${hazard_level}'. Must be one of: low, medium, critical.`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const newIncident: InsertIncident = {
      hazard_level: hazard_level.toLowerCase(),
      equipment_id: equipment_id.trim().toUpperCase(),
      description: description.trim(),
      location: location.trim(),
      status: 'open',
      audio_transcript: audio_transcript || null,
      reported_by: 'HazVox Voice Agent',
    };

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('incidents')
        .insert([newIncident])
        .select()
        .single();

      if (error) {
        console.error('Supabase DB Error:', error);
        return new Response(
          JSON.stringify({ error: error.message, details: error }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({ success: true, incident: data }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fallback simulation mode if Supabase keys not set yet
    const simulatedRecord = {
      id: crypto.randomUUID(),
      ...newIncident,
      created_at: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({
        success: true,
        incident: simulatedRecord,
        mode: 'local_storage_fallback',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('API Error in /api/incidents:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error processing incident report.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function GET() {
  try {
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient<Database>(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ incidents: data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ incidents: [], message: 'Supabase credentials pending.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
