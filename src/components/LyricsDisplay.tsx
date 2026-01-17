import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, X } from "lucide-react";

interface LyricsDisplayProps {
  videoId: string;
  title: string;
  artist: string;
  currentTime: number;
  isPlaying: boolean;
}

interface LyricLine {
  time: number;
  text: string;
}

export const LyricsDisplay = ({ videoId, title, artist, currentTime, isPlaying }: LyricsDisplayProps) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoId && isVisible) {
      fetchLyrics();
    }
  }, [videoId, isVisible]);

  useEffect(() => {
    if (currentLineRef.current && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const currentLine = currentLineRef.current;
      const containerHeight = container.clientHeight;
      const lineTop = currentLine.offsetTop;
      const lineHeight = currentLine.clientHeight;
      
      container.scrollTo({
        top: lineTop - containerHeight / 2 + lineHeight / 2,
        behavior: 'smooth'
      });
    }
  }, [currentLineIndex]);

  useEffect(() => {
    if (lyrics.length === 0 || !isPlaying) return;

    const currentLine = lyrics.findIndex((line, index) => {
      const nextLine = lyrics[index + 1];
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
    });

    if (currentLine !== -1 && currentLine !== currentLineIndex) {
      setCurrentLineIndex(currentLine);
    }
  }, [currentTime, lyrics, isPlaying]);

  const fetchLyrics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-lyrics', {
        body: { videoId, title, artist }
      });

      if (error) throw error;

      if (data && data.lyrics) {
        setLyrics(data.lyrics);
        setError(null);
      } else {
        setError('Lyrics not available for this track');
        setLyrics([]);
      }
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      setError('Failed to fetch lyrics');
      setLyrics([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    return (
      <div className="mt-4">
        <Button onClick={() => setIsVisible(true)} variant="outline" className="w-full">
          Show Live Lyrics
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-6 mt-4 bg-card/50 backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-foreground">Live Lyrics</h3>
        <Button onClick={() => setIsVisible(false)} size="sm" variant="ghost">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <p className="text-muted-foreground text-center py-8">{error}</p>
      ) : lyrics.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No lyrics available</p>
      ) : (
        <div 
          ref={lyricsContainerRef}
          className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar"
        >
          <div className="flex flex-col items-center text-center">
            {lyrics.map((line, index) => (
              <div
                key={index}
                ref={index === currentLineIndex ? currentLineRef : null}
                className={`py-2 px-4 rounded transition-all duration-300 w-full max-w-2xl text-center ${
                  index === currentLineIndex
                    ? 'bg-primary/20 text-foreground font-semibold text-lg scale-105'
                    : index === currentLineIndex - 1 || index === currentLineIndex + 1
                    ? 'text-foreground/80'
                    : 'text-muted-foreground'
                }`}
              >
                {line.text}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground text-center mt-4">
        Lyrics source: lrclib.net, lyrics.ovh, YouTube captions
      </p>
    </Card>
  );
};