import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { TimelineReservation } from "@/types/reservation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ReservationsTimeline() {
  const [selectedDay, setSelectedDay] = useState<string>("today");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [session, setSession] = useState(null);
  const [reservationToCancel, setReservationToCancel] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
    });

    // Listen for session changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getDateRange = (day: string) => {
    const today = new Date();
    switch (day) {
      case "tomorrow":
        return {
          start: startOfDay(addDays(today, 1)),
          end: endOfDay(addDays(today, 1))
        };
      case "after-tomorrow":
        return {
          start: startOfDay(addDays(today, 2)),
          end: endOfDay(addDays(today, 2))
        };
      default: // today
        return {
          start: startOfDay(today),
          end: endOfDay(today)
        };
    }
  };

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["all-reservations", selectedDay],
    queryFn: async () => {
      if (!session) {
        throw new Error("No active session");
      }

      const dateRange = getDateRange(selectedDay);
      
      // Get current session user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting user:", userError);
        throw userError;
      }

      if (!user) {
        throw new Error("User not authenticated");
      }

      console.log("Current user ID:", user.id);
      
      const { data: reservationsData, error } = await supabase
        .from("reservations")
        .select(`
          id,
          start_time,
          end_time,
          user_id,
          status,
          car:cars (
            make,
            model
          )
        `)
        .gte('start_time', dateRange.start.toISOString())
        .lte('start_time', dateRange.end.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error("Error fetching reservations:", error);
        throw error;
      }

      console.log("Fetched reservations:", reservationsData);
      
      const transformedReservations = reservationsData.map((reservation: any) => {
        const canCancel = user.id === reservation.user_id && reservation.status !== 'cancelled';
        console.log(`Reservation ${reservation.id} - User ID match: ${user.id === reservation.user_id}, Status: ${reservation.status}, Can Cancel: ${canCancel}`);
        
        return {
          ...reservation,
          car: reservation.car,
          user_email: user.email,
          canCancel,
        };
      });

      console.log("Transformed reservations:", transformedReservations);
      return transformedReservations;
    },
    enabled: !!session,
  });

  const handleCancelReservation = async (reservationId: string) => {
    if (!session) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to cancel reservations.",
      });
      return;
    }

    try {
      console.log("Attempting to cancel reservation:", reservationId);
      
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId);

      if (error) throw error;

      toast({
        title: "Reservation cancelled",
        description: "Your reservation has been successfully cancelled.",
      });

      // Reset the reservationToCancel state
      setReservationToCancel(null);

      // Refresh the reservations data
      queryClient.invalidateQueries({ queryKey: ["all-reservations"] });
    } catch (error) {
      console.error("Cancel reservation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel reservation. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Select
        value={selectedDay}
        onValueChange={(value) => setSelectedDay(value)}
      >
        <SelectTrigger className="w-[180px] border-2 hover:border-blue-500 transition-colors bg-white/95">
          <SelectValue placeholder="Select day" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="tomorrow">Tomorrow</SelectItem>
          <SelectItem value="after-tomorrow">Day After Tomorrow</SelectItem>
        </SelectContent>
      </Select>

      <div className="h-fit max-h-[400px] w-full bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border-2 p-4 overflow-y-auto">
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-4">Loading timeline...</div>
          ) : reservations?.length === 0 ? (
            <div className="text-center text-muted-foreground py-4 text-sm">
              No reservations found for this day
            </div>
          ) : (
            reservations?.map((reservation: TimelineReservation) => (
              <div 
                key={reservation.id}
                className={`flex items-center justify-between p-4 bg-gradient-to-r rounded-lg border-2 hover:border-blue-500 transition-all duration-200 hover:shadow-md ${
                  reservation.status === 'cancelled' 
                    ? 'from-gray-50 to-gray-100 opacity-75' 
                    : 'from-white to-blue-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="font-semibold text-sm text-blue-900">
                    {reservation.car.make} {reservation.car.model}
                  </div>
                  <div className="text-xs text-gray-600">
                    Reserved by: {reservation.user_email}
                  </div>
                  <div className="text-xs">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      reservation.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                      reservation.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-xs text-right">
                    <div className="font-medium text-blue-900">
                      {format(new Date(reservation.start_time), "EEE, MMM d")}
                    </div>
                    <div className="text-gray-600">
                      {format(new Date(reservation.start_time), "HH:mm")} - 
                      {format(new Date(reservation.end_time), "HH:mm")}
                    </div>
                  </div>
                  {reservation.canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 font-semibold"
                      onClick={() => setReservationToCancel(reservation.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AlertDialog open={!!reservationToCancel} onOpenChange={() => setReservationToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this reservation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep reservation</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reservationToCancel && handleCancelReservation(reservationToCancel)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, cancel reservation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}