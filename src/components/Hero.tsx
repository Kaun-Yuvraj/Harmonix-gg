import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Music, Play, Zap, Star } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const words = ["Music Experience", "Vibe", "Community", "Atmosphere"];

  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % words.length;
      const fullText = words[i];

      setText(isDeleting 
        ? fullText.substring(0, text.length - 1) 
        : fullText.substring(0, text.length + 1)
      );

      setTypingSpeed(isDeleting ? 30 : 150);

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 1500); // Pause at end
      } else if (isDeleting && text === "") {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBg} 
          alt="Hero Background" 
          className="w-full h-full object-cover opacity-20 scale-105 animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-4 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Premium Discord Music Bot
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
            Elevate Your Discord
            <br />
            <span className="text-gradient glow-text min-h-[1.2em] inline-block">
              {text}
              <span className="animate-pulse">|</span>
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Harmonix delivers a premium audio experience with high-fidelity sound, 24/7 uptime, and advanced filters for your server.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button variant="hero" size="lg" className="text-lg h-14 px-8 shadow-glow hover:scale-105 transition-transform" asChild>
              <a href="https://discord.com/api/oauth2/authorize?client_id=1356181162099347517&permissions=36768832&scope=bot%20applications.commands" target="_blank" rel="noopener noreferrer">
                <Play className="w-5 h-5 mr-2 fill-current" />
                Add to Discord
              </a>
            </Button>
            <Button variant="outline" size="lg" className="text-lg h-14 px-8 hover:bg-white/5 backdrop-blur-sm" asChild>
              <a href="#features">
                <Music className="w-5 h-5 mr-2" />
                Explore Features
              </a>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto border-t border-white/5 mt-8">
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-bold text-foreground">99.9%</div>
              <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Uptime</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-bold text-foreground">Hi-Res</div>
              <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Audio</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-bold text-foreground">10+</div>
              <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Sources</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer" onClick={() => window.scrollTo(0, window.innerHeight)}>
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-primary rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
