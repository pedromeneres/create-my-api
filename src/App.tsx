import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Index from "./pages/Index";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    // Check current session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          if (mounted) {
            setIsAuthenticated(false);
            toast({
              variant: "destructive",
              title: "Authentication Error",
              description: "Please sign in again",
            });
            // Clear session and cache
            queryClient.clear();
            await supabase.auth.signOut();
          }
        } else {
          if (mounted) {
            setIsAuthenticated(!!session);
            if (!session) {
              toast({
                variant: "destructive",
                title: "Session Expired",
                description: "Please sign in again",
              });
              // Clear session and cache
              queryClient.clear();
              await supabase.auth.signOut();
            }
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
        if (mounted) {
          setIsAuthenticated(false);
          queryClient.clear();
          await supabase.auth.signOut();
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, !!session);
      
      if (mounted) {
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          queryClient.clear();
          toast({
            variant: "default",
            title: "Signed Out",
            description: "You have been signed out successfully",
          });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setIsAuthenticated(true);
          if (event === 'SIGNED_IN') {
            toast({
              variant: "default",
              title: "Welcome Back",
              description: "You have been signed in successfully",
            });
          }
        } else if (event === 'USER_UPDATED') {
          // Refresh the session when user is updated
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          if (error || !currentSession) {
            setIsAuthenticated(false);
            queryClient.clear();
            await supabase.auth.signOut();
          } else {
            setIsAuthenticated(true);
          }
        }
        
        setIsLoading(false);
      }
    });

    // Initial session check
    checkSession();

    // Cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]); // Added toast to dependencies

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;