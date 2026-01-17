import { useState, useRef } from "react";
import { Github, Code2, Database, Server, Cpu } from "lucide-react";

const Developer = () => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const max = 10;
    
    const rotateX = ((y - centerY) / centerY) * -max;
    const rotateY = ((x - centerX) / centerX) * max;

    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <section className="py-24 bg-card/20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Meet the <span className="text-gradient">Developer</span>
          </h2>
          <p className="text-muted-foreground">The mind behind Harmonix</p>
        </div>

        <div className="flex justify-center perspective-1000">
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
              transition: "transform 0.1s ease-out",
            }}
            className="relative w-full max-w-md bg-gradient-to-br from-card to-background border border-primary/20 rounded-2xl p-8 shadow-2xl group preserve-3d"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

            <div className="flex flex-col items-center text-center transform translate-z-10">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-primary to-accent">
                  <img
                    src="https://github.com/Saggexdd.png"
                    alt="Developer"
                    className="w-full h-full rounded-full object-cover border-4 border-background"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-background p-2 rounded-full border border-border shadow-lg">
                  <Code2 className="w-5 h-5 text-primary" />
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-2">Yuvraj (Sage)</h3>
              <p className="text-primary font-medium mb-4">Full Stack Developer</p>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Passionate about building immersive web experiences and discord bots. 
                Focused on performance, UI/UX, and scalability.
              </p>

              {/* Added Tech Stack Section */}
              <div className="flex justify-center gap-4 mb-8">
                <div className="p-2 bg-secondary/50 rounded-lg" title="React">
                   <Cpu className="w-5 h-5 text-blue-400" />
                </div>
                <div className="p-2 bg-secondary/50 rounded-lg" title="Node.js">
                   <Server className="w-5 h-5 text-green-500" />
                </div>
                <div className="p-2 bg-secondary/50 rounded-lg" title="Database">
                   <Database className="w-5 h-5 text-yellow-400" />
                </div>
              </div>

              <div className="flex gap-4">
                <a
                  href="https://github.com/Saggexdd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-secondary hover:bg-primary/20 hover:text-primary transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Github className="w-5 h-5" />
                  <span>GitHub Profile</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Developer;
