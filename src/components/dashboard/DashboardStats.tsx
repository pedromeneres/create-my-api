import { Car, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Car as CarType, Reservation } from "@/types/reservation";

interface DashboardStatsProps {
  cars: CarType[] | undefined;
  reservations: Reservation[] | undefined;
  userEmail: string | null;
}

export function DashboardStats({ cars, reservations }: DashboardStatsProps) {
  return (
    <div className="flex w-full gap-4">
      <Card className="flex-1">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Car className="h-8 w-8 text-primary shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-medium">Available Cars</p>
              <h3 className="text-xl sm:text-2xl font-bold">{cars?.length || 0}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <CalendarDays className="h-8 w-8 text-primary shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-medium">Active Reservations</p>
              <h3 className="text-xl sm:text-2xl font-bold">
                {reservations?.filter(r => r.status === 'pending' || r.status === 'approved').length || 0}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}