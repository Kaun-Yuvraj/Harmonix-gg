import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Terms of <span className="text-gradient">Service</span>
            </h1>
            <p className="text-muted-foreground">Last updated: January 2025</p>
          </div>

          <Card className="bg-card border-border p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-primary mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By adding Harmonix to your Discord server or using any of its features, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-4">2. Service Description</h2>
              <p className="text-muted-foreground">
                Harmonix is a Discord music bot that provides audio streaming services from various platforms including Spotify, YouTube, and others. We strive to maintain high-quality service but do not guarantee uninterrupted availability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-4">3. User Responsibilities</h2>
              <p className="text-muted-foreground mb-4">You agree to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Use the bot in compliance with Discord's Terms of Service</li>
                <li>Not attempt to abuse, exploit, or overload the bot</li>
                <li>Respect copyright laws when streaming content</li>
                <li>Not use the bot for illegal activities</li>
                <li>Not share your premium account credentials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-4">4. Premium Services</h2>
              <p className="text-muted-foreground mb-4">
                Premium subscriptions provide enhanced features. Payment terms:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Subscriptions are billed monthly</li>
                <li>You can cancel anytime with no penalty</li>
                <li>Refunds are provided on a case-by-case basis</li>
                <li>Premium features are subject to change</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-4">5. Content and Copyright</h2>
              <p className="text-muted-foreground">
                Harmonix acts as an intermediary to stream content from third-party platforms. Users are responsible for ensuring they have the right to access and stream content. We comply with DMCA and respond to valid takedown requests.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-4">6. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                Harmonix is provided "as is" without warranties. We are not liable for any damages arising from service use, including but not limited to service interruptions, data loss, or content availability issues.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-4">7. Service Modifications</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify, suspend, or discontinue any part of the service at any time with or without notice. We may also update these terms periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-4">8. Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend access to our service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-4">9. Contact Information</h2>
              <p className="text-muted-foreground">
                For questions about these Terms, please contact us through our Discord support server or email at support@harmonix.bot
              </p>
            </section>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
