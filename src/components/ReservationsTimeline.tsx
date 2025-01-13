import { useQuery } from "@tanstack/react-query";
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
import { useState } from "react";

export function ReservationsTimeline() {
  const [selectedDay, setSelectedDay] = useState<string>("today");

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
      const dateRange = getDateRange(selectedDay);
      
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
        .gte('start_time', dateRange.start.toISOString())
        .lte('start_time', dateRange.end.toISOString())
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
                className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-blue-50 rounded-lg border-2 hover:border-blue-500 transition-all duration-200 hover:shadow-md"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-sm text-blue-900">
                    {reservation.car.make} {reservation.car.model}
                  </div>
                  <div className="text-xs text-gray-600">
                    Reserved by: {reservation.user_email}
                  </div>
                </div>
                <div className="text-xs text-right">
                  <div className="font-medium text-blue-900">{format(new Date(reservation.start_time), "EEE, MMM d")}</div>
                  <div className="text-gray-600">
                    {format(new Date(reservation.start_time), "HH:mm")} - 
                    {format(new Date(reservation.end_time), "HH:mm")}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}