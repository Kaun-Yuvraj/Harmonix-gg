import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Free",
      price: "₹0",
      description: "Perfect for small communities starting out.",
      features: [
        "High-quality music playback",
        "Support for YouTube & Spotify",
        "Basic queue management",
        "99.9% Uptime",
        "Standard support",
      ],
      highlight: false,
    },
    {
      name: "Pro",
      price: isAnnual ? "₹249" : "₹299",
      description: "Advanced features for growing servers.",
      features: [
        "Everything in Free",
        "24/7 360kbps Audio Quality",
        "Volume Control & Audio Filters",
        "24/7 24/7 Mode (No disconnects)",
        "Custom Playlists (Unlimited)",
        "Priority Support",
      ],
      highlight: true,
      badge: "MOST POPULAR",
    },
  ];

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Simple, Transparent <span className="text-gradient">Pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your community. No hidden fees.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-muted-foreground'}`}>Monthly</span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-muted-foreground'}`}>
              Yearly <span className="text-primary text-xs bg-primary/10 px-2 py-0.5 rounded-full ml-1">-20%</span>
            </span>
          </div>
        </div>

        {/* Centered Grid for 2 items */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative group rounded-2xl p-8 transition-all duration-500 hover:-translate-y-2 ${
                plan.highlight
                  ? "bg-card/80 border-primary/50 shadow-glow z-10 scale-105"
                  : "bg-card/40 border-border hover:border-primary/30"
              } border backdrop-blur-sm`}
            >
              {plan.highlight && (
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20 blur-xl opacity-50" />
              )}

              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 animate-pulse">
                  <Star className="w-3 h-3 fill-current" />
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <p className="text-muted-foreground mt-4 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <div className={`rounded-full p-1 ${plan.highlight ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-foreground/90">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlight ? "hero" : "outline"}
                className={`w-full ${plan.highlight ? 'shadow-lg hover:shadow-primary/25' : ''}`}
                size="lg"
              >
                Get Started
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
