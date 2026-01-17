import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Track {
  encoded: string;
  info: {
    identifier: string;
    title: string;
    author: string;
    length: number;
    artworkUrl?: string;
    uri: string;
  };
}

async function searchYouTube(query: string): Promise<Track[]> {
  // ADDED: &sp=Eg-KAQwIARAA to filter for "Songs" (YouTube Music Catalog)
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=Eg-KAQwIARAA`;
  console.log('Scraping YouTube Music (Songs):', searchUrl);
  
  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`YouTube returned ${response.status}`);
  }

  const html = await response.text();
  const match = html.match(/var ytInitialData = ({.+?});/);
  if (!match) {
    throw new Error('Could not find ytInitialData');
  }

  const data = JSON.parse(match[1]);
  const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
  
  const tracks: Track[] = [];
  
  for (const item of contents) {
    const video = item.videoRenderer;
    if (!video) continue;
    
    const videoId = video.videoId;
    const title = video.title?.runs?.[0]?.text || '';
    const author = video.ownerText?.runs?.[0]?.text || '';
    const lengthText = video.lengthText?.simpleText || '0:00';
    
    // Logic to parse duration
    const lengthParts = lengthText.split(':').map(Number);
    let lengthMs = 0;
    if (lengthParts.length === 3) {
      lengthMs = (lengthParts[0] * 3600 + lengthParts[1] * 60 + lengthParts[2]) * 1000;
    } else if (lengthParts.length === 2) {
      lengthMs = (lengthParts[0] * 60 + lengthParts[1]) * 1000;
    }
    
    if (videoId && title) {
      tracks.push({
        encoded: '',
        info: {
          identifier: videoId,
          title,
          author,
          length: lengthMs,
          artworkUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          uri: `https://www.youtube.com/watch?v=${videoId}` // Standard link plays YTM content fine
        }
      });
    }
    
    if (tracks.length >= 10) break;
  }
  
  return tracks;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching for:', query);
    let results: Track[] = [];
    
    try {
      results = await searchYouTube(query);
      console.log(`Found ${results.length} results`);
    } catch (error) {
      console.log('Direct scraping failed:', error);
    }
    
    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ error: 'Search failed', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
