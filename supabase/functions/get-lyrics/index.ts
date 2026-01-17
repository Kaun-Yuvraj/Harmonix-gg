import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LyricLine {
  time: number;
  text: string;
}

// Parse LRC format lyrics
function parseLRC(lrcContent: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const lrcLines = lrcContent.split('\n');
  
  for (const line of lrcLines) {
    // Match [mm:ss.xx] or [mm:ss] format
    const match = line.match(/\[(\d+):(\d+)\.?(\d+)?\](.*)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const centiseconds = match[3] ? parseInt(match[3]) : 0;
      const text = match[4].trim();
      
      if (text) {
        const timeMs = (minutes * 60 + seconds) * 1000 + centiseconds * 10;
        lines.push({ time: timeMs, text });
      }
    }
  }
  
  return lines.sort((a, b) => a.time - b.time);
}

// Fetch lyrics from YouTube using youtube-transcript-api equivalent
async function fetchYouTubeLyrics(videoId: string): Promise<LyricLine[] | null> {
  try {
    // Try to get transcript from YouTube's internal API
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();
    
    // Extract captions/transcript data from YouTube page
    const captionsMatch = html.match(/"captions":(\{[^}]+\})/);
    if (captionsMatch) {
      const captionsData = JSON.parse(captionsMatch[1]);
      const playerCaptionsTracklistRenderer = captionsData?.playerCaptionsTracklistRenderer;
      
      if (playerCaptionsTracklistRenderer?.captionTracks) {
        // Get first available caption track
        const track = playerCaptionsTracklistRenderer.captionTracks[0];
        if (track?.baseUrl) {
          const transcriptResponse = await fetch(track.baseUrl);
          const transcriptXml = await transcriptResponse.text();
          
          // Parse XML transcript
          const lines: LyricLine[] = [];
          const textMatches = transcriptXml.matchAll(/<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([^<]+)<\/text>/g);
          
          for (const match of textMatches) {
            const startTime = parseFloat(match[1]) * 1000; // Convert to ms
            const text = match[3]
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .trim();
            
            if (text) {
              lines.push({ time: startTime, text });
            }
          }
          
          if (lines.length > 0) {
            return lines;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching YouTube lyrics:', error);
  }
  
  return null;
}

// Clean YouTube title for better search
function cleanYouTubeTitle(title: string): string {
  return title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/【.*?】/g, '')
    .replace(/Official.*?(Video|Audio|Music|Song|Lyric)/gi, '')
    .replace(/ft\.?|feat\.?/gi, '')
    .replace(/prod\.?.*?by/gi, '')
    .replace(/\|.*/g, '')
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId, title, artist } = await req.json();
    
    console.log('Fetching lyrics for:', { videoId, title, artist });
    
    // Try to get synced lyrics from YouTube first
    let lyrics = await fetchYouTubeLyrics(videoId);
    
    if (lyrics) {
      console.log('Found YouTube captions');
      return new Response(
        JSON.stringify({ lyrics }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fallback to external lyrics APIs with synced lyrics
    const cleanTitle = cleanYouTubeTitle(title);
    const cleanArtist = artist.replace(/VEVO|Official|Topic/gi, '').trim();
    
    const searchStrategies = [
      { title: cleanTitle, artist: cleanArtist },
      { title, artist },
      { title: cleanTitle, artist: '' },
    ];
    
    for (const strategy of searchStrategies) {
      if (!strategy.title) continue;
      
      // Try lrclib.net for synced lyrics
      try {
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(strategy.artist + ' ' + strategy.title)}`;
        console.log('Trying lrclib search:', searchUrl);
        
        const response = await fetch(searchUrl);
        if (response.ok) {
          const results = await response.json();
          if (results && results.length > 0) {
            const track = results[0];
            
            // Check for synced lyrics first
            if (track.syncedLyrics) {
              lyrics = parseLRC(track.syncedLyrics);
              if (lyrics && lyrics.length > 0) {
                console.log('Found synced lyrics from lrclib');
                return new Response(
                  JSON.stringify({ lyrics }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
            }
            
            // Fall back to plain lyrics (convert to simple format)
            if (track.plainLyrics) {
              const lines = track.plainLyrics.split('\n').filter((line: string) => line.trim());
              const plainLyrics = lines.map((text: string, index: number) => ({
                time: index * 3000, // Rough 3 second spacing
                text
              }));
              
              if (plainLyrics.length > 0) {
                console.log('Found plain lyrics from lrclib');
                return new Response(
                  JSON.stringify({ lyrics: plainLyrics }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
            }
          }
        }
      } catch (error) {
        console.error('lrclib search failed:', error);
      }
      
      // Try lyrics.ovh
      if (strategy.artist) {
        try {
          const apiUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(strategy.artist)}/${encodeURIComponent(strategy.title)}`;
          console.log('Trying lyrics.ovh:', apiUrl);
          
          const response = await fetch(apiUrl);
          if (response.ok) {
            const data = await response.json();
            if (data.lyrics) {
              const lines = data.lyrics.split('\n').filter((line: string) => line.trim());
              const ovhLyrics = lines.map((text: string, index: number) => ({
                time: index * 3000,
                text
              }));
              
              console.log('Found plain lyrics from lyrics.ovh');
              return new Response(
                JSON.stringify({ lyrics: ovhLyrics }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        } catch (error) {
          console.error('lyrics.ovh failed:', error);
        }
      }
    }
    
    console.log('No lyrics found after all attempts');
    return new Response(
      JSON.stringify({ lyrics: null, message: 'Lyrics not available' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in get-lyrics function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch lyrics' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});