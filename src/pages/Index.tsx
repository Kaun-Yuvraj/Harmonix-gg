import { useEffect } from "react";
import { useLocation } from "react-router-dom";
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
  const { hash } = useLocation();

  useEffect(() => {
    // If there is NO hash (like #features), scroll to top
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [hash]);

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
