import { format } from "date-fns";
import { Reservation } from "@/types/reservation";

interface ReservationsTableProps {
  reservations: Reservation[] | undefined;
  isLoading: boolean;
}

export function ReservationsTable({ reservations, isLoading }: ReservationsTableProps) {
  return (
    <div className="h-fit max-h-[400px] w-full bg-background rounded-lg shadow-sm border p-4 overflow-y-auto">
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-4">Loading reservations...</div>
        ) : reservations?.length === 0 ? (
          <div className="text-center text-muted-foreground py-4 text-sm">
            No reservations found
          </div>
        ) : (
          reservations?.map((reservation) => (
            <div 
              key={reservation.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border"
            >
              <div className="space-y-0.5">
                <div className="font-medium text-sm">
                  {reservation.car.make} {reservation.car.model}
                </div>
                <div className="text-xs text-muted-foreground">
                  Purpose: {reservation.purpose || '-'}
                </div>
                <div className="text-xs">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    reservation.status === 'approved' ? 'bg-green-100 text-green-800' :
                    reservation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    reservation.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                  </span>
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
          ))
        )}
      </div>
    </div>
  );
}