import { format, addDays, startOfDay, addHours } from "date-fns";
import { TimelineReservation, TransformedTimelineData } from "@/types/reservation";

const colors = [
  "#9b87f5",
  "#7E69AB",
  "#6E59A5",
  "#8B5CF6",
  "#D946EF",
  "#F97316",
  "#0EA5E9",
  "#1EAEDB",
];

export const getTimelineDays = () => {
  const today = startOfDay(new Date());
  return Array.from({ length: 3 }, (_, i) => addDays(today, i));
};

export const getTimelineHours = () => {
  return Array.from({ length: 13 }, (_, i) => ({
    hour: i + 9,
    label: format(addHours(startOfDay(new Date()), i + 9), 'HH:mm'),
  }));
};

export const transformTimelineData = (reservations: TimelineReservation[]): TransformedTimelineData[] => {
  const carColorMap = new Map();
  
  reservations.forEach((reservation) => {
    const carId = `${reservation.car.make}-${reservation.car.model}`;
    if (!carColorMap.has(carId)) {
      carColorMap.set(carId, colors[carColorMap.size % colors.length]);
    }
  });

  return reservations.flatMap((reservation) => {
    const startDate = new Date(reservation.start_time);
    const endDate = new Date(reservation.end_time);
    
    const startHour = startDate.getHours() + (startDate.getMinutes() / 60);
    const endHour = endDate.getHours() + (endDate.getMinutes() / 60);
    
    const carId = `${reservation.car.make}-${reservation.car.model}`;
    
    const dayReservations = reservations.filter(r => 
      format(new Date(r.start_time), 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')
    );
    
    const sortedDayReservations = dayReservations.sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    
    const positionIndex = sortedDayReservations.findIndex(r => r.id === reservation.id);
    const offset = positionIndex * 50;
    
    return {
      x: startDate.getTime(),
      y: startHour,
      height: endHour - startHour,
      label: `${reservation.user_email}\n${reservation.car.make} ${reservation.car.model}`,
      id: reservation.id,
      startTime: format(startDate, 'HH:mm'),
      endTime: format(endDate, 'HH:mm'),
      color: carColorMap.get(carId),
      xOffset: offset,
    };
  });
};