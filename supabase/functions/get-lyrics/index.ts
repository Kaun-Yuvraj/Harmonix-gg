import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LyricLine {
  time: number;
  text: string;
}

// Helper to clean titles aggressively for better search hits
function cleanTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\(.*?\)/g, '')         // Remove (...)
    .replace(/\[.*?\]/g, '')         // Remove [...]
    .replace(/\{.*?\}/g, '')         // Remove {...}
    .replace(/official\s+video/g, '')
    .replace(/official\s+audio/g, '')
    .replace(/music\s+video/g, '')
    .replace(/lyric\s+video/g, '')
    .replace(/lyrics/g, '')
    .replace(/feat\.?|ft\.?/g, '')   // Remove feat.
    .replace(/remastered/g, '')
    .replace(/remix/g, '')
    .replace(/\|.*/g, '')            // Remove anything after |
    .replace(/-.*/g, '')             // Remove anything after - (risky but helps with "Artist - Title")
    .trim();
}

// 1. YouTube Captions Fetcher
async function fetchYouTubeLyrics(videoId: string): Promise<LyricLine[] | null> {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();
    const captionsMatch = html.match(/"captions":(\{[^}]+\})/);
    
    if (captionsMatch) {
      const captionsData = JSON.parse(captionsMatch[1]);
      const tracks = captionsData?.playerCaptionsTracklistRenderer?.captionTracks;
      
      if (tracks && tracks.length > 0) {
        // Prefer English or auto-generated
        const track = tracks.find((t: any) => t.languageCode === 'en') || tracks[0];
        const transcriptResponse = await fetch(track.baseUrl);
        const transcriptXml = await transcriptResponse.text();
        
        const lines: LyricLine[] = [];
        const textMatches = transcriptXml.matchAll(/<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([^<]+)<\/text>/g);
        
        for (const match of textMatches) {
          const text = match[3]
            .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
          if (text && !text.startsWith('[') && !text.startsWith('(')) { // Skip [Music], (Applause)
            lines.push({ time: parseFloat(match[1]) * 1000, text });
          }
        }
        if (lines.length > 0) return lines;
      }
    }
  } catch (e) { console.error('YT Captions failed:', e); }
  return null;
}

// 2. LRCLIB Fetcher (Best for synced lyrics)
async function fetchLrcLib(title: string, artist: string): Promise<LyricLine[] | null> {
  const queries = [
    `${artist} ${title}`,
    title // Fallback to just title
  ];

  for (const q of queries) {
    try {
      const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      
      // Find first track with synced lyrics
      const track = data.find((t: any) => t.syncedLyrics);
      if (track) {
        const lines: LyricLine[] = [];
        const lrcLines = track.syncedLyrics.split('\n');
        for (const line of lrcLines) {
          const match = line.match(/\[(\d+):(\d+)\.?(\d+)?\](.*)/);
          if (match) {
            const min = parseInt(match[1]);
            const sec = parseInt(match[2]);
            const ms = match[3] ? parseInt(match[3]) * 10 : 0;
            const text = match[4].trim();
            if (text) lines.push({ time: (min * 60 + sec) * 1000 + ms, text });
          }
        }
        return lines;
      }
    } catch (e) { console.error('LrcLib failed:', e); }
  }
  return null;
}

// 3. Lyrics.ovh Fetcher (Plain text fallback)
async function fetchLyricsOvh(title: string, artist: string): Promise<LyricLine[] | null> {
  try {
    const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
    const data = await res.json();
    if (data.lyrics) {
      // Create fake timestamps for scrolling
      return data.lyrics.split('\n')
        .filter((l: string) => l.trim())
        .map((text: string, i: number) => ({ time: i * 3000, text }));
    }
  } catch (e) { console.error('Ovh failed:', e); }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { videoId, title, artist } = await req.json();
    const cleanedTitle = cleanTitle(title);
    const cleanedArtist = artist.replace(/VEVO|Official|Topic/gi, '').trim();

    console.log(`Searching lyrics for: ${cleanedTitle} by ${cleanedArtist}`);

    // Strategy 1: YouTube Captions (Most accurate timing)
    let lyrics = await fetchYouTubeLyrics(videoId);
    if (lyrics) return new Response(JSON.stringify({ lyrics }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Strategy 2: LRCLIB (Best database)
    lyrics = await fetchLrcLib(cleanedTitle, cleanedArtist);
    if (lyrics) return new Response(JSON.stringify({ lyrics }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Strategy 3: Lyrics.ovh (Fallback)
    lyrics = await fetchLyricsOvh(cleanedTitle, cleanedArtist);
    if (lyrics) return new Response(JSON.stringify({ lyrics }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify({ error: 'No lyrics found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
