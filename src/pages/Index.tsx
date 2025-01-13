import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ReservationsTimeline } from "@/components/ReservationsTimeline";
import { NewReservationDialog } from "@/components/NewReservationDialog";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { CarsTable } from "@/components/cars/CarsTable";
import { ReservationsTable } from "@/components/reservations/ReservationsTable";
import { Car, Reservation } from "@/types/reservation";

const Index = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };
    getUserEmail();
  }, []);

  const { data: cars, isLoading: carsLoading } = useQuery({
    queryKey: ["cars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("*");
      
      if (error) throw error;
      return data as Car[];
    },
  });

  const { data: reservations, isLoading: reservationsLoading } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          car:cars(*)
        `)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data as Reservation[];
    },
  });

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

  const openReservationDialog = (carId: string) => {
    setSelectedCarId(carId);
    setIsReservationDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Family Car Reservation</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {userEmail ? `Welcome, ${userEmail}` : 'Welcome!'}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <NewReservationDialog 
              isOpen={isReservationDialogOpen}
              onOpenChange={setIsReservationDialogOpen}
              selectedCarId={selectedCarId}
            />
            <Button onClick={handleLogout} variant="outline" size="sm" className="w-full sm:w-auto">
              Sign Out
            </Button>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <DashboardStats 
            cars={cars}
            reservations={reservations}
            userEmail={userEmail}
          />
        </div>

        {/* Reservations Timeline */}
        <Card className="mb-6">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Reservations Timeline</CardTitle>
            <CardDescription className="text-sm">
              Timeline view of all family car reservations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ReservationsTimeline />
          </CardContent>
        </Card>

        {/* Cars and Recent Reservations Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Available Cars */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Available Cars</CardTitle>
              <CardDescription className="text-sm">List of family cars available for reservation</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 overflow-x-auto">
              <CarsTable 
                cars={cars}
                isLoading={carsLoading}
                onReserve={openReservationDialog}
              />
            </CardContent>
          </Card>

          {/* Recent Reservations */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Your Reservations</CardTitle>
              <CardDescription className="text-sm">Recent and upcoming car reservations</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ReservationsTable 
                reservations={reservations}
                isLoading={reservationsLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;