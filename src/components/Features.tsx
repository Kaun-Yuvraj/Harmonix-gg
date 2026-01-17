import { useRef, useState } from "react";
import { Music, Zap, Filter, Radio, List, Search, Clock, Headphones } from "lucide-react";

const Features = () => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  const features = [
    {
      icon: Music,
      title: "Multi-Platform Support",
      description: "Stream from Spotify, YouTube, SoundCloud, Apple Music, and 10+ other platforms seamlessly.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Powered by Lavalink for ultra-low latency and crystal-clear audio quality.",
    },
    {
      icon: Filter,
      title: "Advanced Filters",
      description: "Bass boost, nightcore, karaoke, vocal isolation, and more audio effects.",
    },
    {
      icon: Radio,
      title: "24/7 Playback",
      description: "Keep the music going non-stop even when everyone's offline.",
    },
    {
      icon: List,
      title: "Queue Management",
      description: "Intuitive queue system with shuffle, loop, and autoplay features.",
    },
    {
      icon: Search,
      title: "Smart Search",
      description: "Find any song instantly with our intelligent search system.",
    },
    {
      icon: Clock,
      title: "Playlist Support",
      description: "Create and manage custom playlists for every mood and occasion.",
    },
    {
      icon: Headphones,
      title: "High-Fidelity Audio",
      description: "Experience superior sound quality with minimal compression.",
    },
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-background">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-30 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[20%] w-72 h-72 bg-accent/20 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Powerful <span className="text-gradient">Features</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need for an exceptional music experience in Discord
          </p>
        </div>

        {/* Spotlight Grid Container */}
        <div
          ref={divRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative"
        >
          {/* Spotlight Overlay */}
          <div
            className="pointer-events-none absolute -inset-px transition-opacity duration-300 opacity-0 lg:block hidden"
            style={{
              opacity,
              background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,.1), transparent 40%)`,
            }}
          />

          {features.map((feature, index) => (
            <div
              key={index}
              className="relative group rounded-xl border border-white/10 bg-card/30 px-6 py-8 hover:border-white/20 transition-colors duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
              
              <div className="relative z-10">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 text-primary">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
