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
} from "recharts";
import { format } from "date-fns";

interface TimelineReservation {
  id: string;
  start_time: string;
  end_time: string;
  car: {
    make: string;
    model: string;
  };
  user_email: string;
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

      // Get user emails
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) throw usersError;

      // Create a map of user IDs to emails
      const emailMap = new Map();
      users.users.forEach((user: any) => {
        if (user.email) {
          emailMap.set(user.id, user.email);
        }
      });

      // Combine the data
      return reservationsData.map((reservation: any) => ({
        ...reservation,
        car: reservation.car,
        user_email: emailMap.get(reservation.user_id) || 'Unknown User',
      })) as TimelineReservation[];
    },
  });

  if (isLoading) {
    return <div>Loading timeline...</div>;
  }

  const timelineData = reservations?.map((reservation) => ({
    x: new Date(reservation.start_time).getTime(),
    y: 1,
    label: `${reservation.user_email} - ${reservation.car.make} ${reservation.car.model}`,
    id: reservation.id,
    startTime: format(new Date(reservation.start_time), 'HH:mm'),
    endTime: format(new Date(reservation.end_time), 'HH:mm'),
  }));

  return (
    <div className="h-[400px] w-full">
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
            left: 20,
          }}
        >
          <XAxis
            dataKey="x"
            domain={["auto", "auto"]}
            name="Time"
            tickFormatter={(unixTime) => format(new Date(unixTime), "MM/dd/yyyy")}
            type="number"
          />
          <YAxis hide domain={[0, 2]} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;

              const data = payload[0].payload;
              return (
                <ChartTooltipContent>
                  <div className="flex flex-col gap-2">
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
          <Scatter data={timelineData || []}>
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