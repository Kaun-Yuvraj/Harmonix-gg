import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import MusicPlayer from "@/components/MusicPlayer";
import Commands from "@/components/Commands";
import Pricing from "@/components/Pricing";
import Developer from "@/components/Developer";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <Features />
      <MusicPlayer />
      <Commands />
      <Pricing />
      <Developer />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Index;
