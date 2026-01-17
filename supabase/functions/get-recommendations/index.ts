import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

function isCleanSong(title: string): boolean {
  const t = title.toLowerCase();
  if (t.includes("official video")) return false;
  if (t.includes("music video")) return false;
  if (t.includes("lyric video")) return false;
  if (t.includes("live at")) return false;
  if (t.includes("reaction")) return false;
  return true;
}

function extractCoreSongName(title: string): string {
  let songName = title.toLowerCase();
  songName = songName
    .replace(/\(.*?(official|lyric|video|audio|hd|4k|slowed|reverb|remix|mashup|cover|live|acoustic).*?\)/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\|.*$/g, '') 
    .replace(/official\s*(music\s*)?(video|lyric|audio)/gi, '')
    .replace(/\b(lyrics?|lyric\s*video|video\s*song|full\s*song|hd|4k|1080p|16d|8d)\b/gi, '')
    .replace(/\bslowed?\s*(\+|&|and)?\s*reverb(ed)?\b/gi, '')
    .replace(/\b(ft\.?|feat\.?|featuring)\s+.*/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    const cleanParts = parts.map(p => 
      p.toLowerCase().replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').replace(/[^a-z0-9\s]/g, ' ').trim()
    );
    const shortestPart = cleanParts.filter(p => p.length > 2 && p.length < 30).sort((a, b) => a.length - b.length)[0];
    if (shortestPart) return shortestPart;
  }
  return songName.split(' ').slice(0, 4).join(' '); 
}

function extractGenreKeywords(title: string): string[] {
  const lowerTitle = title.toLowerCase();
  const keywords: string[] = [];
  const genrePatterns = [
    { pattern: /haryanvi|haryanavi/i, keyword: 'Haryanvi' },
    { pattern: /punjabi/i, keyword: 'Punjabi' },
    { pattern: /hindi/i, keyword: 'Hindi' },
    { pattern: /bhojpuri/i, keyword: 'Bhojpuri' },
    { pattern: /english/i, keyword: 'English Pop' },
    { pattern: /hip\s*hop|rap/i, keyword: 'Hip Hop' },
    { pattern: /lofi/i, keyword: 'Lofi' },
  ];
  for (const { pattern, keyword } of genrePatterns) {
    if (pattern.test(lowerTitle)) keywords.push(keyword);
  }
  return keywords;
}

function extractArtistFromTitle(title: string): string | null {
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    const artistPart = parts[0].trim().replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
    if (artistPart.length > 2 && artistPart.length < 30 && !artistPart.match(/official|video|audio|lyric/i)) {
      return artistPart;
    }
  }
  return null;
}

function titleContainsSong(title: string, songName: string): boolean {
  const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
  const normalizedSong = songName.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
  if (normalizedTitle.includes(normalizedSong)) return true;
  return false;
}

function areTitlesDuplicates(title1: string, title2: string, coreSongName: string): boolean {
  if (coreSongName && titleContainsSong(title2, coreSongName)) return true;
  const song1 = extractCoreSongName(title1);
  const song2 = extractCoreSongName(title2);
  if (song1 === song2) return true;
  return false;
}

async function searchYouTubeRelated(query: string, excludeVideoId: string, currentSongTitle: string, coreSongName: string, existingTitles: string[]): Promise<Track[]> {
  // Use Song Filter for Recommendations too
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=Eg-KAQwIARAA`;
  console.log('Searching Recommendations (Songs Only):', searchUrl);
  
  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
  const addedSongNames: string[] = existingTitles.map(t => extractCoreSongName(t));
  
  for (const item of contents) {
    const video = item.videoRenderer;
    if (!video) continue;
    
    const videoId = video.videoId;
    if (!videoId || videoId === excludeVideoId) continue;
    
    const title = video.title?.runs?.[0]?.text || '';
    const author = video.ownerText?.runs?.[0]?.text || '';
    
    // STRICT FILTER: Skip Videos
    if (!isCleanSong(title)) continue;
    
    // Deduplication
    if (areTitlesDuplicates(currentSongTitle, title, coreSongName)) continue;
    
    const newSongName = extractCoreSongName(title);
    const isDuplicate = addedSongNames.some(existing => existing === newSongName || existing.includes(newSongName) || newSongName.includes(existing));
    if (isDuplicate) continue;
    
    addedSongNames.push(newSongName);
    
    const lengthText = video.lengthText?.simpleText || '0:00';
    const lengthParts = lengthText.split(':').map(Number);
    let lengthMs = 0;
    if (lengthParts.length === 3) {
      lengthMs = (lengthParts[0] * 3600 + lengthParts[1] * 60 + lengthParts[2]) * 1000;
    } else if (lengthParts.length === 2) {
      lengthMs = (lengthParts[0] * 60 + lengthParts[1]) * 1000;
    }
    
    if (lengthMs > 12 * 60 * 1000 || lengthMs < 60 * 1000) continue;
    
    tracks.push({
      encoded: '',
      info: {
        identifier: videoId,
        title,
        author,
        length: lengthMs,
        artworkUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        uri: `https://www.youtube.com/watch?v=${videoId}`
      }
    });
    
    if (tracks.length >= 10) break;
  }
  
  return tracks;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId, title, author, existingTitles = [] } = await req.json();
    
    if (!title && !author) return new Response(JSON.stringify({ results: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    const coreSongName = extractCoreSongName(title || '');
    const genreKeywords = extractGenreKeywords(title || '');
    const titleArtist = extractArtistFromTitle(title || '');
    const allExistingTitles = [title, ...existingTitles].filter(Boolean);
    
    const queries: string[] = [];
    
    if (genreKeywords.length > 0) queries.push(...genreKeywords.slice(0, 2));
    if (titleArtist) queries.push(`${titleArtist} songs`);
    if (coreSongName) queries.push(`${coreSongName} song`);
    
    if (queries.length === 0 && author) {
      const cleanAuthor = author.replace(/VEVO$/i, '').replace(/Official$/i, '').replace(/ - Topic$/i, '').trim();
      queries.push(`${cleanAuthor} songs`);
    }
    
    if (queries.length === 0) queries.push('new songs 2024');
    
    for (const query of queries) {
      try {
        const results = await searchYouTubeRelated(query, videoId, title, coreSongName, allExistingTitles);
        if (results.length >= 3) {
          return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      } catch (error) { console.error('Query failed:', query, error); }
    }
    
    return new Response(JSON.stringify({ results: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch recommendations' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
