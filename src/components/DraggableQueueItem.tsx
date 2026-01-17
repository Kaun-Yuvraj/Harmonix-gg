import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Heart, Trash2 } from "lucide-react";
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

interface DraggableQueueItemProps {
  track: Track;
  index: number;
  isCurrentTrack: boolean;
  isFavorite: boolean;
  onPlay: () => void;
  onToggleFavorite: () => void;
  onRemove: () => void;
  formatDuration: (ms: number) => string;
}

const DraggableQueueItem = ({
  track,
  index,
  isCurrentTrack,
  isFavorite,
  onPlay,
  onToggleFavorite,
  onRemove,
  formatDuration
}: DraggableQueueItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: track.info.identifier + '-' + index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
        isCurrentTrack
          ? 'bg-primary/20 border-l-4 border-primary'
          : 'bg-card/50 hover:bg-primary/10'
      } ${isDragging ? 'shadow-lg ring-2 ring-primary/50' : ''}`}
      onClick={onPlay}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-primary/10 rounded"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <img
        src={track.info.artworkUrl || `https://img.youtube.com/vi/${track.info.identifier}/default.jpg`}
        alt={track.info.title}
        className="w-12 h-12 rounded object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className={`font-semibold truncate ${isCurrentTrack ? 'text-primary' : ''}`}>
          {track.info.title}
        </div>
        <div className="text-sm text-muted-foreground truncate">{track.info.author}</div>
      </div>
      <div className="text-sm text-muted-foreground">
        {formatDuration(track.info.length)}
      </div>
      <Button 
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} 
        variant="ghost" 
        size="sm"
      >
        <Heart className={`h-4 w-4 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
      </Button>
      <Button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        variant="ghost"
        size="sm"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default DraggableQueueItem;
