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
import { format, addDays, startOfDay, endOfDay, addHours } from "date-fns";

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
  "#9b87f5",
  "#7E69AB",
  "#6E59A5",
  "#8B5CF6",
  "#D946EF",
  "#F97316",
  "#0EA5E9",
  "#1EAEDB",
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

  // Start from today
  const today = startOfDay(new Date());
  
  // Create array of 3 days starting from today
  const days = Array.from({ length: 3 }, (_, i) => addDays(today, i));
  
  // Create array of hours from 9 to 21
  const hours = Array.from({ length: 13 }, (_, i) => ({
    hour: i + 9,
    label: format(addHours(startOfDay(new Date()), i + 9), 'HH:mm'),
  }));

  // Create a map of car IDs to colors
  const carColorMap = new Map();
  reservations?.forEach((reservation) => {
    const carId = `${reservation.car.make}-${reservation.car.model}`;
    if (!carColorMap.has(carId)) {
      carColorMap.set(carId, colors[carColorMap.size % colors.length]);
    }
  });

  const timelineData = reservations?.flatMap((reservation) => {
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
    
    // Reduce the offset between overlapping reservations (40px width + 10px gap)
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
            right: 20,
            bottom: 20,
            left: 60,
          }}
        >
          <XAxis
            dataKey="x"
            domain={[days[0].getTime(), days[2].getTime()]}
            name="Day"
            tickFormatter={(unixTime) => format(new Date(unixTime), "EEE dd/MM")}
            type="number"
            interval={0}
            ticks={days.map(day => day.getTime())}
            width={250}
          />
          <YAxis
            type="number"
            domain={[9, 21]}
            ticks={hours.map(h => h.hour)}
            tickFormatter={(hour) => format(addHours(startOfDay(new Date()), hour), 'HH:mm')}
            reversed
          />
          {hours.map((hour) => (
            <ReferenceLine
              key={hour.hour}
              y={hour.hour}
              stroke="#e5e7eb"
              strokeDasharray="3 3"
            />
          ))}
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
                    x={cx - 20}
                    y={cy}
                    width={40}
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
