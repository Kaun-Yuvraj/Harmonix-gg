import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-8 px-4">
        <div className="space-y-4">
          <h1 className="text-8xl md:text-9xl font-bold text-gradient">404</h1>
          <h2 className="text-3xl md:text-4xl font-bold">Page Not Found</h2>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            Oops! The page you're looking for seems to have disappeared into the void.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="hero" size="lg" asChild>
            <a href="/">
              <Home className="w-5 h-5" />
              Back to Home
            </a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="/#features">
              <Search className="w-5 h-5" />
              Explore Features
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
