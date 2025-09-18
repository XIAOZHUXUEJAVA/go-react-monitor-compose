"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ColoredProgress } from "@/components/ui/colored-progress";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { MiniSparkline } from "@/components/ui/mini-chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  formatPercent,
  formatFrequency,
  formatTemperature,
  getStatusColor,
} from "@/lib/format";
import {
  modernChartTheme,
  getChartConfig,
  getStatusGradient,
} from "@/lib/chart-theme";
import { ModernTooltip } from "@/components/ui/modern-tooltip";
import { Cpu, Thermometer, Zap } from "lucide-react";
import { useMonitoringStore } from "@/store/monitoring-store";
import { useAlertThresholds } from "@/hooks/use-alert-thresholds";

export default function CpuMonitor() {
  // 使用Zustand store获取CPU数据
  const cpuData = useMonitoringStore((state) => state.cpuData);
  const loading = useMonitoringStore((state) => state.loading.cpu);
  const error = useMonitoringStore((state) => state.errors.cpu);

  // 获取动态告警阈值
  const { getThresholds } = useAlertThresholds();
  const cpuThresholds = getThresholds("cpu");

  // 移除了个别的fetch调用，现在使用统一的数据获取机制

  if (loading) {
    return (
      <Card className="monitor-card w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CPU 监控
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !cpuData) {
    return (
      <Card className="monitor-card w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg shadow-lg">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              CPU 监控
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-8 font-medium">
            {error || "无法加载 CPU 数据"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const usageColor = getStatusColor(cpuData.usage, cpuThresholds);
  const tempColor = cpuData.temperature
    ? getStatusColor(cpuData.temperature, { warning: 70, danger: 85 })
    : "text-gray-500";

  // 格式化历史数据用于图表
  const chartData = cpuData.history.map((item, index) => ({
    time: new Date(item.timestamp).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    usage: Math.round(item.usage * 10) / 10,
  }));

  const usageStatus =
    cpuData.usage >= cpuThresholds.danger
      ? "danger"
      : cpuData.usage >= cpuThresholds.warning
      ? "warning"
      : "good";

  return (
    <Card className="monitor-card w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CPU 监控
              </span>
              <div className="flex items-center gap-2 mt-1">
                <AnimatedNumber
                  value={cpuData.usage}
                  suffix="%"
                  className="text-lg font-bold"
                  decimals={1}
                />
                <div className="w-16 h-6">
                  <MiniSparkline
                    data={cpuData.history.slice(-10).map((h) => h.usage)}
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
        {/* CPU 基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">使用率</span>
              <Badge variant="outline" className={usageColor}>
                {formatPercent(cpuData.usage)}
              </Badge>
            </div>
            <ColoredProgress
              value={cpuData.usage}
              size="md"
              showAnimation={true}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">频率</span>
            </div>
            <div className="text-lg font-semibold">
              <AnimatedNumber
                value={cpuData.frequency}
                suffix=" MHz"
                decimals={1}
              />
            </div>
          </div>

          {cpuData.temperature && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                <span className="text-sm font-medium">温度</span>
              </div>
              <div className={`text-lg font-semibold ${tempColor}`}>
                <AnimatedNumber
                  value={cpuData.temperature}
                  suffix="°C"
                  decimals={1}
                />
              </div>
            </div>
          )}
        </div>

        {/* CPU 详细信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              处理器型号
            </span>
            <div className="font-medium">{cpuData.model}</div>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              核心数
            </span>
            <div className="font-medium">{cpuData.cores} 核心</div>
          </div>
        </div>

        {/* CPU 使用率历史图表 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
            使用率趋势 (最近 {cpuData.history.length} 个数据点)
          </h4>
          <div className="h-64 p-4 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop
                      offset="100%"
                      stopColor="#6366f1"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                  <linearGradient
                    id="cpuLineGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
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
                      formatter={(value: number) => [`${value}%`, "CPU 使用率"]}
                      labelFormatter={(label) => `时间: ${label}`}
                    />
                  }
                  cursor={{
                    stroke: "#6366f1",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                    opacity: 0.5,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="usage"
                  stroke="url(#cpuLineGradient)"
                  strokeWidth={3}
                  fill="url(#cpuGradient)"
                  dot={{
                    fill: "#6366f1",
                    strokeWidth: 2,
                    r: 4,
                    stroke: "#ffffff",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                  }}
                  activeDot={{
                    r: 6,
                    stroke: "#6366f1",
                    strokeWidth: 3,
                    fill: "#ffffff",
                    filter: "drop-shadow(0 4px 8px rgba(99,102,241,0.3))",
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
