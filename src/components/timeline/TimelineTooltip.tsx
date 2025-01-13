import { format } from "date-fns";
import { ChartTooltipContent } from "@/components/ui/chart";
import { TransformedTimelineData } from "@/types/reservation";

interface TimelineTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TransformedTimelineData }>;
}

export function TimelineTooltip({ active, payload }: TimelineTooltipProps) {
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
}