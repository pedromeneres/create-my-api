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

  const timelineData = reservations?.map((reservation) => {
    const startHour = new Date(reservation.start_time).getHours();
    const endHour = new Date(reservation.end_time).getHours();
    const carId = `${reservation.car.make}-${reservation.car.model}`;
    
    return {
      x: new Date(reservation.start_time).getTime(),
      y: Math.max(8, Math.min(startHour, 22)), // Clamp between 8 and 22
      height: Math.min(endHour, 22) - Math.max(startHour, 8), // Adjust height to fit within bounds
      label: `${reservation.user_email}\n${reservation.car.make} ${reservation.car.model}`,
      id: reservation.id,
      startTime: format(new Date(reservation.start_time), 'HH:mm'),
      endTime: format(new Date(reservation.end_time), 'HH:mm'),
      color: carColorMap.get(carId),
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
              const { cx, cy, height, fill } = props;
              // Convert the height from hours to pixels
              const pixelHeight = (height as number) * 30; // Adjust this multiplier to change the visual height
              return (
                <g>
                  <rect
                    x={cx - 40}
                    y={cy}
                    width={80}
                    height={pixelHeight || 30} // Minimum height of 30px
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