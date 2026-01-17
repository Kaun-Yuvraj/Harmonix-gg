import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

const Developer = () => {
  const skills = [
    { icon: "fab fa-react", name: "React" },
    { icon: "fab fa-node", name: "Node.js" },
    { icon: "fas fa-code", name: "Discord.js" },
    { icon: "fas fa-server", name: "Lavalink" },
    { icon: "fas fa-database", name: "MongoDB" },
    { icon: "fas fa-paint-brush", name: "Tailwind CSS" },
  ];

  const achievements = [
    "Designed Harmonix bot architecture",
    "Integrated Spotify, Apple Music and 5 other Audio Sources",
    "Built advanced music filters & controls",
    "Optimized audio performance & 24/7 uptime",
  ];

  return (
    <section id="developer" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Meet the <span className="text-gradient">Developer</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            The passionate creator behind Harmonix
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary-glow/10 border-primary/20">
            {/* Badge */}
            <div className="absolute top-0 right-0 bg-primary text-white px-6 py-2 rounded-bl-2xl font-bold text-sm">
              DEVELOPER
            </div>

            <div className="p-8">
              {/* Profile Section */}
              <div className="text-center mb-8">
                <div className="mb-6">
                  <img
                    src="https://avatars.githubusercontent.com/u/159287148?s=400&u=911ee2c405ce88a93e63610c314cc0bf75e5fbb2&v=4"
                    alt="Yuvraj Jaiswal"
                    className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-primary shadow-lg"
                  />
                </div>
                <h3 className="text-3xl font-bold mb-2">Yuvraj Jaiswal</h3>
                <p className="text-muted-foreground text-lg mb-1">
                  AKA: ! BaBa TiLLu
                </p>
                <p className="text-primary font-semibold">Full Stack Developer</p>
              </div>

              {/* Achievements */}
              <div className="mb-8">
                <ul className="space-y-3">
                  {achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <i className="fas fa-check text-primary mt-1"></i>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Skills */}
              <div className="mb-8">
                <div className="flex flex-wrap justify-center gap-3">
                  {skills.map((skill, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 bg-card rounded-full border border-border hover:border-primary transition-colors"
                    >
                      <i className={`${skill.icon} mr-2`}></i>
                      {skill.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* GitHub Link */}
              <div className="text-center">
                <Button variant="hero" size="lg" asChild>
                  <a
                    href="https://github.com/Sagexdd"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-5 w-5" />
                    Visit GitHub
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Developer;
