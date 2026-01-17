import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LyricLine {
  time: number;
  text: string;
}

function cleanTitle(title: string): string {
  return title.toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/official\s+video/g, '')
    .replace(/official\s+audio/g, '')
    .replace(/music\s+video/g, '')
    .replace(/lyric\s+video/g, '')
    .replace(/lyrics/g, '')
    .replace(/feat\.?|ft\.?/g, '')
    .replace(/remastered/g, '')
    .replace(/remix/g, '')
    .replace(/\|.*/g, '')
    .replace(/-.*/g, '')
    .trim();
}

// Check if result artist matches requested artist
function checkArtistMatch(resultArtist: string, targetArtist: string): boolean {
  if (!resultArtist || !targetArtist) return true; // Loose match if missing info
  const r = resultArtist.toLowerCase();
  const t = targetArtist.toLowerCase();
  return r.includes(t) || t.includes(r);
}

// 1. YouTube Captions (Synced)
async function fetchYouTubeLyrics(videoId: string): Promise<LyricLine[] | null> {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();
    const captionsMatch = html.match(/"captions":(\{[^}]+\})/);
    
    if (captionsMatch) {
      const captionsData = JSON.parse(captionsMatch[1]);
      const tracks = captionsData?.playerCaptionsTracklistRenderer?.captionTracks;
      
      if (tracks && tracks.length > 0) {
        const track = tracks.find((t: any) => t.languageCode === 'en') || tracks[0];
        const transcriptResponse = await fetch(track.baseUrl);
        const transcriptXml = await transcriptResponse.text();
        
        const lines: LyricLine[] = [];
        const textMatches = transcriptXml.matchAll(/<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([^<]+)<\/text>/g);
        
        for (const match of textMatches) {
          const text = match[3]
            .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
          if (text && !text.startsWith('[') && !text.startsWith('(')) {
            lines.push({ time: parseFloat(match[1]) * 1000, text });
          }
        }
        if (lines.length > 0) return lines;
      }
    }
  } catch (e) { console.error('YT Captions failed:', e); }
  return null;
}

// 2. LRCLIB (Synced - With Artist Check)
async function fetchLrcLib(title: string, artist: string): Promise<LyricLine[] | null> {
  try {
    // Search with Artist + Title
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(artist + ' ' + title)}`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    
    // Filter results for correct artist
    const match = data.find((t: any) => 
      t.syncedLyrics && checkArtistMatch(t.artistName, artist)
    );

    if (match) {
      const lines: LyricLine[] = [];
      const lrcLines = match.syncedLyrics.split('\n');
      for (const line of lrcLines) {
        const m = line.match(/\[(\d+):(\d+)\.?(\d+)?\](.*)/);
        if (m) {
          const min = parseInt(m[1]);
          const sec = parseInt(m[2]);
          const ms = m[3] ? parseInt(m[3]) * 10 : 0;
          const text = m[4].trim();
          if (text) lines.push({ time: (min * 60 + sec) * 1000 + ms, text });
        }
      }
      return lines;
    }
  } catch (e) { console.error('LrcLib failed:', e); }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { videoId, title, artist } = await req.json();
    const cleanedTitle = cleanTitle(title);
    const cleanedArtist = artist.replace(/VEVO|Official|Topic/gi, '').trim();

    console.log(`Lyrics Search: "${cleanedTitle}" by "${cleanedArtist}"`);

    // Strategy 1: YouTube (Best for obscure/remix songs)
    let lyrics = await fetchYouTubeLyrics(videoId);
    if (lyrics) return new Response(JSON.stringify({ lyrics }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Strategy 2: LRCLIB (Best for popular songs)
    lyrics = await fetchLrcLib(cleanedTitle, cleanedArtist);
    if (lyrics) return new Response(JSON.stringify({ lyrics }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify({ error: 'No lyrics found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
