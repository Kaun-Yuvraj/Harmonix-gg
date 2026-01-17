import { useEffect, useState, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Music, Mic2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LyricsDisplayProps {
  videoId: string;
  title: string;
  artist: string;
  currentTime: number;
  isPlaying: boolean;
}

interface LyricLine {
  text: string;
  startTime: number;
  duration: number;
}

export const LyricsDisplay = ({ videoId, title, artist, currentTime, isPlaying }: LyricsDisplayProps) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLyrics = async () => {
      setLoading(true);
      setError(null);
      setLyrics([]);

      try {
        const { data, error } = await supabase.functions.invoke('get-lyrics', {
          body: { title, artist }
        });

        if (error) throw error;

        if (data?.lyrics) {
          const parsedLyrics = parseLyrics(data.lyrics);
          setLyrics(parsedLyrics);
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

    if (title && artist) {
      fetchLyrics();
    }
  }, [title, artist]);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentTime]);

  const parseLyrics = (lrc: string): LyricLine[] => {
    const lines = lrc.split('\n');
    return lines
      .map(line => {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
        if (match) {
          const minutes = parseInt(match[1]);
          const seconds = parseInt(match[2]);
          const ms = parseInt(match[3].padEnd(3, '0'));
          const startTime = minutes * 60 * 1000 + seconds * 1000 + ms;
          return {
            text: match[4].trim(),
            startTime,
            duration: 0 
          };
        }
        return null;
      })
      .filter((line): line is LyricLine => line !== null && line.text.length > 0)
      .map((line, index, array) => {
        const nextLine = array[index + 1];
        return {
          ...line,
          duration: nextLine ? nextLine.startTime - line.startTime : 5000
        };
      });
  };

  const currentLineIndex = lyrics.findIndex((line, index) => {
    const nextLine = lyrics[index + 1];
    return currentTime >= line.startTime && (!nextLine || currentTime < nextLine.startTime);
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
        <p>Instrumental or Lyrics Unavailable</p>
      </div>
    );
  }

  return (
    <div className="relative h-[400px] overflow-hidden" ref={containerRef}>
      {/* Top/Bottom Fade Masks */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-card via-card/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card via-card/80 to-transparent z-10 pointer-events-none" />
      
      {/* Karaoke Icon Background */}
      <div className="absolute top-4 right-4 opacity-10">
        <Mic2 className="w-24 h-24 rotate-12" />
      </div>

      <div className="py-[40%] px-8 space-y-6 text-center">
        {lyrics.map((line, index) => {
          const isActive = index === currentLineIndex;
          const isPast = index < currentLineIndex;
          
          return (
            <div
              key={index}
              ref={isActive ? activeLineRef : null}
              className={`transition-all duration-500 ease-out transform
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
