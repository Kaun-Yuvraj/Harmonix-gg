import { Button } from "@/components/ui/button";
import { Music, Play, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBg} 
          alt="Hero Background" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Premium Music Experience
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Elevate Your Discord
            <br />
            <span className="text-gradient glow-text">Music Experience</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Stream high-quality music from Spotify, YouTube, and more with advanced filters, 24/7 playback, and intuitive controls.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button variant="hero" size="lg" className="text-lg" asChild>
              <a href="https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=36768832&scope=bot%20applications.commands" target="_blank" rel="noopener noreferrer">
                <Play className="w-5 h-5" />
                Add to Discord
              </a>
            </Button>
            <Button variant="outline" size="lg" className="text-lg" asChild>
              <a href="#features">
                <Music className="w-5 h-5" />
                Explore Features
              </a>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-gradient">24/7</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-gradient">HD</div>
              <div className="text-sm text-muted-foreground">Audio Quality</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-gradient">10+</div>
              <div className="text-sm text-muted-foreground">Platforms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-primary rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
