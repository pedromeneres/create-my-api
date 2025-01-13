import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };
    getUserEmail();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header Section */}
        <header className="flex justify-between items-center mb-12 py-4">
          <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            Sign Out
          </Button>
        </header>

        {/* Welcome Section */}
        <div className="bg-card rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Welcome{userEmail ? `, ${userEmail}` : ''}! 👋
          </h2>
          <p className="text-muted-foreground">
            This is your personal dashboard. You're successfully logged in and can start using the application.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-3">Getting Started</h3>
            <p className="text-muted-foreground">
              Explore the features and functionalities available to you. Need help? Check out our documentation.
            </p>
          </div>
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button className="w-full" variant="secondary">
                View Profile
              </Button>
              <Button className="w-full" variant="secondary">
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;