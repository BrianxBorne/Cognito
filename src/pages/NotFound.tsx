
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-terminal p-6">
      <div className="text-center max-w-md w-full bg-terminal-muted p-8 rounded-md border border-terminal-border shadow-lg">
        <h1 className="text-4xl font-mono font-bold text-terminal-foreground mb-2">404</h1>
        <div className="text-xl mb-6 text-terminal-foreground/80 font-mono">
          <span>TERMINAL_LOCATION_NOT_FOUND</span>
        </div>
        
        <div className="mb-6 text-terminal-foreground/70 text-left font-mono">
          <p className="mb-2">{">"} ERROR: Directory not found</p>
          <p className="mb-2">{">"} Path: <span className="text-terminal-foreground">{location.pathname}</span></p>
          <p>{">"} <span className="cursor">Awaiting further instructions...</span></p>
        </div>
        
        <Button 
          onClick={() => navigate("/")}
          className="w-full bg-terminal-foreground text-terminal hover:bg-terminal-foreground/80"
        >
          Return to Main Terminal
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
