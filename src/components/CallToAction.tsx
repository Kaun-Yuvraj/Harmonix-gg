import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

const CallToAction = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Visualizer Background Animation */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="flex items-end gap-1 h-64">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-4 bg-primary rounded-t-full animate-pulse"
              style={{
                height: `${Math.random() * 100}%`,
                animationDuration: `${0.5 + Math.random()}s`,
                animationDelay: `${Math.random() * 0.5}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-6">
          Ready to <span className="text-gradient">Vibe?</span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Join thousands of other servers enjoying high-quality music. 
          Start your premium experience today.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            variant="hero" 
            size="lg" 
            className="text-lg h-16 px-10 shadow-glow hover:scale-105 transition-transform" 
            asChild
          >
            <a href="https://discord.com/api/oauth2/authorize?client_id=1356181162099347517&permissions=36768832&scope=bot%20applications.commands" target="_blank" rel="noopener noreferrer">
              <Play className="w-5 h-5 mr-2 fill-current" />
              Add to Discord Now
            </a>
          </Button>
        </div>
        
        <p className="mt-6 text-sm text-muted-foreground">
          No credit card required • Instant setup
        </p>
      </div>
    </section>
  );
};

export default CallToAction;
