import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { TimelineReservation } from "@/types/reservation";

export function ReservationsTimeline() {
  const { data: reservations, isLoading } = useQuery({
    queryKey: ["all-reservations"],
    queryFn: async () => {
      const { data: reservationsData, error } = await supabase
        .from("reservations")
        .select(`
          id,
          start_time,
          end_time,
          user_id,
          car:cars (
            make,
            model
          )
        `)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      
      const emailMap = new Map();
      if (user?.email) {
        emailMap.set(user.id, user.email);
      }

      return reservationsData.map((reservation: any) => ({
        ...reservation,
        car: reservation.car,
        user_email: emailMap.get(reservation.user_id) || 'Other User',
      }));
    },
  });

  if (isLoading) {
    return <div>Loading timeline...</div>;
  }

  return (
    <div className="h-fit max-h-[400px] w-full bg-background rounded-lg shadow-sm border p-4 overflow-y-auto">
      <div className="space-y-2">
        {reservations?.map((reservation: TimelineReservation) => (
          <div 
            key={reservation.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg border"
          >
            <div className="space-y-0.5">
              <div className="font-medium text-sm">
                {reservation.car.make} {reservation.car.model}
              </div>
              <div className="text-xs text-muted-foreground">
                Reserved by: {reservation.user_email}
              </div>
            </div>
            <div className="text-xs text-right">
              <div>{format(new Date(reservation.start_time), "EEE, MMM d")}</div>
              <div className="text-muted-foreground">
                {format(new Date(reservation.start_time), "HH:mm")} - 
                {format(new Date(reservation.end_time), "HH:mm")}
              </div>
            </div>
          </div>
        ))}
        {reservations?.length === 0 && (
          <div className="text-center text-muted-foreground py-4 text-sm">
            No reservations found
          </div>
        )}
      </div>
    </div>
  );
}