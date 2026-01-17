import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Play, Pause, SkipForward, SkipBack, Search, Shuffle, Repeat, 
  Volume2, VolumeX, Trash2, Heart, History, ListMusic, Disc
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import MiniPlayer from "./MiniPlayer";
import DraggableQueueItem from "./DraggableQueueItem";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

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

const MusicPlayer = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [repeatMode, setRepeatMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [isPlayerInView, setIsPlayerInView] = useState(true);
  
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const mainPlayerRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<Track[]>([]);
  const currentIndexRef = useRef(-1);
  const autoplayEnabledRef = useRef(true);
  const repeatModeRef = useRef(false);
  const playerReadyRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { toast } = useToast();

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { autoplayEnabledRef.current = autoplayEnabled; }, [autoplayEnabled]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { playerReadyRef.current = playerReady; }, [playerReady]);

  useEffect(() => {
    if (!mainPlayerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPlayerInView(entry.isIntersecting);
        if (!entry.isIntersecting && currentIndex !== -1) {
          setShowMiniPlayer(true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(mainPlayerRef.current);
    return () => observer.disconnect();
  }, [currentIndex]);

  useEffect(() => {
    loadYouTubeAPI();
    checkAuth();
    return () => { if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    if (session?.user) {
      loadFavorites(session.user.id);
      loadHistory(session.user.id);
    }
  };

  const loadFavorites = async (userId: string) => {
    const { data } = await supabase.from('favorites').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setFavorites(data.map(f => f.track_data as unknown as Track));
  };

  const loadHistory = async (userId: string) => {
    const { data } = await supabase.from('play_history').select('*').eq('user_id', userId).order('played_at', { ascending: false }).limit(50);
    if (data) setHistory(data.map(h => h.track_data as unknown as Track));
  };

  const toggleFavorite = async (track: Track) => {
    if (!user) return toast({ title: "Login Required", variant: "destructive" });
    const isFav = favorites.some(f => f.info.identifier === track.info.identifier);
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('track_id', track.info.identifier);
      setFavorites(favorites.filter(f => f.info.identifier !== track.info.identifier));
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, track_id: track.info.identifier, track_data: track as any });
      setFavorites([track, ...favorites]);
    }
  };

  const addToHistory = async (track: Track) => {
    if (!user) return;
    await supabase.from('play_history').insert({ user_id: user.id, track_id: track.info.identifier, track_data: track as any });
    setHistory(prev => [track, ...prev.slice(0, 49)]);
  };

  const shuffleQueue = () => {
    if (queue.length <= 1) return;
    const currentTrack = queue[currentIndex];
    const otherTracks = queue.filter((_, i) => i !== currentIndex);
    for (let i = otherTracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
    }
    setQueue([currentTrack, ...otherTracks]);
    setCurrentIndex(0);
  };

  const loadYouTubeAPI = () => {
    if (window.YT && window.YT.Player) { initializePlayer(); return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = initializePlayer;
  };

  const initializePlayer = () => {
    playerRef.current = new window.YT.Player('youtube-player', {
      height: '0', width: '0',
      playerVars: { autoplay: 0, controls: 0, origin: window.location.origin },
      events: {
        onReady: () => { setPlayerReady(true); playerRef.current.setVolume(volume); },
        onStateChange: (e: any) => {
          if (e.data === window.YT.PlayerState.PLAYING) { setIsPlaying(true); startProgressTracking(); }
          else if (e.data === window.YT.PlayerState.PAUSED) { setIsPlaying(false); stopProgressTracking(); }
          else if (e.data === window.YT.PlayerState.ENDED) handleTrackEnd();
        }
      }
    });
  };

  const startProgressTracking = () => {
    stopProgressTracking();
    progressIntervalRef.current = window.setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime() * 1000);
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const searchTracks = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-search`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (e) { console.error(e); }
    setIsSearching(false);
  };

  const addToQueue = (track: Track, playNow = false) => {
    const newQueue = [...queue, track];
    setQueue(newQueue);
    if (playNow || currentIndex === -1) {
      const idx = playNow ? newQueue.length - 1 : 0;
      setCurrentIndex(idx);
      playTrack(track);
      addToHistory(track);
      if (autoplayEnabled) fetchRecommendationsForTrack(track, newQueue);
    }
  };

  const playTrack = (track: Track) => {
    if (playerRef.current && playerReadyRef.current) {
      playerRef.current.loadVideoById(track.info.identifier);
      setDuration(track.info.length);
    }
  };

  const handleTrackEnd = () => {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    
    if (repeatModeRef.current && q[idx]) {
      playTrack(q[idx]);
      return;
    }

    const nextIdx = idx + 1;
    if (nextIdx < q.length) {
      setCurrentIndex(nextIdx);
      playTrack(q[nextIdx]);
      addToHistory(q[nextIdx]);
      
      if (autoplayEnabledRef.current && q.length - nextIdx <= 5) {
        fetchRecommendationsForTrack(q[nextIdx], q);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const fetchRecommendationsForTrack = async (track: Track, currentQueue: Track[]) => {
    if (isLoadingRecommendations) return;
    setIsLoadingRecommendations(true);
    
    try {
      const existingTitles = currentQueue.map(t => t.info.title);
      
      let res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-recommendations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: track.info.identifier, title: track.info.title, existingTitles })
      });
      
      let data = await res.json();
      
      if (!data.results || data.results.length === 0) {
        console.log("Autoplay: No recommendations, trying fallback Artist Song search...");
        // Fallback: Search for Artist's other songs (not Mix, as Mix is a playlist)
        res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-search`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `${track.info.author} songs` })
        });
        data = await res.json();
      }

      if (data.results && data.results.length > 0) {
        const existingIds = new Set(currentQueue.map(t => t.info.identifier));
        const newTracks = data.results
          .filter((t: Track) => !existingIds.has(t.info.identifier))
          .slice(0, 10);
        
        if (newTracks.length > 0) {
          setQueue(prev => [...prev, ...newTracks]);
          toast({ title: "Autoplay", description: `Added ${newTracks.length} tracks` });
        }
      }
    } catch (e) { console.error(e); }
    setIsLoadingRecommendations(false);
  };

  const formatDuration = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
  };
  const handleVolumeChange = (v: number) => { setVolume(v); playerRef.current?.setVolume(v); };
  const toggleMute = () => { 
    if (isMuted) playerRef.current?.unMute(); else playerRef.current?.mute();
    setIsMuted(!isMuted);
  };
  const seekTo = (pct: number) => { playerRef.current?.seekTo((currentTrack!.info.length / 1000) * pct, true); };
  const togglePlay = () => isPlaying ? playerRef.current?.pauseVideo() : playerRef.current?.playVideo();
  const playNext = () => { if(currentIndex < queue.length-1) { setCurrentIndex(currentIndex+1); playTrack(queue[currentIndex+1]); addToHistory(queue[currentIndex+1]); } };
  const playPrev = () => { if(currentIndex > 0) { setCurrentIndex(currentIndex-1); playTrack(queue[currentIndex-1]); addToHistory(queue[currentIndex-1]); } };
  const removeFromQueue = (i: number) => { const n = [...queue]; n.splice(i, 1); setQueue(n); if(i<currentIndex) setCurrentIndex(currentIndex-1); };
  const clearQueue = () => { setQueue([]); setCurrentIndex(-1); setIsPlaying(false); playerRef.current?.stopVideo(); };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = parseInt(String(active.id).split('-').pop()!);
    const newIndex = parseInt(String(over.id).split('-').pop()!);
    setQueue((items) => arrayMove(items, oldIndex, newIndex));
    if (oldIndex === currentIndex) setCurrentIndex(newIndex);
  };

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;
  const isFavorite = currentTrack ? favorites.some(f => f.info.identifier === currentTrack.info.identifier) : false;

  return (
    <section id="web-player" className="py-24 bg-card/30 relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/10 rounded-full blur-[150px] transition-opacity duration-1000 ${isPlaying ? 'opacity-100 animate-pulse-slow' : 'opacity-30'}`} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Harmonix <span className="text-gradient">Web Player</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Search and play unlimited songs - 24/7 reliable playback
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 mb-8 max-w-3xl mx-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <Input
            type="text"
            placeholder="Search for songs (e.g., Karan Aujla Boyfriend)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
            className="flex-1 bg-background/80 backdrop-blur-md border-transparent relative z-10"
          />
          <Button onClick={searchTracks} disabled={isSearching} variant="hero" className="relative z-10 shadow-glow">
            <Search className="mr-2 h-4 w-4" />
            {isSearching ? '...' : 'Search'}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 justify-center">
          {[
            { id: 'queue', label: 'Queue', icon: ListMusic, active: !showFavorites && !showHistory, onClick: () => { setShowFavorites(false); setShowHistory(false); } },
            { id: 'favs', label: 'Favorites', icon: Heart, active: showFavorites, onClick: () => { setShowFavorites(true); setShowHistory(false); } },
            { id: 'hist', label: 'History', icon: History, active: showHistory, onClick: () => { setShowHistory(true); setShowFavorites(false); } }
          ].map((tab) => (
            <Button 
              key={tab.id}
              variant={tab.active ? "hero" : "ghost"} 
              size="sm"
              onClick={tab.onClick}
              className={`rounded-full px-6 ${!tab.active && 'bg-secondary/50 hover:bg-secondary'}`}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label} ({tab.id === 'queue' ? queue.length : tab.id === 'favs' ? favorites.length : history.length})
            </Button>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Player */}
          <div className="lg:col-span-5 order-2 lg:order-1 sticky top-24" ref={mainPlayerRef}>
            {currentTrack ? (
              <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                {/* Vinyl Effect */}
                <div className="relative aspect-square mb-8 flex items-center justify-center">
                  <div className={`absolute inset-0 bg-black rounded-full shadow-2xl border-4 border-card/50 ${isPlaying ? 'animate-spin-slow' : ''}`} style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
                    <div className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(#1a1a1a_0,_#1a1a1a_2px,_#000_3px,_#000_4px)] opacity-50" />
                    <img
                      src={currentTrack.info.artworkUrl || `https://img.youtube.com/vi/${currentTrack.info.identifier}/default.jpg`}
                      alt={currentTrack.info.title}
                      className="absolute inset-[15%] w-[70%] h-[70%] rounded-full object-cover border-8 border-black"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full border-2 border-white/20 z-10" />
                  </div>
                  <div className="absolute -inset-4 bg-primary/30 rounded-full blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>

                {/* Track Info */}
                <div className="text-center mb-8 space-y-2">
                  <h3 className="text-2xl font-bold truncate text-glow">{currentTrack.info.title}</h3>
                  <p className="text-lg text-muted-foreground truncate">{currentTrack.info.author}</p>
                </div>

                {/* Progress */}
                <div className="mb-8 px-2 group/progress">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground mb-3">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(currentTrack.info.length)}</span>
                  </div>
                  <div
                    className="h-2 bg-secondary rounded-full cursor-pointer overflow-hidden relative"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percentage = (e.clientX - rect.left) / rect.width;
                      seekTo(percentage);
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent transition-all duration-100 group-hover/progress:brightness-125"
                      style={{ width: `${(currentTime / currentTrack.info.length) * 100}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-glow opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between gap-4 bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                   <Button variant="ghost" size="icon" onClick={() => setShuffleMode(!shuffleMode)} className={shuffleMode ? 'text-primary' : 'text-muted-foreground'}>
                    <Shuffle className="h-5 w-5" />
                  </Button>
                  
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={playPrev} className="hover:text-white hover:scale-110 transition-all">
                      <SkipBack className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="hero"
                      size="icon"
                      onClick={togglePlay}
                      className="h-14 w-14 rounded-full shadow-glow hover:scale-105 transition-all"
                    >
                      {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-1" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={playNext} className="hover:text-white hover:scale-110 transition-all">
                      <SkipForward className="h-6 w-6" />
                    </Button>
                  </div>

                  <Button variant="ghost" size="icon" onClick={() => setRepeatMode(!repeatMode)} className={repeatMode ? 'text-primary' : 'text-muted-foreground'}>
                    <Repeat className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Volume & Actions */}
                <div className="flex items-center justify-between mt-6 px-4">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8 text-muted-foreground hover:text-white">
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <div className="w-24 h-1 bg-secondary rounded-full overflow-hidden relative">
                       <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                        className="w-full h-full opacity-0 cursor-pointer absolute z-10"
                      />
                      <div className="h-full bg-muted-foreground/50 rounded-full transition-all" style={{ width: `${volume}%` }} />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => toggleFavorite(currentTrack)} className={isFavorite ? 'text-primary' : 'text-muted-foreground hover:text-white'}>
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-card/20 border border-white/5 rounded-3xl p-12 text-center h-full flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Disc className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Track Playing</h3>
                <p className="text-muted-foreground mb-6">Select a song from the queue or search to start vibe.</p>
              </div>
            )}
          </div>

          {/* Right Column: Queue Only */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
            <Card className="bg-card/20 border-white/5 backdrop-blur-md overflow-hidden rounded-2xl">
               <div className="p-6">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      {showFavorites ? 'Favorites' : showHistory ? 'History' : 'Queue'}
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {showFavorites ? favorites.length : showHistory ? history.length : queue.length}
                      </span>
                    </h3>
                    {!showFavorites && !showHistory && (
                      <div className="flex gap-2">
                        <Button onClick={shuffleQueue} variant="ghost" size="sm" className="hover:bg-white/5"><Shuffle className="h-4 w-4 mr-2" /> Shuffle</Button>
                        <Button onClick={clearQueue} variant="ghost" size="sm" className="hover:bg-red-500/20 hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                 </div>
                 
                 <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {searchResults.length > 0 && !showFavorites && !showHistory && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Search Results</h4>
                        {searchResults.map((track, index) => (
                          <div key={`search-${index}`} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg">
                             <img src={track.info.artworkUrl} className="w-10 h-10 rounded" />
                             <div className="flex-1 min-w-0">
                               <div className="font-medium truncate">{track.info.title}</div>
                               <div className="text-xs text-muted-foreground">{track.info.author}</div>
                             </div>
                             <Button size="sm" variant="hero" onClick={() => { addToQueue(track); setSearchResults([]); setSearchQuery(""); }}>Add</Button>
                          </div>
                        ))}
                        <div className="h-px bg-white/10 my-4" />
                      </div>
                    )}

                    {!showFavorites && !showHistory && queue.length === 0 && searchResults.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <ListMusic className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Queue is empty</p>
                      </div>
                    )}

                    {!showFavorites && !showHistory && queue.length > 0 && (
                       <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={queue.map((t, i) => t.info.identifier + '-' + i)} strategy={verticalListSortingStrategy}>
                          {queue.map((track, index) => (
                            <DraggableQueueItem
                              key={track.info.identifier + '-' + index}
                              track={track}
                              index={index}
                              isCurrentTrack={index === currentIndex}
                              isFavorite={favorites.some(f => f.info.identifier === track.info.identifier)}
                              onPlay={() => { setCurrentIndex(index); playTrack(track); addToHistory(track); }}
                              onToggleFavorite={() => toggleFavorite(track)}
                              onRemove={() => removeFromQueue(index)}
                              formatDuration={formatDuration}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    )}
                    
                    {(showFavorites ? favorites : showHistory ? history : []).map((track, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-card/50 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer" onClick={() => addToQueue(track, true)}>
                         <img src={track.info.artworkUrl} className="w-10 h-10 rounded" />
                         <div className="flex-1">
                           <div className="font-medium">{track.info.title}</div>
                           <div className="text-xs text-muted-foreground">{track.info.author}</div>
                         </div>
                         <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toggleFavorite(track); }}><Heart className="h-4 w-4 fill-primary text-primary" /></Button>
                      </div>
                    ))}
                 </div>
               </div>
            </Card>
          </div>
        </div>

        <div ref={playerContainerRef} className="hidden"><div id="youtube-player"></div></div>
      </div>

      <MiniPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        onTogglePlay={togglePlay}
        onNext={playNext}
        onPrev={playPrev}
        onClose={() => setShowMiniPlayer(false)}
        isVisible={showMiniPlayer && !isPlayerInView}
      />
    </section>
  );
};

export default MusicPlayer;
