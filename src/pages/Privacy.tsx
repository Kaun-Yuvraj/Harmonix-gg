import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Privacy <span className="text-gradient">Policy</span>
            </h1>
            <p className="text-muted-foreground">Last updated: January 2025</p>
          </div>

          <Card className="bg-card border-border p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-primary mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground mb-4">
                Harmonix collects minimal information necessary to provide our music bot services:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Discord User ID and Server ID for service functionality</li>
                <li>Music playback preferences and queue history</li>
                <li>Command usage statistics for service improvement</li>
                <li>Custom playlist data you create</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We use collected information to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide and maintain music playback services</li>
                <li>Improve bot features and user experience</li>
                <li>Respond to support requests</li>
                <li>Prevent abuse and ensure service security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-4">3. Data Storage and Security</h2>
              <p className="text-muted-foreground">
                Your data is stored securely on encrypted servers. We implement industry-standard security measures to protect your information from unauthorized access, alteration, or disclosure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-4">4. Third-Party Services</h2>
              <p className="text-muted-foreground mb-4">
                Harmonix integrates with third-party services:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Spotify API for music streaming</li>
                <li>YouTube API for video content</li>
                <li>Lavalink for audio processing</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                These services have their own privacy policies which govern the use of your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-4">5. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your data only as long as necessary to provide our services. You can request data deletion at any time by contacting our support team.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Request data correction or deletion</li>
                <li>Opt-out of data collection</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-4">7. Contact Us</h2>
              <p className="text-muted-foreground">
                For privacy concerns or data requests, please contact us through our Discord support server or email at privacy@harmonix.bot
              </p>
            </section>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
