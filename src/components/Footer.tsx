import { Link } from "react-router-dom";
import { Music, Github, MessageCircle } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card/50 border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img src={logo} alt="Harmonix" className="h-10 w-10" />
              <span className="text-xl font-bold text-gradient">Harmonix</span>
            </div>
            <p className="text-muted-foreground max-w-md">
              Premium music experience for Discord. Stream from multiple platforms with high-quality audio and advanced features.
            </p>
            <div className="flex gap-4 mt-4">
              <a
                href="https://discord.gg/29ZBy6hAxF"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/Saggexdd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/#features" className="text-muted-foreground hover:text-primary transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/#commands" className="text-muted-foreground hover:text-primary transition-colors">
                  Commands
                </a>
              </li>
              <li>
                <a href="/#pricing" className="text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Legal & Status</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/node" className="text-muted-foreground hover:text-primary transition-colors">
                  Node Status
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center text-muted-foreground">
          <p>© {currentYear} Harmonix. All rights reserved. Powered by Lavalink.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
