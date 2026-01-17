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

function checkArtistMatch(resultArtist: string, targetArtist: string): boolean {
  if (!resultArtist || !targetArtist) return true;
  const r = resultArtist.toLowerCase();
  const t = targetArtist.toLowerCase();
  return r.includes(t) || t.includes(r);
}

function checkDurationMatch(resultDuration: number, targetDuration: number): boolean {
  if (!resultDuration || !targetDuration) return true;
  const diff = Math.abs(resultDuration - (targetDuration / 1000));
  return diff < 15;
}

// 1. YouTube Captions (Synced - High Priority)
async function fetchYouTubeLyrics(videoId: string): Promise<LyricLine[] | null> {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();
    const captionsMatch = html.match(/"captions":(\{[^}]+\})/);
    
    if (captionsMatch) {
      const captionsData = JSON.parse(captionsMatch[1]);
      const tracks = captionsData?.playerCaptionsTracklistRenderer?.captionTracks;
      
      if (tracks && tracks.length > 0) {
        // IMPROVED: Sort tracks to find English (en) or Auto-generated (asr)
        // Priorities: 
        // 1. English Manual (.en)
        // 2. English Auto (.en + kind=asr)
        // 3. First available
        
        tracks.sort((a: any, b: any) => {
           if (a.languageCode === 'en' && !a.kind) return -1; // Manual Eng first
           if (b.languageCode === 'en' && !b.kind) return 1;
           if (a.languageCode === 'en') return -1; // Auto Eng second
           return 0;
        });

        const track = tracks[0];
        console.log(`Using Caption Track: ${track.name?.simpleText} (${track.languageCode})`);

        const transcriptResponse = await fetch(track.baseUrl);
        const transcriptXml = await transcriptResponse.text();
        
        const lines: LyricLine[] = [];
        const textMatches = transcriptXml.matchAll(/<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([^<]+)<\/text>/g);
        
        for (const match of textMatches) {
          const text = match[3]
            .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
            .replace(/\[Music\]/gi, '').replace(/\(Music\)/gi, '') // Clean common noise
            .trim();
            
          if (text) {
            lines.push({ time: parseFloat(match[1]) * 1000, text });
          }
        }
        if (lines.length > 0) return lines;
      }
    }
  } catch (e) { console.error('YT Captions failed:', e); }
  return null;
}

// 2. LRCLIB (Synced - With Duration & Artist Check)
async function fetchLrcLib(title: string, artist: string, duration: number): Promise<LyricLine[] | null> {
  try {
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(artist + ' ' + title)}`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    
    let match = data.find((t: any) => 
      t.syncedLyrics && 
      checkArtistMatch(t.artistName, artist) &&
      checkDurationMatch(t.duration, duration)
    );

    if (!match) {
      match = data.find((t: any) => 
        t.syncedLyrics && 
        checkArtistMatch(t.artistName, artist)
      );
    }

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
    const { videoId, title, artist, duration } = await req.json();
    const cleanedTitle = cleanTitle(title);
    const cleanedArtist = artist.replace(/VEVO|Official|Topic/gi, '').trim();

    // Strategy 1: YouTube Captions (BEST FOR SYNC)
    let lyrics = await fetchYouTubeLyrics(videoId);
    if (lyrics) {
      return new Response(JSON.stringify({ lyrics }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Strategy 2: LRCLIB (Fallback)
    lyrics = await fetchLrcLib(cleanedTitle, cleanedArtist, duration);
    if (lyrics) {
      return new Response(JSON.stringify({ lyrics }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'No lyrics found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
