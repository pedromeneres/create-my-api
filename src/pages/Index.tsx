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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Car, CalendarDays, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ReservationsTimeline } from "@/components/ReservationsTimeline";
import { NewReservationDialog } from "@/components/NewReservationDialog";

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  plate_number: string;
}

interface Reservation {
  id: string;
  car_id: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: string;
  car: Car;
}

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
            <NewReservationDialog />
            <Button onClick={handleLogout} variant="outline">
              Sign Out
            </Button>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <Car className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">Available Cars</p>
                  <h3 className="text-2xl font-bold">{cars?.length || 0}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <CalendarDays className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">Active Reservations</p>
                  <h3 className="text-2xl font-bold">
                    {reservations?.filter(r => r.status === 'pending' || r.status === 'approved').length || 0}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <User className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">Your Account</p>
                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {userEmail}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Make</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading cars...</TableCell>
                  </TableRow>
                ) : cars?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No cars available</TableCell>
                  </TableRow>
                ) : (
                  cars?.map((car) => (
                    <TableRow key={car.id}>
                      <TableCell>{car.make}</TableCell>
                      <TableCell>{car.model}</TableCell>
                      <TableCell>{car.year}</TableCell>
                      <TableCell>{car.plate_number}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Reserve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Reservations */}
        <Card>
          <CardHeader>
            <CardTitle>Your Reservations</CardTitle>
            <CardDescription>Recent and upcoming car reservations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Car</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservationsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading reservations...</TableCell>
                  </TableRow>
                ) : reservations?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No reservations found</TableCell>
                  </TableRow>
                ) : (
                  reservations?.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell>{`${reservation.car.make} ${reservation.car.model}`}</TableCell>
                      <TableCell>{new Date(reservation.start_time).toLocaleString()}</TableCell>
                      <TableCell>{new Date(reservation.end_time).toLocaleString()}</TableCell>
                      <TableCell>{reservation.purpose || '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          reservation.status === 'approved' ? 'bg-green-100 text-green-800' :
                          reservation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          reservation.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
