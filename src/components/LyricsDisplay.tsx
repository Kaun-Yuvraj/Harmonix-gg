import { useEffect, useState, useRef } from "react";
import { Loader2, Music, Mic2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LyricsDisplayProps {
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
}

interface LyricLine {
  text: string;
  startTime: number;
  duration: number;
}

export const LyricsDisplay = ({ videoId, title, artist, duration, currentTime, isPlaying }: LyricsDisplayProps) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Sync Adjustment: 300ms delay makes lyrics feel "tighter" and less jumpy
  const SYNC_COMPENSATION = 300; 

  useEffect(() => {
    // Reset state on new song
    setLyrics([]);
    setError(null);
    setLoading(true);

    const fetchLyrics = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-lyrics', {
          body: { videoId, title, artist, duration }
        });

        if (error) throw error;

        if (data?.lyrics) {
          const parsedLyrics = parseLyrics(data.lyrics);
          if (parsedLyrics.length > 0) {
            setLyrics(parsedLyrics);
          } else {
            setError("Lyrics format not supported");
          }
        } else {
          setError("Lyrics not found");
        }
      } catch (err) {
        console.error("Error fetching lyrics:", err);
        setError("Could not load lyrics");
      } finally {
        setLoading(false);
      }
    };

    if (title) {
      fetchLyrics();
    } else {
      setLoading(false);
      setError("Waiting for track...");
    }
  }, [videoId, title, artist, duration]);

  // Smooth Scroll Logic
  useEffect(() => {
    if (!containerRef.current || !activeLineRef.current) return;
    const container = containerRef.current;
    const activeLine = activeLineRef.current;
    
    // Calculate center position
    const targetScroll = activeLine.offsetTop - (container.clientHeight / 2) + (activeLine.clientHeight / 2);

    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  }, [currentTime]); // Trigger scroll on time update

  const parseLyrics = (lrc: any): LyricLine[] => {
    if (Array.isArray(lrc)) {
      return lrc.map((line: any) => ({
        text: line.text,
        startTime: line.time,
        duration: 0
      }));
    }
    return [];
  };

  // Calculate active line with compensation
  const adjustedTime = currentTime - SYNC_COMPENSATION;
  
  const currentLineIndex = lyrics.findIndex((line, index) => {
    const nextLine = lyrics[index + 1];
    return adjustedTime >= line.startTime && (!nextLine || adjustedTime < nextLine.startTime);
  });

  if (loading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="animate-pulse">Syncing Lyrics...</p>
      </div>
    );
  }

  if (error || lyrics.length === 0) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground/50">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <Music className="w-8 h-8" />
        </div>
        <p>{error || "Instrumental or Lyrics Unavailable"}</p>
      </div>
    );
  }

  return (
    <div className="relative h-[400px] overflow-hidden rounded-2xl group" ref={containerRef}>
      {/* Top/Bottom Fade Masks */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-card via-card/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card via-card/80 to-transparent z-10 pointer-events-none" />
      
      <div className="absolute top-4 right-4 opacity-10 pointer-events-none">
        <Mic2 className="w-24 h-24 rotate-12" />
      </div>

      <div className="py-[40%] px-8 space-y-8 text-center">
        {lyrics.map((line, index) => {
          const isActive = index === currentLineIndex;
          const isPast = index < currentLineIndex;
          
          return (
            <div
              key={index}
              ref={isActive ? activeLineRef : null}
              className={`transition-all duration-300 ease-out transform
                ${isActive 
                  ? "scale-110 text-white font-bold text-2xl drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                  : isPast 
                    ? "opacity-30 blur-[1px] scale-95" 
                    : "opacity-40 scale-95"
                }
              `}
            >
              <p className="leading-relaxed">{line.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
