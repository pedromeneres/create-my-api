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
import { format, addHours, startOfDay, endOfDay } from "date-fns";

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
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEEAD",
  "#D4A5A5",
  "#9B59B6",
  "#3498DB",
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

      // Get current user's email
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create a simple map with just the current user's ID and email
      const emailMap = new Map();
      if (user?.email) {
        emailMap.set(user.id, user.email);
      }

      // Combine the data
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

  // Create time slots for the day (every hour)
  const today = new Date();
  const timeSlots = Array.from({ length: 24 }, (_, i) => ({
    time: addHours(startOfDay(today), i).getTime(),
    label: format(addHours(startOfDay(today), i), 'HH:mm'),
  }));

  const timelineData = reservations?.map((reservation) => ({
    x: new Date(reservation.start_time).getTime(),
    y: 1,
    width: (new Date(reservation.end_time).getTime() - new Date(reservation.start_time).getTime()) / (1000 * 60 * 60), // Width in hours
    label: `${reservation.user_email} - ${reservation.car.make} ${reservation.car.model}`,
    id: reservation.id,
    startTime: format(new Date(reservation.start_time), 'HH:mm'),
    endTime: format(new Date(reservation.end_time), 'HH:mm'),
  }));

  return (
    <div className="h-[600px] w-full bg-background rounded-lg shadow-sm border">
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
            domain={[startOfDay(today).getTime(), endOfDay(today).getTime()]}
            name="Time"
            tickFormatter={(unixTime) => format(new Date(unixTime), "HH:mm")}
            type="number"
            interval={0}
            ticks={timeSlots.map(slot => slot.time)}
          />
          <YAxis 
            type="number"
            domain={[0, 2]}
            ticks={[1]}
            tickFormatter={() => "Reservations"}
          />
          {/* Add vertical lines for each hour */}
          {timeSlots.map((slot) => (
            <ReferenceLine
              key={slot.time}
              x={slot.time}
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
                      {format(new Date(data.x), "MM/dd/yyyy")}
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
              const { cx, cy, width, fill } = props;
              // Convert the width from the data to pixels
              const pixelWidth = (width as number) * 30; // Adjust this multiplier to change the visual width
              return (
                <rect
                  x={cx - pixelWidth / 2}
                  y={cy - 20}
                  width={pixelWidth}
                  height={40}
                  fill={fill}
                  rx={6}
                  ry={6}
                />
              );
            }}
          >
            {timelineData?.map((entry, index) => (
              <Cell
                key={entry.id}
                fill={colors[index % colors.length]}
                stroke={colors[index % colors.length]}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ChartContainer>
    </div>
  );
}