import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Search, 
  Shuffle, 
  Repeat, 
  Volume2, 
  VolumeX,
  Trash2,
  Heart,
  History,
  ListMusic
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LyricsDisplay } from "./LyricsDisplay";
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

  // DnD sensors for drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  // Use refs to track current state for async callbacks (fixes stale closure issue)
  const queueRef = useRef<Track[]>([]);
  const currentIndexRef = useRef(-1);
  const autoplayEnabledRef = useRef(true);
  const repeatModeRef = useRef(false);
  const playerReadyRef = useRef(false);
  
  const { toast } = useToast();
  
  // Keep refs in sync with state
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { autoplayEnabledRef.current = autoplayEnabled; }, [autoplayEnabled]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { playerReadyRef.current = playerReady; }, [playerReady]);

  // Intersection observer for mini player visibility
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
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    
    if (session?.user) {
      loadFavorites(session.user.id);
      loadHistory(session.user.id);
    }

    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadFavorites(session.user.id);
        loadHistory(session.user.id);
      }
    });
  };

  const loadFavorites = async (userId: string) => {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setFavorites(data.map(f => f.track_data as unknown as Track));
    }
  };

  const loadHistory = async (userId: string) => {
    const { data, error } = await supabase
      .from('play_history')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(50);

    if (data && !error) {
      setHistory(data.map(h => h.track_data as unknown as Track));
    }
  };

  const toggleFavorite = async (track: Track) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to save favorites",
        variant: "destructive",
      });
      return;
    }

    const isFav = favorites.some(f => f.info.identifier === track.info.identifier);

    if (isFav) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('track_id', track.info.identifier);
      
      setFavorites(favorites.filter(f => f.info.identifier !== track.info.identifier));
      toast({ title: "Removed from favorites" });
    } else {
      await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          track_id: track.info.identifier,
          track_data: track as any
        });
      
      setFavorites([track, ...favorites]);
      toast({ title: "Added to favorites" });
    }
  };

  const addToHistory = async (track: Track) => {
    if (!user) return;

    await supabase
      .from('play_history')
      .insert({
        user_id: user.id,
        track_id: track.info.identifier,
        track_data: track as any
      });

    setHistory(prev => [track, ...prev.slice(0, 49)]);
  };

  const shuffleQueue = () => {
    if (queue.length <= 1) return;
    
    const currentTrack = queue[currentIndex];
    const otherTracks = queue.filter((_, i) => i !== currentIndex);
    
    // Fisher-Yates shuffle
    for (let i = otherTracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
    }
    
    const newQueue = [currentTrack, ...otherTracks];
    setQueue(newQueue);
    setCurrentIndex(0);
    
    toast({ title: "Queue shuffled" });
  };

  const loadYouTubeAPI = () => {
    if (window.YT && window.YT.Player) {
      initializePlayer();
      return;
    }

    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (existingScript) {
      existingScript.remove();
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      initializePlayer();
    };
  };

  const initializePlayer = () => {
    if (!playerContainerRef.current) return;

    try {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '0',
        width: '0',
        playerVars: {
          autoplay: 0,
          controls: 0,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: () => {
            setPlayerReady(true);
            playerRef.current.setVolume(volume);
            toast({
              title: "Player Ready",
              description: "Search for songs to start playing",
            });
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startProgressTracking();
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              stopProgressTracking();
            } else if (event.data === window.YT.PlayerState.ENDED) {
              handleTrackEnd();
            }
          },
          onError: (event: any) => {
            toast({
              title: "Playback Error",
              description: "Skipping to next track...",
              variant: "destructive",
            });
            playNext();
          },
        },
      });
    } catch (error) {
      toast({
        title: "Player Initialization Failed",
        description: "Please refresh the page",
        variant: "destructive",
      });
    }
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = window.setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentTime = playerRef.current.getCurrentTime() * 1000;
        const duration = playerRef.current.getDuration() * 1000;
        setCurrentTime(currentTime);
        setDuration(duration);
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const searchTracks = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Empty Search",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery })
      });
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setSearchResults(data.results || []);
      
      if (!data.results || data.results.length === 0) {
        toast({ title: "No Results", description: "Try different keywords" });
      } else {
        toast({ title: "Found Results", description: `Found ${data.results.length} songs` });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Could not search tracks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addToQueue = (track: Track, playImmediately = false) => {
    const newQueue = [...queue, track];
    setQueue(newQueue);
    toast({ title: "Added to Queue", description: track.info.title });
    
    if (currentIndex === -1 || playImmediately) {
      const newIndex = playImmediately ? newQueue.length - 1 : 0;
      setCurrentIndex(newIndex);
      playTrack(track);
      addToHistory(track);
      
      // Fetch recommendations when a song starts playing (if autoplay enabled)
      if (autoplayEnabled) {
        fetchRecommendationsForTrack(track, newQueue);
      }
    }
  };

  const playTrackById = (videoId: string, trackLength: number) => {
    console.log('Playing video ID:', videoId);
    
    if (!playerReadyRef.current || !playerRef.current) {
      console.log('YouTube player not ready, retrying in 500ms...');
      setTimeout(() => {
        if (playerReadyRef.current && playerRef.current) {
          try {
            playerRef.current.loadVideoById(videoId);
            setDuration(trackLength);
          } catch (error) {
            console.error('YouTube play error:', error);
          }
        }
      }, 500);
      return;
    }

    try {
      playerRef.current.loadVideoById(videoId);
      setDuration(trackLength);
    } catch (error) {
      console.error('YouTube play error:', error);
      toast({
        title: "Playback Error",
        description: "Could not play track",
        variant: "destructive",
      });
    }
  };

  const playTrack = (track: Track) => {
    console.log('Playing track:', track.info.title);
    stopProgressTracking();
    playTrackById(track.info.identifier, track.info.length);
  };

  const togglePlay = () => {
    if (currentIndex === -1) return;
    
    if (playerReadyRef.current && playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const playNext = () => {
    if (queue.length === 0) return;
    
    let nextIndex;
    if (shuffleMode) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = currentIndex < queue.length - 1 ? currentIndex + 1 : 0;
    }
    
    setCurrentIndex(nextIndex);
    playTrack(queue[nextIndex]);
    addToHistory(queue[nextIndex]);
    
    // Fetch recommendations when next track starts (if autoplay enabled)
    if (autoplayEnabled) {
      fetchRecommendationsForTrack(queue[nextIndex], queue);
    }
  };

  const playPrev = () => {
    if (queue.length === 0) return;
    
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    setCurrentIndex(prevIndex);
    playTrack(queue[prevIndex]);
    addToHistory(queue[prevIndex]);
  };

  const handleTrackEnd = () => {
    // Use refs to get current values (fixes stale closure issue)
    const currentQueue = queueRef.current;
    const currentIdx = currentIndexRef.current;
    const isAutoplayOn = autoplayEnabledRef.current;
    const isRepeatOn = repeatModeRef.current;
    
    console.log('Track ended. Queue:', currentQueue.length, 'Current index:', currentIdx, 'Autoplay:', isAutoplayOn);
    
    // Use setTimeout to break out of YouTube callback context and ensure player is ready
    setTimeout(() => {
      if (isRepeatOn && currentIdx !== -1 && currentQueue[currentIdx]) {
        console.log('Repeat mode - replaying current track');
        playTrackById(currentQueue[currentIdx].info.identifier, currentQueue[currentIdx].info.length);
        return;
      }
      
      const playedTrack = currentQueue[currentIdx];
      
      // Remove the played track from queue (clear played songs)
      const newQueue = currentQueue.filter((_, i) => i !== currentIdx);
      setQueue(newQueue);
      queueRef.current = newQueue;
      
      if (newQueue.length > 0) {
        // Keep the same index (which now points to the next song after removal)
        const nextIndex = Math.min(currentIdx, newQueue.length - 1);
        const nextTrack = newQueue[nextIndex];
        console.log('Playing next track:', nextTrack?.info?.title);
        setCurrentIndex(nextIndex);
        currentIndexRef.current = nextIndex;
        playTrackById(nextTrack.info.identifier, nextTrack.info.length);
        addToHistory(nextTrack);
        
        // Fetch recommendations when next track starts (if autoplay enabled)
        if (isAutoplayOn) {
          fetchRecommendationsForTrack(nextTrack, newQueue);
        }
      } else if (isAutoplayOn && playedTrack) {
        console.log('Queue empty, fetching recommendations for:', playedTrack.info.identifier);
        setCurrentIndex(-1);
        currentIndexRef.current = -1;
        fetchAndPlayRecommendations(playedTrack, []);
      } else {
        console.log('Queue finished, stopping playback');
        setCurrentIndex(-1);
        setIsPlaying(false);
        if (playerRef.current) {
          playerRef.current.stopVideo();
        }
        stopProgressTracking();
        toast({ title: "Queue Finished", description: "Add more songs or enable autoplay" });
      }
    }, 100);
  };

  // Fetch recommendations and add to queue (called when song starts)
  const fetchRecommendationsForTrack = async (basedOnTrack: Track, currentQueue: Track[]) => {
    if (!basedOnTrack || isLoadingRecommendations) return;
    
    // Don't fetch if there are already enough songs in queue after current
    const currentIdx = currentQueue.findIndex(t => t.info.identifier === basedOnTrack.info.identifier);
    const songsAfterCurrent = currentQueue.length - currentIdx - 1;
    if (songsAfterCurrent >= 3) {
      console.log('Already have enough songs in queue, skipping recommendations');
      return;
    }
    
    setIsLoadingRecommendations(true);
    console.log('Fetching recommendations for:', basedOnTrack.info.title);
    
    try {
      // Pass existing queue titles to avoid duplicates
      const existingTitles = currentQueue.map(t => t.info.title);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoId: basedOnTrack.info.identifier,
          title: basedOnTrack.info.title,
          author: basedOnTrack.info.author,
          existingTitles
        })
      });

      if (!response.ok) {
        console.log('Recommendations response not ok:', response.status);
        return;
      }

      const data = await response.json();
      console.log('Recommendations received:', data.results?.length || 0);
      
      if (data.results && data.results.length > 0) {
        // Filter out any tracks already in queue (by video ID)
        const existingIds = new Set(currentQueue.map(t => t.info.identifier));
        const newTracks = data.results.filter((t: Track) => !existingIds.has(t.info.identifier)).slice(0, 5);
        
        if (newTracks.length > 0) {
          const updatedQueue = [...queueRef.current, ...newTracks];
          setQueue(updatedQueue);
          queueRef.current = updatedQueue;
          toast({ title: "Autoplay", description: `Added ${newTracks.length} recommended songs` });
        }
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // Called when track ends and queue is empty - fetch and play
  const fetchAndPlayRecommendations = async (basedOnTrack: Track, currentQueue: Track[]) => {
    if (!basedOnTrack) {
      console.log('No track to base recommendations on');
      return;
    }
    
    setIsLoadingRecommendations(true);
    console.log('Queue empty, fetching recommendations for:', basedOnTrack.info.identifier);
    
    try {
      const existingTitles = currentQueue.map(t => t.info.title);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoId: basedOnTrack.info.identifier,
          title: basedOnTrack.info.title,
          author: basedOnTrack.info.author,
          existingTitles
        })
      });

      if (!response.ok) {
        console.log('Recommendations response not ok:', response.status);
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      console.log('Recommendations received:', data.results?.length || 0);
      
      if (data.results && data.results.length > 0) {
        const recommendations = data.results.slice(0, 5);
        const newQueue = [...currentQueue, ...recommendations];
        setQueue(newQueue);
        queueRef.current = newQueue;
        
        const nextIndex = currentQueue.length;
        setCurrentIndex(nextIndex);
        currentIndexRef.current = nextIndex;
        
        toast({ title: "Autoplay", description: `Added ${recommendations.length} recommended songs` });
        playTrackById(recommendations[0].info.identifier, recommendations[0].info.length);
        addToHistory(recommendations[0]);
      } else {
        console.log('No recommendations found');
        setIsPlaying(false);
        if (playerRef.current) playerRef.current.stopVideo();
        stopProgressTracking();
        toast({ title: "No Recommendations", description: "Could not find similar songs" });
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setIsPlaying(false);
      if (playerRef.current) playerRef.current.stopVideo();
      stopProgressTracking();
      toast({ title: "Autoplay Failed", description: "Could not load recommendations", variant: "destructive" });
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const removeFromQueue = (index: number) => {
    const newQueue = queue.filter((_, i) => i !== index);
    setQueue(newQueue);
    
    if (index === currentIndex) {
      if (newQueue.length === 0) {
        setCurrentIndex(-1);
        if (playerRef.current) playerRef.current.stopVideo();
      } else if (index < newQueue.length) {
        playTrack(newQueue[index]);
      } else {
        setCurrentIndex(newQueue.length - 1);
        playTrack(newQueue[newQueue.length - 1]);
      }
    } else if (index < currentIndex) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
    if (playerRef.current) playerRef.current.stopVideo();
    stopProgressTracking();
    toast({ title: "Queue Cleared" });
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (playerRef.current && playerReadyRef.current) {
      playerRef.current.setVolume(value);
    }
  };

  const toggleMute = () => {
    if (playerRef.current && playerReadyRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
    }
    setIsMuted(!isMuted);
  };

  const seekTo = (percentage: number) => {
    const track = currentTrack;
    if (!track) return;
    
    const seekTime = (track.info.length / 1000) * percentage;
    
    if (playerRef.current && playerReadyRef.current) {
      playerRef.current.seekTo(seekTime, true);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const activeIdParts = String(active.id).split('-');
    const overIdParts = String(over.id).split('-');
    const oldIndex = parseInt(activeIdParts[activeIdParts.length - 1]);
    const newIndex = parseInt(overIdParts[overIdParts.length - 1]);
    
    if (isNaN(oldIndex) || isNaN(newIndex)) return;
    
    const newQueue = arrayMove(queue, oldIndex, newIndex);
    setQueue(newQueue);
    queueRef.current = newQueue;
    
    // Update current index if needed
    if (oldIndex === currentIndex) {
      setCurrentIndex(newIndex);
      currentIndexRef.current = newIndex;
    } else if (oldIndex < currentIndex && newIndex >= currentIndex) {
      setCurrentIndex(currentIndex - 1);
      currentIndexRef.current = currentIndex - 1;
    } else if (oldIndex > currentIndex && newIndex <= currentIndex) {
      setCurrentIndex(currentIndex + 1);
      currentIndexRef.current = currentIndex + 1;
    }
    
    toast({ title: "Queue reordered" });
  };

  const currentTrack = currentIndex >= 0 && queue[currentIndex] ? queue[currentIndex] : null;
  const isFavorite = currentTrack ? favorites.some(f => f.info.identifier === currentTrack.info.identifier) : false;

  return (
    <section id="web-player" className="py-24 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Harmonix <span className="text-gradient">Web Player</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Search and play unlimited songs - 24/7 reliable playback
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-8 max-w-3xl mx-auto">
          <Input
            type="text"
            placeholder="Search for songs (e.g., Imagine Dragons Believer)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
            className="flex-1"
          />
          <Button onClick={searchTracks} disabled={isSearching} variant="hero">
            <Search className="mr-2 h-4 w-4" />
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Tabs for Queue/Favorites/History */}
        <div className="flex gap-2 mb-4 justify-center">
          <Button 
            variant={!showFavorites && !showHistory ? "hero" : "outline"} 
            size="sm"
            onClick={() => { setShowFavorites(false); setShowHistory(false); }}
          >
            <ListMusic className="mr-2 h-4 w-4" />
            Queue ({queue.length})
          </Button>
          <Button 
            variant={showFavorites ? "hero" : "outline"} 
            size="sm"
            onClick={() => { setShowFavorites(true); setShowHistory(false); }}
          >
            <Heart className="mr-2 h-4 w-4" />
            Favorites ({favorites.length})
          </Button>
          <Button 
            variant={showHistory ? "hero" : "outline"} 
            size="sm"
            onClick={() => { setShowHistory(true); setShowFavorites(false); }}
          >
            <History className="mr-2 h-4 w-4" />
            History ({history.length})
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card className="p-6 mb-8 max-h-96 overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Search Results</h3>
            <div className="space-y-2">
              {searchResults.map((track, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-card/50 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <img
                    src={track.info.artworkUrl || `https://img.youtube.com/vi/${track.info.identifier}/default.jpg`}
                    alt={track.info.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{track.info.title}</div>
                    <div className="text-sm text-muted-foreground truncate">{track.info.author}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDuration(track.info.length)}
                  </div>
                  <Button onClick={() => toggleFavorite(track)} variant="ghost" size="sm">
                    <Heart className={`h-4 w-4 ${favorites.some(f => f.info.identifier === track.info.identifier) ? 'fill-primary text-primary' : ''}`} />
                  </Button>
                  <Button onClick={() => addToQueue(track)} size="sm" variant="hero">
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Queue */}
        {!showFavorites && !showHistory && (
          <Card className="p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Queue ({queue.length})</h3>
              <div className="flex gap-2">
                <Button onClick={shuffleQueue} variant="outline" size="sm" disabled={queue.length <= 1}>
                  <Shuffle className="mr-2 h-4 w-4" />
                  Shuffle
                </Button>
                <Button 
                  onClick={() => setAutoplayEnabled(!autoplayEnabled)} 
                  variant={autoplayEnabled ? "hero" : "outline"} 
                  size="sm"
                >
                  {autoplayEnabled ? "Autoplay: ON" : "Autoplay: OFF"}
                </Button>
                <Button onClick={clearQueue} variant="destructive" size="sm" disabled={queue.length === 0}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {queue.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ListMusic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-semibold">Queue is empty</p>
                  <p className="text-sm">Search and add songs to get started!</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={queue.map((t, i) => t.info.identifier + '-' + i)}
                    strategy={verticalListSortingStrategy}
                  >
                    {queue.map((track, index) => (
                      <DraggableQueueItem
                        key={track.info.identifier + '-' + index}
                        track={track}
                        index={index}
                        isCurrentTrack={index === currentIndex}
                        isFavorite={favorites.some(f => f.info.identifier === track.info.identifier)}
                        onPlay={() => {
                          setCurrentIndex(index);
                          playTrack(track);
                          addToHistory(track);
                        }}
                        onToggleFavorite={() => toggleFavorite(track)}
                        onRemove={() => removeFromQueue(index)}
                        formatDuration={formatDuration}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </Card>
        )}

        {/* Favorites */}
        {showFavorites && (
          <Card className="p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Favorites</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {favorites.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-semibold">No favorites yet</p>
                  <p className="text-sm">{user ? "Like songs to save them here" : "Login to save favorites"}</p>
                </div>
              ) : (
                favorites.map((track, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-card/50 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
                    onClick={() => addToQueue(track, true)}
                  >
                    <img
                      src={track.info.artworkUrl || `https://img.youtube.com/vi/${track.info.identifier}/default.jpg`}
                      alt={track.info.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{track.info.title}</div>
                      <div className="text-sm text-muted-foreground truncate">{track.info.author}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDuration(track.info.length)}
                    </div>
                    <Button onClick={(e) => { e.stopPropagation(); toggleFavorite(track); }} variant="ghost" size="sm">
                      <Heart className="h-4 w-4 fill-primary text-primary" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* History */}
        {showHistory && (
          <Card className="p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Recently Played</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-semibold">No history yet</p>
                  <p className="text-sm">{user ? "Play songs to see them here" : "Login to track history"}</p>
                </div>
              ) : (
                history.map((track, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-card/50 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
                    onClick={() => addToQueue(track, true)}
                  >
                    <img
                      src={track.info.artworkUrl || `https://img.youtube.com/vi/${track.info.identifier}/default.jpg`}
                      alt={track.info.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{track.info.title}</div>
                      <div className="text-sm text-muted-foreground truncate">{track.info.author}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDuration(track.info.length)}
                    </div>
                    <Button onClick={(e) => { e.stopPropagation(); toggleFavorite(track); }} variant="ghost" size="sm">
                      <Heart className={`h-4 w-4 ${favorites.some(f => f.info.identifier === track.info.identifier) ? 'fill-primary text-primary' : ''}`} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* Player Controls */}
        {currentTrack && (
          <Card className="p-6" ref={mainPlayerRef}>
            {/* Now Playing Info */}
            <div className="flex items-center gap-4 mb-6">
              <img
                src={currentTrack.info.artworkUrl || `https://img.youtube.com/vi/${currentTrack.info.identifier}/default.jpg`}
                alt={currentTrack.info.title}
                className="w-20 h-20 rounded-lg object-cover shadow-lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate">{currentTrack.info.title}</h3>
                <p className="text-muted-foreground truncate">{currentTrack.info.author}</p>
              </div>
              <Button onClick={() => toggleFavorite(currentTrack)} variant="ghost" size="icon">
                <Heart className={`h-6 w-6 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(currentTrack.info.length)}</span>
              </div>
              <div
                className="h-2 bg-muted rounded-full cursor-pointer overflow-hidden"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percentage = (e.clientX - rect.left) / rect.width;
                  seekTo(percentage);
                }}
              >
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${(currentTime / currentTrack.info.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShuffleMode(!shuffleMode)}
                className={shuffleMode ? 'text-primary' : ''}
              >
                <Shuffle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={playPrev}>
                <SkipBack className="h-6 w-6" />
              </Button>
              <Button
                variant="hero"
                size="lg"
                onClick={togglePlay}
                className="h-14 w-14 rounded-full"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={playNext}>
                <SkipForward className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRepeatMode(!repeatMode)}
                className={repeatMode ? 'text-primary' : ''}
              >
                <Repeat className="h-5 w-5" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-4 max-w-xs">
                <Button variant="ghost" size="icon" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-semibold min-w-12">{volume}%</span>
              </div>
            </div>

            {/* Lyrics Display */}
            <LyricsDisplay 
              videoId={currentTrack.info.identifier}
              title={currentTrack.info.title} 
              artist={currentTrack.info.author}
              currentTime={currentTime}
              isPlaying={isPlaying}
            />
          </Card>
        )}

        <div ref={playerContainerRef} className="hidden">
          <div id="youtube-player"></div>
        </div>
      </div>

      {/* Mini Player */}
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
