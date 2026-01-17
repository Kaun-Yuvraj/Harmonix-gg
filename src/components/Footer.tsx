import { Link } from "react-router-dom";
import { Music, Github, MessageCircle, Twitter, Heart } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background relative pt-24 pb-12 overflow-hidden border-t border-white/5">
      {/* Massive Watermark */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 select-none pointer-events-none">
        <h1 className="text-[15vw] font-bold text-white/[0.02] leading-none tracking-tighter">
          HARMONIX
        </h1>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-12 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="relative group">
                 <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                 <img src={logo} alt="Harmonix" className="h-12 w-12 relative z-10" />
              </div>
              <span className="text-2xl font-bold text-gradient">Harmonix</span>
            </div>
            <p className="text-muted-foreground max-w-md leading-relaxed">
              The ultimate high-fidelity music experience for Discord. 
              Elevate your server with premium audio, advanced filters, and 24/7 uptime.
            </p>
            <div className="flex gap-4">
              {[
                { icon: MessageCircle, href: "https://discord.gg/29ZBy6hAxF" },
                { icon: Github, href: "https://github.com/Saggexdd" },
                { icon: Twitter, href: "#" }
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300 hover:-translate-y-1"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold text-white mb-6">Product</h4>
              <ul className="space-y-4">
                {['Features', 'Commands', 'Pricing', 'Changelog'].map((item) => (
                  <li key={item}>
                    <a href={`/#${item.toLowerCase()}`} className="text-muted-foreground hover:text-primary transition-colors flex items-center group">
                      <span className="w-0 group-hover:w-2 h-px bg-primary mr-0 group-hover:mr-2 transition-all duration-300"></span>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Resources</h4>
              <ul className="space-y-4">
                {['Documentation', 'API Reference', 'Community', 'Support'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center group">
                       <span className="w-0 group-hover:w-2 h-px bg-primary mr-0 group-hover:mr-2 transition-all duration-300"></span>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Legal</h4>
              <ul className="space-y-4">
                {[
                  { name: 'Privacy Policy', path: '/privacy' },
                  { name: 'Terms of Service', path: '/terms' },
                  { name: 'Node Status', path: '/node' }
                ].map((item) => (
                  <li key={item.name}>
                    <Link to={item.path} className="text-muted-foreground hover:text-primary transition-colors flex items-center group">
                       <span className="w-0 group-hover:w-2 h-px bg-primary mr-0 group-hover:mr-2 transition-all duration-300"></span>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} Harmonix. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" />
            <span>by Yuvraj</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
