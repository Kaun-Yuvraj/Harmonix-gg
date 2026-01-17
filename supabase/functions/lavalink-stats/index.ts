import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LAVALINK_HOST = "pnode1.danbot.host";
const LAVALINK_PORT = 1186;
const LAVALINK_PASSWORD = Deno.env.get('LAVALINK_PASSWORD') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LavalinkStats {
  players: number;
  playingPlayers: number;
  uptime: number;
  memory: {
    free: number;
    used: number;
    allocated: number;
    reservable: number;
  };
  cpu: {
    cores: number;
    systemLoad: number;
    lavalinkLoad: number;
  };
  frameStats?: {
    sent: number;
    nulled: number;
    deficit: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Fetching Lavalink stats from:', `http://${LAVALINK_HOST}:${LAVALINK_PORT}/v4/stats`);

  try {
    // Lavalink v4 uses /v4/stats endpoint
    const response = await fetch(`http://${LAVALINK_HOST}:${LAVALINK_PORT}/v4/stats`, {
      method: 'GET',
      headers: {
        'Authorization': LAVALINK_PASSWORD,
      },
    });

    if (!response.ok) {
      console.error('Lavalink response not OK:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch Lavalink stats',
          status: response.status,
          statusText: response.statusText,
          online: false
        }),
        { 
          status: 200, // Return 200 so frontend can handle it
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const stats: LavalinkStats = await response.json();
    console.log('Lavalink stats received:', JSON.stringify(stats));

    return new Response(
      JSON.stringify({ 
        ...stats, 
        online: true,
        host: LAVALINK_HOST,
        port: LAVALINK_PORT
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching Lavalink stats:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        online: false,
        host: LAVALINK_HOST,
        port: LAVALINK_PORT
      }),
      { 
        status: 200, // Return 200 so frontend can handle gracefully
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
