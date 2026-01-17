import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Terminal, Search, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const Commands = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const commandCategories = [
    {
      title: "Music Commands",
      commands: [
        { cmd: "+play [song]", desc: "Play a song or add it to queue" },
        { cmd: "+pause", desc: "Pause the current track" },
        { cmd: "+resume", desc: "Resume playback" },
        { cmd: "+skip", desc: "Skip to next track" },
        { cmd: "+stop", desc: "Stop playback and clear queue" },
        { cmd: "+nowplaying", desc: "Show current track info" },
        { cmd: "+lyrics", desc: "Show current track lyrics" },
      ],
    },
    {
      title: "Queue Management",
      commands: [
        { cmd: "+queue", desc: "View the music queue" },
        { cmd: "+shuffle", desc: "Shuffle the queue" },
        { cmd: "+loop", desc: "Toggle loop mode" },
        { cmd: "+remove [position]", desc: "Remove track from queue" },
        { cmd: "+clear", desc: "Clear the entire queue" },
        { cmd: "+autoplay", desc: "Toggle autoplay mode" },
        { cmd: "+search", desc: "Play songs from available sources" },
      ],
    },
    {
      title: "Audio Filters",
      commands: [
        { cmd: "+filter bassboost [level]", desc: "Apply bass boost (1-10)" },
        { cmd: "+filter nightcore", desc: "Apply nightcore effect" },
        { cmd: "+filter karaoke", desc: "Remove vocals for karaoke" },
        { cmd: "+filter vocals", desc: "Isolate vocals only" },
        { cmd: "+filter 8d", desc: "8D surround sound effect" },
        { cmd: "+filter clear", desc: "Remove all filters" },
      ],
    },
  ];

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(cmd);
    toast.success("Command copied to clipboard");
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  // Filter categories based on search
  const filteredCategories = commandCategories.map(category => ({
    ...category,
    commands: category.commands.filter(c => 
      c.cmd.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.desc.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.commands.length > 0);

  return (
    <section id="commands" className="py-24 bg-card/30 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Easy <span className="text-gradient">Commands</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Intuitive slash commands for complete control over your music
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative group">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search commands (e.g., 'bass', 'skip')..." 
                className="pl-10 bg-background/50 border-primary/20 focus:border-primary backdrop-blur-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category, index) => (
              <Card
                key={index}
                className="bg-card/50 backdrop-blur-sm border-border p-6 hover:border-primary/50 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Terminal className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">{category.title}</h3>
                </div>
                <div className="space-y-3">
                  {category.commands.map((command, cmdIndex) => (
                    <div
                      key={cmdIndex}
                      onClick={() => handleCopy(command.cmd)}
                      className="group/cmd flex items-center justify-between p-3 bg-background/40 border border-transparent hover:border-primary/20 rounded-lg hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      <div className="flex flex-col gap-1">
                        <code className="text-primary font-mono text-sm font-bold">{command.cmd}</code>
                        <span className="text-muted-foreground text-xs">{command.desc}</span>
                      </div>
                      <div className="opacity-0 group-hover/cmd:opacity-100 transition-opacity">
                        {copiedCommand === command.cmd ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No commands found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Commands;
