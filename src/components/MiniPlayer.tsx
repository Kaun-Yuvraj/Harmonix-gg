import { Play, Pause, SkipForward, SkipBack, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface MiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  isVisible: boolean;
}

const MiniPlayer = ({
  currentTrack,
  isPlaying,
  currentTime,
  onTogglePlay,
  onNext,
  onPrev,
  onClose,
  isVisible
}: MiniPlayerProps) => {
  if (!currentTrack || !isVisible) return null;

  const progress = (currentTime / currentTrack.info.length) * 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      {/* Progress bar at top */}
      <div className="h-1 bg-muted">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="bg-card/95 backdrop-blur-lg border-t border-border px-4 py-3">
        <div className="max-w-screen-xl mx-auto flex items-center gap-4">
          {/* Album art */}
          <img
            src={currentTrack.info.artworkUrl || `https://img.youtube.com/vi/${currentTrack.info.identifier}/default.jpg`}
            alt={currentTrack.info.title}
            className="w-12 h-12 rounded-lg object-cover shadow-lg"
          />
          
          {/* Track info */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{currentTrack.info.title}</div>
            <div className="text-xs text-muted-foreground truncate">{currentTrack.info.author}</div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onPrev} className="h-8 w-8">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button 
              variant="hero" 
              size="icon" 
              onClick={onTogglePlay}
              className="h-10 w-10 rounded-full"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onNext} className="h-8 w-8">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Close button */}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;
