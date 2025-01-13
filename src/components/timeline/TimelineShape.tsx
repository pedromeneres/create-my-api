interface TimelineShapeProps {
  cx: number;
  cy: number;
  height: number;
  fill: string;
  payload: any;
}

export function TimelineShape({ cx, cy, height, fill, payload }: TimelineShapeProps) {
  const pixelHeight = (height as number) * 30;
  return (
    <g transform={`translate(${-payload.xOffset}, 0)`}>
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
        {payload.label.split('\n').map((line: string, i: number) => (
          <tspan key={i} x={cx} dy={i === 0 ? 0 : 12}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}