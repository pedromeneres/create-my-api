import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Reservation } from "@/types/reservation";

interface ReservationsTableProps {
  reservations: Reservation[] | undefined;
  isLoading: boolean;
}

export function ReservationsTable({ reservations, isLoading }: ReservationsTableProps) {
  return (
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
        {isLoading ? (
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
  );
}