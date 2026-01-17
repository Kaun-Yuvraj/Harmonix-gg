import { Button } from "@/components/ui/button";
import { Music, Sparkles } from "lucide-react";

const CallToAction = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Powered by Lavalink
          </div>

          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            Ready to Transform Your
            <br />
            <span className="text-gradient glow-text">Discord Server?</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of servers enjoying premium music quality. Add Harmonix to your Discord server today and experience the difference.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button variant="hero" size="lg" className="text-lg" asChild>
              <a href="https://discord.com/api/oauth2/authorize?client_id=1356181162099347517&permissions=36768832&scope=bot%20applications.commands" target="_blank" rel="noopener noreferrer">
                <Music className="w-5 h-5" />
                Add to Discord Now
              </a>
            </Button>
            <Button variant="outline" size="lg" className="text-lg" asChild>
              <a href="https://discord.gg/29ZBy6hAxF" target="_blank" rel="noopener noreferrer">
                Join Support Server
              </a>
            </Button>
          </div>

          <div className="pt-8 text-sm text-muted-foreground">
            No credit card required • Free forever • Upgrade anytime
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
