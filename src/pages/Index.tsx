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
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Family Car Reservation System</h1>
            <p className="text-muted-foreground mt-1">
              {userEmail ? `Welcome, ${userEmail}` : 'Welcome!'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NewReservationDialog 
              isOpen={isReservationDialogOpen}
              onOpenChange={setIsReservationDialogOpen}
              selectedCarId={selectedCarId}
            />
            <Button onClick={handleLogout} variant="outline">
              Sign Out
            </Button>
          </div>
        </header>

        {/* Quick Stats */}
        <DashboardStats 
          cars={cars}
          reservations={reservations}
          userEmail={userEmail}
        />

        {/* Reservations Timeline */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Reservations Timeline</CardTitle>
            <CardDescription>
              Timeline view of all family car reservations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReservationsTimeline />
          </CardContent>
        </Card>

        {/* Available Cars */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Available Cars</CardTitle>
            <CardDescription>List of family cars available for reservation</CardDescription>
          </CardHeader>
          <CardContent>
            <CarsTable 
              cars={cars}
              isLoading={carsLoading}
              onReserve={openReservationDialog}
            />
          </CardContent>
        </Card>

        {/* Recent Reservations */}
        <Card>
          <CardHeader>
            <CardTitle>Your Reservations</CardTitle>
            <CardDescription>Recent and upcoming car reservations</CardDescription>
          </CardHeader>
          <CardContent>
            <ReservationsTable 
              reservations={reservations}
              isLoading={reservationsLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;