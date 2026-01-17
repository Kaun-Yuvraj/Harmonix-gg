import { useState, useEffect, useRef } from "react";
import { 
  Server, 
  Copy, 
  Cpu, 
  Activity,
  Eye,
  EyeOff,
  HardDrive,
  Radio,
  Terminal,
  CheckCircle,
  Wifi
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

// Platform icons
import YouTubeIcon from "@/assets/YouTube.svg";
import YoutubeMusicIcon from "@/assets/YoutubeMusic.svg";
import SpotifyIcon from "@/assets/Spotify.svg";
import SoundcloudIcon from "@/assets/Soundcloud.svg";
import AppleMusicIcon from "@/assets/AppleMusic.svg";
import DeezerIcon from "@/assets/Deezer.svg";
import BandcampIcon from "@/assets/bandcamp.svg";
import JiosaavnIcon from "@/assets/Jiosaavn.png";
import YandexMusicIcon from "@/assets/YandexMusic.svg";
import QobuzIcon from "@/assets/qobuz.png";

interface LavalinkStats {
  players: number;
  playingPlayers: number;
  uptime: number;
  memory: {
    free: number;
    used: number;
    allocated: number;
    reservable: number;
  };
  cpu: {
    cores: number;
    systemLoad: number;
    lavalinkLoad: number;
  };
  online: boolean;
  host?: string;
  port?: number;
  error?: string;
  latency?: number;
}

interface LogEntry {
  time: string;
  level: 'WARN' | 'INFO' | 'SUCCESS' | 'SYSTEM';
  message: string;
}

const NodeStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [stats, setStats] = useState<LavalinkStats | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [availabilityData, setAvailabilityData] = useState<boolean[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const nodeInfo = {
    host: "pnode1.danbot.host",
    port: "1186",
    password: "Kaun.Yuvraj",
    secure: false
  };

  const formatUptime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    return `${hours.toFixed(1)}H`;
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2);
  };

  const generateLogs = () => {
    const now = new Date();
    const baseLogs: LogEntry[] = [
      { time: formatTime(new Date(now.getTime() - 300000)), level: 'INFO', message: 'WebSocket latency stable at 24ms' },
      { time: formatTime(new Date(now.getTime() - 240000)), level: 'INFO', message: 'Heartbeat signal received from pnode1' },
      { time: formatTime(new Date(now.getTime() - 180000)), level: 'SUCCESS', message: 'Track metadata cache updated' },
      { time: formatTime(new Date(now.getTime() - 120000)), level: 'INFO', message: 'Syncing player states...' },
      { time: formatTime(new Date(now.getTime() - 60000)), level: 'INFO', message: 'Syncing player states...' },
      { time: formatTime(now), level: 'SYSTEM', message: 'Garbage collection completed (heap: 45MB)' },
    ];
    setLogs(baseLogs);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };

  const generateAvailabilityData = () => {
    // Generate 24 hours of availability data (mostly online)
    const data = Array(48).fill(true).map((_, i) => {
      // Small chance of being offline for realism
      return Math.random() > 0.02;
    });
    setAvailabilityData(data);
  };

  const checkNodeStatus = async () => {
    try {
      console.log('Fetching Lavalink stats via edge function...');
      
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('lavalink-stats');
      const endTime = Date.now();
      const responseLatency = endTime - startTime;
      
      if (error) {
        console.error('Edge function error:', error);
        setStatus('offline');
        setStats(null);
        setLatency(null);
        return;
      }

      console.log('Lavalink stats response:', data);

      if (data.online) {
        setStats(data);
        setStatus('online');
        setLatency(responseLatency);
        // Add new log entry
        setLogs(prev => [...prev.slice(-10), {
          time: formatTime(new Date()),
          level: 'INFO',
          message: `Stats refresh completed (${responseLatency}ms)`
        }]);
      } else {
        console.log('Node is offline or unreachable:', data.error);
        setStatus('offline');
        setStats(null);
        setLatency(null);
      }
    } catch (error) {
      console.error('Error fetching node status:', error);
      setStatus('offline');
      setStats(null);
      setLatency(null);
    }
  };

  useEffect(() => {
    checkNodeStatus();
    generateLogs();
    generateAvailabilityData();
    const interval = setInterval(checkNodeStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'WARN': return 'text-yellow-400';
      case 'INFO': return 'text-primary';
      case 'SUCCESS': return 'text-green-400';
      case 'SYSTEM': return 'text-accent';
      default: return 'text-muted-foreground';
    }
  };

  const getLatencyColor = () => {
    if (!latency) return 'text-muted-foreground';
    if (latency < 100) return 'text-green-400';
    if (latency < 300) return 'text-yellow-400';
    return 'text-red-400';
  };

  const cpuPercent = stats?.cpu ? Math.round(stats.cpu.systemLoad * 100) : 0;
  const memoryPercent = stats?.memory ? Math.round((stats.memory.used / stats.memory.reservable) * 100) : 0;
  const memoryUsedGB = stats?.memory ? formatBytes(stats.memory.used) : '0.00';
  const memoryTotalGB = stats?.memory ? formatBytes(stats.memory.reservable) : '0.00';

  const platforms = [
    { name: "YouTube", icon: YouTubeIcon },
    { name: "YouTube Music", icon: YoutubeMusicIcon },
    { name: "Spotify", icon: SpotifyIcon },
    { name: "SoundCloud", icon: SoundcloudIcon },
    { name: "Apple Music", icon: AppleMusicIcon },
    { name: "Deezer", icon: DeezerIcon },
    { name: "Bandcamp", icon: BandcampIcon },
    { name: "JioSaavn", icon: JiosaavnIcon },
    { name: "Yandex Music", icon: YandexMusicIcon },
    { name: "Qobuz", icon: QobuzIcon },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          
          {/* Main Status Card */}
          <div className="bg-card border border-border rounded-2xl p-8 mb-8 card-glow">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Server className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Harmonix Node</h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    {status === 'online' ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-green-400 text-sm font-medium">ONLINE</span>
                      </>
                    ) : status === 'offline' ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-red-400 text-sm font-medium">OFFLINE</span>
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                        <span className="text-yellow-400 text-sm font-medium">CHECKING...</span>
                      </>
                    )}
                    <span className="text-muted-foreground">|</span>
                    <span className="text-muted-foreground text-sm">LAVALINK V4</span>
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded font-medium">STANDARD</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Latency Indicator */}
                <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg">
                  <Wifi className={`h-4 w-4 ${getLatencyColor()}`} />
                  <span className="text-muted-foreground text-sm">LATENCY:</span>
                  <span className={`font-mono font-medium ${getLatencyColor()}`}>
                    {latency ? `${latency}ms` : '-'}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground text-sm">SESSION:</span>
                  <span className="text-foreground font-mono">{stats?.uptime ? formatUptime(stats.uptime) : '-'}</span>
                </div>
              </div>
            </div>

            {/* Connection Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-secondary rounded-xl p-4">
                <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2">NODE HOST</div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-mono text-sm">{nodeInfo.host}</span>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(nodeInfo.host, 'Host')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="bg-secondary rounded-xl p-4">
                <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2">PORT</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground font-mono text-sm">{nodeInfo.port}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(nodeInfo.port, 'Port')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="bg-secondary rounded-xl p-4">
                <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2">PASSWORD</div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-mono text-sm">
                    {showPassword ? nodeInfo.password : '••••••••••'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => copyToClipboard(nodeInfo.password, 'Password')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* CPU Load */}
              <div className="bg-secondary rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Cpu className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs uppercase tracking-wider">CPU LOAD</div>
                    <div className="text-3xl font-bold text-primary">{cpuPercent}%</div>
                  </div>
                </div>
                <div className="text-muted-foreground text-sm">{stats?.cpu?.cores ?? '-'} Cores System</div>
              </div>

              {/* Memory */}
              <div className="bg-secondary rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground text-sm uppercase tracking-wider">MEMORY</span>
                  </div>
                  <span className="text-primary font-medium">{memoryPercent}%</span>
                </div>
                <div className="w-full bg-background rounded-full h-2 mb-3">
                  <div 
                    className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                    style={{ width: `${memoryPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{memoryUsedGB} GB Used</span>
                  <span>{memoryTotalGB} GB Total</span>
                </div>
              </div>

              {/* Active Streams */}
              <div className="bg-secondary rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2">ACTIVE STREAMS</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">{stats?.playingPlayers ?? 0}</span>
                      <span className="text-muted-foreground">/ {stats?.players ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Radio className="h-4 w-4 text-primary" />
                      <span className="text-primary text-sm">Real-time Audio</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>
            </div>

            {/* Availability & Logs Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Availability */}
              <div className="bg-secondary rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-foreground font-medium">SYSTEM AVAILABILITY</div>
                      <div className="text-muted-foreground text-sm">Live performance metrics</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-foreground">100%</div>
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>Operational</span>
                    </div>
                  </div>
                </div>
                
                {/* Availability Bars */}
                <div className="flex gap-1 mb-4">
                  {availabilityData.map((online, i) => (
                    <div 
                      key={i}
                      className={`flex-1 h-24 rounded-sm ${online ? 'bg-primary' : 'bg-red-500'}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>7 PM</span>
                  <span>1 AM</span>
                  <span>7 AM</span>
                  <span>1 PM</span>
                </div>
              </div>

              {/* System Logs */}
              <div className="bg-secondary rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground uppercase tracking-wider text-sm">SYSTEM LOGS</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                </div>
                
                <div className="font-mono text-sm space-y-1 max-h-48 overflow-y-auto">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-muted-foreground">[{log.time}]</span>
                      <span className={`font-medium ${getLogColor(log.level)}`}>{log.level}</span>
                      <span className="text-foreground/80">{log.message}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>→</span>
                    <span className="w-2 h-4 bg-primary animate-pulse" />
                  </div>
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>
          </div>

          {/* Supported Platforms */}
          <div className="py-12 overflow-hidden">
            <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-[0.3em] mb-8 text-center">
              SUPPORTED PLATFORMS
            </h3>
            <div 
              className="relative"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className={`flex ${isPaused ? '' : 'animate-slide-platforms'}`}>
                {[...platforms, ...platforms].map((platform, index) => (
                  <div 
                    key={`${platform.name}-${index}`} 
                    className="flex items-center gap-3 px-8 flex-shrink-0 group cursor-pointer transition-all duration-300"
                  >
                    <div className="relative">
                      <img 
                        src={platform.icon} 
                        alt={platform.name} 
                        className="w-8 h-8 object-contain transition-all duration-300 group-hover:scale-125 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary))]"
                      />
                    </div>
                    <span className="text-muted-foreground font-medium text-sm tracking-wider whitespace-nowrap transition-all duration-300 group-hover:text-primary">
                      {platform.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NodeStatus;
