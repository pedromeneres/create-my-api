import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, Settings, User, Bell } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };
    getUserEmail();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message
      });
    } else {
      navigate("/login");
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">{getGreeting()}</h1>
            <p className="text-muted-foreground mt-1">
              {userEmail ? `Welcome back, ${userEmail}` : 'Welcome back!'}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="shrink-0">
            Sign Out
          </Button>
        </header>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <User className="h-8 w-8 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Profile</h3>
              <p className="text-sm text-muted-foreground">View and edit your profile settings</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <CalendarDays className="h-8 w-8 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Calendar</h3>
              <p className="text-sm text-muted-foreground">Check your upcoming events</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Bell className="h-8 w-8 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Notifications</h3>
              <p className="text-sm text-muted-foreground">View your latest notifications</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Settings className="h-8 w-8 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Settings</h3>
              <p className="text-sm text-muted-foreground">Manage your preferences</p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Section */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Here's what's been happening in your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground text-center py-8">
                No recent activity to show
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;