import { Car, CalendarDays, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Car as CarType, Reservation } from "@/types/reservation";

interface DashboardStatsProps {
  cars: CarType[] | undefined;
  reservations: Reservation[] | undefined;
  userEmail: string | null;
}

export function DashboardStats({ cars, reservations, userEmail }: DashboardStatsProps) {
  return (
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
  );
}