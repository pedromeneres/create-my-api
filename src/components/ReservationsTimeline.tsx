import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChartContainer } from "@/components/ui/chart";
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
import { format } from "date-fns";
import { TimelineTooltip } from "./timeline/TimelineTooltip";
import { TimelineShape } from "./timeline/TimelineShape";
import { getTimelineDays, getTimelineHours, transformTimelineData } from "@/utils/timelineUtils";
import { TimelineReservation } from "@/types/reservation";

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

  const days = getTimelineDays();
  const hours = getTimelineHours();
  const timelineData = transformTimelineData(reservations as TimelineReservation[]);

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
          width={500}
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
            scale="time"
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
          <Tooltip content={TimelineTooltip} />
          <Scatter data={timelineData} shape={TimelineShape}>
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