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

// Extract core song name from title (the actual song name without artist/metadata)
function extractCoreSongName(title: string): string {
  let songName = title.toLowerCase();
  
  // Remove common suffixes in parentheses/brackets
  songName = songName
    .replace(/\(.*?(official|lyric|video|audio|hd|4k|slowed|reverb|remix|mashup|cover|live|acoustic).*?\)/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\|.*$/g, '') // Remove everything after |
    .replace(/official\s*(music\s*)?(video|lyric|audio)/gi, '')
    .replace(/\b(lyrics?|lyric\s*video|video\s*song|full\s*song|hd|4k|1080p|16d|8d)\b/gi, '')
    .replace(/\bslowed?\s*(\+|&|and)?\s*reverb(ed)?\b/gi, '')
    .replace(/\b(ft\.?|feat\.?|featuring)\s+.*/gi, '') // Remove featuring artists
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // If title has " - " format, extract the part that looks like song name
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    // Usually song name is shorter, try to find it
    const cleanParts = parts.map(p => 
      p.toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .trim()
    );
    // Return the shortest meaningful part as song name candidate
    const shortestPart = cleanParts
      .filter(p => p.length > 2 && p.length < 30)
      .sort((a, b) => a.length - b.length)[0];
    if (shortestPart) return shortestPart;
  }
  
  return songName.split(' ').slice(0, 4).join(' '); // First 4 words as fallback
}

// Extract genre/language keywords from title
function extractGenreKeywords(title: string): string[] {
  const lowerTitle = title.toLowerCase();
  const keywords: string[] = [];
  
  // Language/regional music genres
  const genrePatterns = [
    { pattern: /haryanvi|haryanavi/i, keyword: 'Haryanvi songs' },
    { pattern: /punjabi/i, keyword: 'Punjabi songs' },
    { pattern: /hindi/i, keyword: 'Hindi songs' },
    { pattern: /bhojpuri/i, keyword: 'Bhojpuri songs' },
    { pattern: /rajasthani/i, keyword: 'Rajasthani songs' },
    { pattern: /gujarati/i, keyword: 'Gujarati songs' },
    { pattern: /marathi/i, keyword: 'Marathi songs' },
    { pattern: /tamil/i, keyword: 'Tamil songs' },
    { pattern: /telugu/i, keyword: 'Telugu songs' },
    { pattern: /kannada/i, keyword: 'Kannada songs' },
    { pattern: /malayalam/i, keyword: 'Malayalam songs' },
    { pattern: /bengali|bangla/i, keyword: 'Bengali songs' },
    { pattern: /english/i, keyword: 'English pop songs' },
    { pattern: /k-?pop|korean/i, keyword: 'K-pop songs' },
    { pattern: /bollywood/i, keyword: 'Bollywood songs' },
    { pattern: /hip\s*hop|rap/i, keyword: 'Hip hop songs' },
    { pattern: /lofi|lo-?fi/i, keyword: 'Lofi songs' },
    { pattern: /edm|electronic/i, keyword: 'EDM songs' },
    { pattern: /rock/i, keyword: 'Rock songs' },
    { pattern: /pop/i, keyword: 'Pop songs' },
  ];
  
  for (const { pattern, keyword } of genrePatterns) {
    if (pattern.test(lowerTitle)) {
      keywords.push(keyword);
    }
  }
  
  // Year pattern - useful for finding similar era songs
  const yearMatch = lowerTitle.match(/20(2[0-5]|1[0-9])/);
  if (yearMatch && keywords.length > 0) {
    keywords[0] = keywords[0].replace(' songs', ` songs ${yearMatch[0]}`);
  }
  
  return keywords;
}

// Extract artist name from title (often in "Artist - Song" format or after | symbol)
function extractArtistFromTitle(title: string): string | null {
  // Try "Artist - Song" format
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    const artistPart = parts[0].trim()
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .trim();
    // Artist names are usually short
    if (artistPart.length > 2 && artistPart.length < 30 && !artistPart.match(/official|video|audio|lyric/i)) {
      return artistPart;
    }
  }
  
  // Try to find artist after specific patterns
  const patterns = [
    /\|\s*([A-Z][a-zA-Z\s]+?)(?:\s*\||$)/,  // After | symbol
    /by\s+([A-Z][a-zA-Z\s]+?)(?:\s*\||$)/i,  // "by Artist"
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1] && match[1].length < 25) {
      const artist = match[1].trim();
      if (!artist.match(/official|video|new|songs|music|audio/i)) {
        return artist;
      }
    }
  }
  
  return null;
}

// Check if a title contains a specific song name
function titleContainsSong(title: string, songName: string): boolean {
  const normalizedTitle = title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');
  const normalizedSong = songName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');
  
  // Check if title contains the song name
  if (normalizedTitle.includes(normalizedSong)) return true;
  
  // Check if song name words appear in title
  const songWords = normalizedSong.split(' ').filter(w => w.length > 2);
  if (songWords.length >= 1) {
    const matchingWords = songWords.filter(w => normalizedTitle.includes(w));
    // If most words match, it's likely the same song
    if (matchingWords.length >= Math.ceil(songWords.length * 0.7)) return true;
  }
  
  return false;
}

// Check if two titles are duplicates of each other
function areTitlesDuplicates(title1: string, title2: string, coreSongName: string): boolean {
  // First check: does the new title contain the core song name?
  if (coreSongName && titleContainsSong(title2, coreSongName)) {
    return true;
  }
  
  // Extract core song names from both titles
  const song1 = extractCoreSongName(title1);
  const song2 = extractCoreSongName(title2);
  
  // If extracted song names are similar, it's a duplicate
  if (song1 === song2) return true;
  if (song1.length > 3 && song2.length > 3) {
    if (song1.includes(song2) || song2.includes(song1)) return true;
  }
  
  // Check word overlap for song names
  const words1 = song1.split(' ').filter(w => w.length > 2);
  const words2 = song2.split(' ').filter(w => w.length > 2);
  
  if (words1.length >= 1 && words2.length >= 1) {
    const matchingWords = words1.filter(w => words2.includes(w));
    const matchRatio = matchingWords.length / Math.min(words1.length, words2.length);
    if (matchRatio >= 0.6) return true;
  }
  
  return false;
}

// Direct YouTube scraping for related content
async function searchYouTubeRelated(query: string, excludeVideoId: string, currentSongTitle: string, coreSongName: string, existingTitles: string[]): Promise<Track[]> {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  console.log('Searching YouTube:', searchUrl);
  
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
    const lengthText = video.lengthText?.simpleText || '0:00';
    
    if (!lengthText || lengthText.includes('LIVE')) continue;
    
    // Skip if it's a duplicate of the current song
    if (areTitlesDuplicates(currentSongTitle, title, coreSongName)) {
      console.log('Skipping duplicate of current song:', title);
      continue;
    }
    
    // Skip if it's a duplicate of already added tracks
    const newSongName = extractCoreSongName(title);
    const isDuplicate = addedSongNames.some(existing => {
      if (existing === newSongName) return true;
      if (existing.length > 3 && newSongName.length > 3) {
        if (existing.includes(newSongName) || newSongName.includes(existing)) return true;
      }
      // Check word overlap
      const words1 = existing.split(' ').filter(w => w.length > 2);
      const words2 = newSongName.split(' ').filter(w => w.length > 2);
      if (words1.length >= 1 && words2.length >= 1) {
        const matchingWords = words1.filter(w => words2.includes(w));
        if (matchingWords.length >= Math.min(words1.length, words2.length)) return true;
      }
      return false;
    });
    
    if (isDuplicate) {
      console.log('Skipping duplicate track:', title);
      continue;
    }
    
    addedSongNames.push(newSongName);
    
    const lengthParts = lengthText.split(':').map(Number);
    let lengthMs = 0;
    if (lengthParts.length === 3) {
      lengthMs = (lengthParts[0] * 3600 + lengthParts[1] * 60 + lengthParts[2]) * 1000;
    } else if (lengthParts.length === 2) {
      lengthMs = (lengthParts[0] * 60 + lengthParts[1]) * 1000;
    }
    
    // Skip videos longer than 12 minutes or shorter than 1 minute
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
    
    console.log('Fetching recommendations for:', { videoId, title, author, existingTitlesCount: existingTitles.length });
    
    if (!title && !author) {
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const coreSongName = extractCoreSongName(title || '');
    
    // Extract genre keywords from the title (e.g., "Haryanvi", "Punjabi", etc.)
    const genreKeywords = extractGenreKeywords(title || '');
    console.log('Extracted genre keywords:', genreKeywords);
    
    // Extract actual artist from the title if possible
    const titleArtist = extractArtistFromTitle(title || '');
    console.log('Extracted artist from title:', titleArtist);
    
    // Include current song title in existing titles for dedup
    const allExistingTitles = [title, ...existingTitles].filter(Boolean);
    
    // Build search queries - prioritize genre-based searches for regional music
    const queries: string[] = [];
    
    // If we found genre keywords, use those first (most important for regional music)
    if (genreKeywords.length > 0) {
      queries.push(...genreKeywords.slice(0, 2)); // e.g., "Haryanvi songs 2024"
    }
    
    // If we extracted an artist from the title, use that
    if (titleArtist) {
      queries.push(`${titleArtist} songs`);
    }
    
    // Use core song name for "similar to" search
    if (coreSongName && coreSongName.split(' ').length >= 2) {
      queries.push(`${coreSongName} similar songs`);
    }
    
    // Fallback to channel name only if no better options
    if (queries.length === 0 && author) {
      const cleanAuthor = author
        .replace(/VEVO$/i, '')
        .replace(/Official$/i, '')
        .replace(/ - Topic$/i, '')
        .trim();
      if (cleanAuthor.length > 2) {
        queries.push(`${cleanAuthor} songs`);
      }
    }
    
    // Final fallback - just search for popular songs
    if (queries.length === 0) {
      queries.push('new songs 2024');
    }
    
    console.log('Search queries:', queries);
    
    for (const query of queries) {
      try {
        console.log('Trying query:', query);
        const results = await searchYouTubeRelated(query, videoId, title, coreSongName, allExistingTitles);
        
        if (results.length >= 3) {
          console.log(`Found ${results.length} recommendations`);
          return new Response(
            JSON.stringify({ results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log(`Only found ${results.length} results, trying next query`);
      } catch (error) {
        console.error('Query failed:', query, error);
      }
    }
    
    console.log('No recommendations found');
    return new Response(
      JSON.stringify({ results: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch recommendations' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
