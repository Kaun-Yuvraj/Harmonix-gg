import { Card } from "@/components/ui/card";
import { Music, Zap, Filter, Radio, List, Search, Clock, Headphones } from "lucide-react";

const Features = () => {
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
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Powerful <span className="text-gradient">Features</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need for an exceptional music experience in Discord
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-card border-border p-6 hover:border-primary/50 transition-all duration-300 card-glow group cursor-pointer"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
