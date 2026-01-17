import { Play, Pause, SkipForward, SkipBack, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MiniPlayerProps {
  currentTrack: any;
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

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up w-full max-w-md px-4">
      <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-full p-2 pr-6 shadow-2xl flex items-center gap-4 group hover:scale-105 transition-transform duration-300">
        
        {/* Fixed Artwork Display */}
        <div className={`relative w-12 h-12 flex-shrink-0 ${isPlaying ? 'animate-spin-slow' : ''}`}>
           <img
            src={currentTrack.info.artworkUrl || `https://img.youtube.com/vi/${currentTrack.info.identifier}/default.jpg`}
            alt={currentTrack.info.title}
            className="w-full h-full rounded-full object-cover border-2 border-white/10"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold truncate text-white">{currentTrack.info.title}</h4>
          <p className="text-xs text-muted-foreground truncate">{currentTrack.info.author}</p>
          {/* Micro Progress Bar */}
          <div className="w-full h-0.5 bg-white/10 mt-1 rounded-full overflow-hidden">
             <div 
               className="h-full bg-primary" 
               style={{ width: `${(currentTime / currentTrack.info.length) * 100}%` }} 
             />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onPrev} className="h-8 w-8 text-white/70 hover:text-white rounded-full">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button 
            onClick={onTogglePlay} 
            size="icon" 
            className="h-10 w-10 rounded-full bg-white text-black hover:bg-white/90 shadow-glow"
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onNext} className="h-8 w-8 text-white/70 hover:text-white rounded-full">
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-white/50 hover:text-red-400 rounded-full ml-1">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;
