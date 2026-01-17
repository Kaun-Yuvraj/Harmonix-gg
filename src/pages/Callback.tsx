import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const Callback = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing Spotify authentication...");
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");

        if (error) {
          setStatus("error");
          setMessage(`Authentication failed: ${error}`);
          return;
        }

        if (!code) {
          setStatus("error");
          setMessage("No authorization code received");
          return;
        }

        // Here you would normally send the code to your backend
        // For now, we'll simulate success
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setStatus("success");
        setMessage("Spotify account successfully linked!");
        
        // Redirect after success
        setTimeout(() => {
          navigate("/");
        }, 2000);
        
      } catch (err) {
        setStatus("error");
        setMessage("An unexpected error occurred");
        console.error("Callback error:", err);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 flex items-center justify-center px-4 pt-24">
        <Card className="bg-card border-border p-8 max-w-md w-full text-center space-y-6">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
              <h2 className="text-2xl font-bold">{message}</h2>
              <p className="text-muted-foreground">Please wait while we connect your account...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-16 h-16 text-primary mx-auto" />
              <h2 className="text-2xl font-bold text-gradient">{message}</h2>
              <p className="text-muted-foreground">Redirecting you back...</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-destructive mx-auto" />
              <h2 className="text-2xl font-bold">Authentication Failed</h2>
              <p className="text-muted-foreground">{message}</p>
              <Button variant="hero" className="w-full" onClick={() => navigate("/")}>
                Return Home
              </Button>
            </>
          )}
        </Card>
      </main>
    </div>
  );
};

export default Callback;
