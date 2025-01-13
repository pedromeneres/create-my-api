export interface TimelineReservation {
  id: string;
  start_time: string;
  end_time: string;
  car: {
    make: string;
    model: string;
  };
  user_id: string;
  user_email?: string;
  status: string;
  canCancel?: boolean;
}

export interface TransformedTimelineData {
  x: number;
  y: number;
  height: number;
  label: string;
  id: string;
  startTime: string;
  endTime: string;
  color: string;
  xOffset: number;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  plate_number: string;
}

export interface Reservation {
  id: string;
  car_id: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: string;
  car: Car;
}