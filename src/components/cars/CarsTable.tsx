import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Car } from "@/types/reservation";

interface CarsTableProps {
  cars: Car[] | undefined;
  isLoading: boolean;
  onReserve: (carId: string) => void;
}

export function CarsTable({ cars, isLoading, onReserve }: CarsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Make</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={2} className="text-center">Loading cars...</TableCell>
          </TableRow>
        ) : cars?.length === 0 ? (
          <TableRow>
            <TableCell colSpan={2} className="text-center">No cars available</TableCell>
          </TableRow>
        ) : (
          cars?.map((car) => (
            <TableRow key={car.id}>
              <TableCell>{car.make}</TableCell>
              <TableCell>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onReserve(car.id)}
                >
                  Reserve
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}