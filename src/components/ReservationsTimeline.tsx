import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ScatterChart,
  Scatter,
  Cell,
  ReferenceLine,
} from "recharts";
import { format, addDays, startOfDay, endOfDay, addHours, startOfWeek } from "date-fns";

interface TimelineReservation {
  id: string;
  start_time: string;
  end_time: string;
  car: {
    make: string;
    model: string;
  };
  user_id: string;
}

const colors = [
  "#9b87f5", // Primary Purple
  "#7E69AB", // Secondary Purple
  "#6E59A5", // Tertiary Purple
  "#8B5CF6", // Vivid Purple
  "#D946EF", // Magenta Pink
  "#F97316", // Bright Orange
  "#0EA5E9", // Ocean Blue
  "#1EAEDB", // Bright Blue
];

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

  // Get the start of the current week
  const weekStart = startOfWeek(new Date());
  
  // Create array of 5 days
  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  
  // Create array of hours from 8 to 22
  const hours = Array.from({ length: 15 }, (_, i) => ({
    hour: i + 8,
    label: format(addHours(startOfDay(new Date()), i + 8), 'HH:mm'),
  }));

  // Create a map of car IDs to colors
  const carColorMap = new Map();
  reservations?.forEach((reservation) => {
    const carId = `${reservation.car.make}-${reservation.car.model}`;
    if (!carColorMap.has(carId)) {
      carColorMap.set(carId, colors[carColorMap.size % colors.length]);
    }
  });

  // Group reservations by day and calculate positions to avoid overlap
  const timelineData = reservations?.flatMap((reservation) => {
    const startDate = new Date(reservation.start_time);
    const endDate = new Date(reservation.end_time);
    const startHour = startDate.getHours() + startDate.getMinutes() / 60;
    const endHour = endDate.getHours() + endDate.getMinutes() / 60;
    const carId = `${reservation.car.make}-${reservation.car.model}`;
    
    // Calculate the day's reservations to handle overlaps
    const dayReservations = reservations.filter(r => 
      format(new Date(r.start_time), 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')
    );
    
    // Find overlapping reservations
    const overlappingReservations = dayReservations.filter(r => {
      const rStart = new Date(r.start_time);
      const rEnd = new Date(r.end_time);
      return (
        r.id !== reservation.id &&
        ((startDate >= rStart && startDate < rEnd) ||
        (endDate > rStart && endDate <= rEnd) ||
        (startDate <= rStart && endDate >= rEnd))
      );
    });

    // Calculate horizontal offset based on number of overlaps
    const offset = overlappingReservations.length > 0 ? 
      (40 * (overlappingReservations.findIndex(r => r.id === reservation.id) + 1)) : 0;
    
    return {
      x: startDate.getTime(),
      y: Math.max(8, Math.min(startHour, 22)),
      height: Math.min(endHour, 22) - Math.max(startHour, 8),
      label: `${reservation.user_email}\n${reservation.car.make} ${reservation.car.model}`,
      id: reservation.id,
      startTime: format(startDate, 'HH:mm'),
      endTime: format(endDate, 'HH:mm'),
      color: carColorMap.get(carId),
      xOffset: offset,
    };
  });

  return (
    <div className="h-[800px] w-full bg-background rounded-lg shadow-sm border">
      <ChartContainer
        className="h-full"
        config={{
          primary: {
            theme: {
              light: "hsl(var(--primary))",
              dark: "hsl(var(--primary))",
            },
          },
        }}
      >
        <ScatterChart
          margin={{
            top: 20,
            right: 30,
            bottom: 20,
            left: 60,
          }}
        >
          <XAxis
            dataKey="x"
            domain={[days[0].getTime(), days[4].getTime()]}
            name="Day"
            tickFormatter={(unixTime) => format(new Date(unixTime), "EEE dd/MM")}
            type="number"
            interval={0}
            ticks={days.map(day => day.getTime())}
          />
          <YAxis
            type="number"
            domain={[8, 22]}
            ticks={hours.map(h => h.hour)}
            tickFormatter={(hour) => format(addHours(startOfDay(new Date()), hour), 'HH:mm')}
            reversed
          />
          {/* Add horizontal lines for each hour */}
          {hours.map((hour) => (
            <ReferenceLine
              key={hour.hour}
              y={hour.hour}
              stroke="#e5e7eb"
              strokeDasharray="3 3"
            />
          ))}
          {/* Add vertical lines for each day */}
          {days.map((day) => (
            <ReferenceLine
              key={day.getTime()}
              x={day.getTime()}
              stroke="#e5e7eb"
              strokeDasharray="3 3"
            />
          ))}
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;

              const data = payload[0].payload;
              return (
                <ChartTooltipContent>
                  <div className="flex flex-col gap-2 bg-background p-3 rounded-lg shadow-lg border">
                    <div className="font-medium">
                      {format(new Date(data.x), "EEEE, MMM dd")}
                    </div>
                    <div>{data.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.startTime} - {data.endTime}
                    </div>
                  </div>
                </ChartTooltipContent>
              );
            }}
          />
          <Scatter 
            data={timelineData || []} 
            shape={(props) => {
              const { cx, cy, height, fill, payload } = props;
              const pixelHeight = (height as number) * 30;
              return (
                <g transform={`translate(${-(payload as any).xOffset}, 0)`}>
                  <rect
                    x={cx - 40}
                    y={cy}
                    width={80}
                    height={pixelHeight || 30}
                    fill={fill}
                    rx={6}
                    ry={6}
                  />
                  <text
                    x={cx}
                    y={cy + 15}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    className="font-medium"
                  >
                    {(props as any).payload.label.split('\n').map((line: string, i: number) => (
                      <tspan key={i} x={cx} dy={i === 0 ? 0 : 12}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            }}
          >
            {timelineData?.map((entry) => (
              <Cell
                key={entry.id}
                fill={entry.color}
                stroke={entry.color}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ChartContainer>
    </div>
  );
}