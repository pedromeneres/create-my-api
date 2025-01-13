import { format } from "date-fns";
import { Reservation } from "@/types/reservation";

interface ReservationsTableProps {
  reservations: Reservation[] | undefined;
  isLoading: boolean;
}

export function ReservationsTable({ reservations, isLoading }: ReservationsTableProps) {
  return (
    <div className="h-fit max-h-[400px] w-full bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border-2 p-4 overflow-y-auto">
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
              className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-blue-50 rounded-lg border-2 hover:border-blue-500 transition-all duration-200 hover:shadow-md"
            >
              <div className="space-y-1">
                <div className="font-semibold text-sm text-blue-900">
                  {reservation.car.make} {reservation.car.model}
                </div>
                <div className="text-xs text-gray-600">
                  Purpose: {reservation.purpose || '-'}
                </div>
                <div className="text-xs">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    reservation.status === 'approved' ? 'bg-green-100 text-green-800' :
                    reservation.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                  </span>
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
  );
}