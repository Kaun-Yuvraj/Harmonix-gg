import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Commands", href: "/#commands" },
    { name: "Features", href: "/#features" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Node Status", href: "/node" },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-white/5 py-2 shadow-lg"
          : "bg-transparent py-4 border-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <img 
                src={logo} 
                alt="Harmonix" 
                className="h-10 w-10 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" 
              />
            </div>
            <span className="text-xl font-bold text-gradient group-hover:opacity-80 transition-opacity">
              Harmonix
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                {link.name}
              </Link>
            ))}
            <div className="pl-4 ml-4 border-l border-white/10">
              <Button variant="hero" size="lg" className="shadow-glow" asChild>
                <a
                  href="https://discord.com/api/oauth2/authorize?client_id=1356181162099347517&permissions=36768832&scope=bot%20applications.commands"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Add to Discord
                </a>
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-xl border-b border-border animate-in slide-in-from-top-2">
            <div className="flex flex-col p-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="px-4 py-3 rounded-lg text-foreground/80 hover:text-primary hover:bg-primary/5 transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-2">
                <Button variant="hero" size="lg" className="w-full" asChild>
                  <a
                    href="https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=36768832&scope=bot%20applications.commands"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Add to Discord
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
