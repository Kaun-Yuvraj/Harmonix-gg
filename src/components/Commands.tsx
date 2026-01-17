import { Card } from "@/components/ui/card";
import { Terminal } from "lucide-react";

const Commands = () => {
  const commandCategories = [
    {
      title: "Music Commands",
      commands: [
        { cmd: "/play [song]", desc: "Play a song or add it to queue" },
        { cmd: "/pause", desc: "Pause the current track" },
        { cmd: "/resume", desc: "Resume playback" },
        { cmd: "/skip", desc: "Skip to next track" },
        { cmd: "/stop", desc: "Stop playback and clear queue" },
        { cmd: "/nowplaying", desc: "Show current track info" },
      ],
    },
    {
      title: "Queue Management",
      commands: [
        { cmd: "/queue", desc: "View the music queue" },
        { cmd: "/shuffle", desc: "Shuffle the queue" },
        { cmd: "/loop", desc: "Toggle loop mode" },
        { cmd: "/remove [position]", desc: "Remove track from queue" },
        { cmd: "/clear", desc: "Clear the entire queue" },
        { cmd: "/autoplay", desc: "Toggle autoplay mode" },
      ],
    },
    {
      title: "Audio Filters",
      commands: [
        { cmd: "/filter bassboost [level]", desc: "Apply bass boost (1-10)" },
        { cmd: "/filter nightcore", desc: "Apply nightcore effect" },
        { cmd: "/filter karaoke", desc: "Remove vocals for karaoke" },
        { cmd: "/filter vocals", desc: "Isolate vocals only" },
        { cmd: "/filter 8d", desc: "8D surround sound effect" },
        { cmd: "/filter clear", desc: "Remove all filters" },
      ],
    },
    {
      title: "Playlists",
      commands: [
        { cmd: "/playlist create [name]", desc: "Create new playlist" },
        { cmd: "/playlist add [name] [song]", desc: "Add song to playlist" },
        { cmd: "/playlist play [name]", desc: "Play a playlist" },
        { cmd: "/playlist remove [name]", desc: "Delete a playlist" },
        { cmd: "/playlist list", desc: "View all your playlists" },
      ],
    },
  ];

  return (
    <section id="commands" className="py-24 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Easy <span className="text-gradient">Commands</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Intuitive slash commands for complete control over your music
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {commandCategories.map((category, index) => (
            <Card
              key={index}
              className="bg-card border-border p-6 hover:border-primary/50 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <Terminal className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold">{category.title}</h3>
              </div>
              <div className="space-y-4">
                {category.commands.map((command, cmdIndex) => (
                  <div
                    key={cmdIndex}
                    className="flex flex-col gap-1 p-3 bg-background/50 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <code className="text-primary font-mono text-sm">{command.cmd}</code>
                    <span className="text-muted-foreground text-sm">{command.desc}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Commands;
