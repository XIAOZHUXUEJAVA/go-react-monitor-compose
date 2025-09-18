"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface MiniChartProps {
  data: Array<{ value: number; timestamp: string }>;
  color?: string;
  height?: number;
  strokeWidth?: number;
}

export function MiniChart({
  data,
  color = "#3b82f6",
  height = 40,
  strokeWidth = 2,
}: MiniChartProps) {
  // 格式化数据用于图表
  const chartData = data.map((item, index) => ({
    index,
    value: item.value,
  }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={strokeWidth}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

export function MiniSparkline({
  data,
  color = "#3b82f6",
  height = 30,
  className = "",
}: MiniSparklineProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={`inline-block ${className}`} style={{ height }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}