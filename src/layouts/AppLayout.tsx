
import { Navigate, Outlet, useLocation } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

const AppLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-terminal p-4">
        <div className="text-terminal-foreground text-xl">
          <span className="cursor">Initializing terminal session...</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="min-h-screen flex w-full bg-terminal">
      <AppSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center p-4 border-b border-terminal-border">
          <SidebarTrigger />
          <div className="ml-4 text-sm text-terminal-foreground/50">
            {/* Terminal header info */}
            <span>cognito@terminal:~$</span>
          </div>
        </div>
        <div className="flex-1 overflow-auto terminal-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
