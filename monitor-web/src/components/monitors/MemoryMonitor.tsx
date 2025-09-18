"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ColoredProgress } from "@/components/ui/colored-progress";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { MiniSparkline } from "@/components/ui/mini-chart";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatBytes, formatPercent, getStatusColor } from "@/lib/format";
import {
  modernChartTheme,
  getChartConfig,
  getStatusGradient,
} from "@/lib/chart-theme";
import { ModernTooltip } from "@/components/ui/modern-tooltip";
import { MemoryStick, HardDrive } from "lucide-react";
import { useMonitoringStore } from "@/store/monitoring-store";
import { useAlertThresholds } from "@/hooks/use-alert-thresholds";

const COLORS = {
  used: "#ef4444",
  free: "#22c55e",
  swap: "#f59e0b",
};

export default function MemoryMonitor() {
  // 使用Zustand store获取内存数据
  const memoryData = useMonitoringStore((state) => state.memoryData);
  const loading = useMonitoringStore((state) => state.loading.memory);
  const error = useMonitoringStore((state) => state.errors.memory);

  // 获取动态告警阈值
  const { getThresholds } = useAlertThresholds();
  const memoryThresholds = getThresholds("memory");

  // 移除了个别的fetch调用，现在使用统一的数据获取机制

  if (loading) {
    return (
      <Card className="monitor-card w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-lg">
              <MemoryStick className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              内存监控
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !memoryData) {
    return (
      <Card className="monitor-card w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg shadow-lg">
              <MemoryStick className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              内存监控
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-8 font-medium">
            {error || "无法加载内存数据"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const usageColor = getStatusColor(memoryData.usage_percent, memoryThresholds);

  // 饼图数据
  const pieData = [
    { name: "已使用", value: memoryData.used, color: COLORS.used },
    { name: "空闲", value: memoryData.free, color: COLORS.free },
  ];

  // 历史数据图表
  const chartData = memoryData.history.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    usage_percent: Math.round(item.usage_percent * 10) / 10,
    used: Math.round(item.used * 100) / 100,
  }));

  const usageStatus =
    memoryData.usage_percent >= memoryThresholds.danger
      ? "danger"
      : memoryData.usage_percent >= memoryThresholds.warning
      ? "warning"
      : "good";

  return (
    <Card className="monitor-card w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-lg">
              <MemoryStick className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                内存监控
              </span>
              <div className="flex items-center gap-2 mt-1">
                <AnimatedNumber
                  value={memoryData.usage_percent}
                  suffix="%"
                  className="text-lg font-bold"
                  decimals={1}
                />
                <div className="w-16 h-6">
                  <MiniSparkline
                    data={memoryData.history
                      .slice(-10)
                      .map((h) => h.usage_percent)}
                    color={
                      usageStatus === "good"
                        ? "#22c55e"
                        : usageStatus === "warning"
                        ? "#f59e0b"
                        : "#ef4444"
                    }
                    height={24}
                  />
                </div>
              </div>
            </div>
          </div>
          <div
            className={`status-indicator status-${usageStatus} w-3 h-3 rounded-full bg-${
              usageStatus === "good"
                ? "green"
                : usageStatus === "warning"
                ? "yellow"
                : "red"
            }-500`}
          ></div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 内存使用率概览 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">内存使用率</span>
            <Badge variant="outline" className={usageColor}>
              {formatPercent(memoryData.usage_percent)}
            </Badge>
          </div>
          <ColoredProgress
            value={memoryData.usage_percent}
            size="lg"
            showAnimation={true}
          />
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>
              {formatBytes(memoryData.used * 1024 * 1024 * 1024)} 已使用
            </span>
            <span>
              {formatBytes(memoryData.total * 1024 * 1024 * 1024)} 总计
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 内存分布饼图 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-amber-500"></div>
              内存分布
            </h4>
            <div className="relative h-64 p-6 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {/* 增强渐变效果 */}
                    <linearGradient
                      id="usedMemoryGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="30%" stopColor="#f43f5e" />
                      <stop offset="70%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                    <linearGradient
                      id="freeMemoryGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="30%" stopColor="#0891b2" />
                      <stop offset="70%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    {/* 中央圆形阴影 */}
                    <filter id="innerShadow">
                      <feDropShadow
                        dx="0"
                        dy="2"
                        stdDeviation="4"
                        floodOpacity="0.1"
                      />
                    </filter>
                    {/* 外部阴影 */}
                    <filter id="outerShadow">
                      <feDropShadow
                        dx="0"
                        dy="4"
                        stdDeviation="8"
                        floodOpacity="0.15"
                      />
                    </filter>
                  </defs>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                  >
                    <Cell
                      fill="url(#usedMemoryGradient)"
                      stroke="#ffffff"
                      strokeWidth={3}
                      filter="url(#outerShadow)"
                    />
                    <Cell
                      fill="url(#freeMemoryGradient)"
                      stroke="#ffffff"
                      strokeWidth={3}
                      filter="url(#outerShadow)"
                    />
                  </Pie>
                  <Tooltip
                    content={
                      <ModernTooltip
                        formatter={(value: number, name: string) => [
                          formatBytes(value * 1024 * 1024 * 1024),
                          name === "已使用" ? "已使用内存" : "空闲内存",
                        ]}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* 中央数据显示 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    <AnimatedNumber
                      value={memoryData.usage_percent}
                      suffix="%"
                      decimals={1}
                    />
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    已使用
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    <AnimatedNumber
                      value={memoryData.used}
                      suffix=" GB"
                      decimals={1}
                    />{" "}
                    /{" "}
                    <AnimatedNumber
                      value={memoryData.total}
                      suffix=" GB"
                      decimals={1}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 增强图例 */}
            <div className="flex justify-center gap-8">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-red-600 shadow-lg"></div>
                  <div className="absolute inset-0 w-4 h-4 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-red-600 animate-ping opacity-20"></div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    已使用
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <AnimatedNumber
                      value={memoryData.used}
                      suffix=" GB"
                      decimals={1}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-500 via-teal-500 to-green-600 shadow-lg"></div>
                  <div className="absolute inset-0 w-4 h-4 rounded-full bg-gradient-to-br from-cyan-500 via-teal-500 to-green-600 animate-ping opacity-20"></div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    空闲
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <AnimatedNumber
                      value={memoryData.free}
                      suffix=" GB"
                      decimals={1}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 内存详细信息 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">详细信息</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  总内存
                </span>
                <span className="font-medium">
                  <AnimatedNumber
                    value={memoryData.total}
                    suffix=" GB"
                    decimals={1}
                  />
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  已使用
                </span>
                <span className="font-medium text-red-600">
                  <AnimatedNumber
                    value={memoryData.used}
                    suffix=" GB"
                    decimals={1}
                  />
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  可用
                </span>
                <span className="font-medium text-green-600">
                  <AnimatedNumber
                    value={memoryData.available}
                    suffix=" GB"
                    decimals={1}
                  />
                </span>
              </div>

              {/* 交换分区信息 */}
              <div className="border-t pt-3 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="h-4 w-4" />
                  <span className="text-sm font-medium">交换分区</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      总计
                    </span>
                    <span>
                      {formatBytes(memoryData.swap_total * 1024 * 1024 * 1024)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      已使用
                    </span>
                    <span>
                      {formatBytes(memoryData.swap_used * 1024 * 1024 * 1024)}
                    </span>
                  </div>
                  <ColoredProgress
                    value={(memoryData.swap_used / memoryData.swap_total) * 100}
                    size="sm"
                    colorScheme="warning"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 内存使用历史图表 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-amber-500"></div>
            使用率趋势
          </h4>
          <div className="h-64 p-4 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient
                    id="memoryGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop
                      offset="100%"
                      stopColor="#ec4899"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                  <linearGradient
                    id="memoryLineGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  opacity={0.1}
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  label={{
                    value: "使用率 (%)",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      textAnchor: "middle",
                      fontSize: 11,
                      fontWeight: 500,
                    },
                  }}
                  className="text-gray-600 dark:text-gray-400"
                />
                <Tooltip
                  content={
                    <ModernTooltip
                      formatter={(value: number, name: string) => {
                        if (name === "usage_percent") {
                          return [`${value}%`, "内存使用率"];
                        }
                        return [
                          formatBytes(value * 1024 * 1024 * 1024),
                          "已使用内存",
                        ];
                      }}
                      labelFormatter={(label) => `时间: ${label}`}
                    />
                  }
                  cursor={{
                    stroke: "#ec4899",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                    opacity: 0.5,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="usage_percent"
                  stroke="url(#memoryLineGradient)"
                  strokeWidth={3}
                  fill="url(#memoryGradient)"
                  dot={{
                    fill: "#ec4899",
                    strokeWidth: 2,
                    r: 4,
                    stroke: "#ffffff",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                  }}
                  activeDot={{
                    r: 6,
                    stroke: "#ec4899",
                    strokeWidth: 3,
                    fill: "#ffffff",
                    filter: "drop-shadow(0 4px 8px rgba(236,72,153,0.3))",
                  }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
