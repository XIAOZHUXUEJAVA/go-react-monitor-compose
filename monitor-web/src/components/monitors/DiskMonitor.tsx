"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ColoredProgress } from "@/components/ui/colored-progress";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatBytes, formatPercent, getStatusColor } from "@/lib/format";
import {
  modernChartTheme,
  getChartConfig,
  getStatusGradient,
} from "@/lib/chart-theme";
import { ModernTooltip } from "@/components/ui/modern-tooltip";
import { HardDrive, Folder } from "lucide-react";
import { useMonitoringStore } from "@/store/monitoring-store";
import { useAlertThresholds } from "@/hooks/use-alert-thresholds";

export default function DiskMonitor() {
  // 使用Zustand store获取磁盘数据
  const diskData = useMonitoringStore((state) => state.diskData);
  const loading = useMonitoringStore((state) => state.loading.disk);
  const error = useMonitoringStore((state) => state.errors.disk);

  // 获取动态告警阈值
  const { getThresholds } = useAlertThresholds();
  const diskThresholds = getThresholds("disk");

  // 移除了个别的fetch调用，现在使用统一的数据获取机制

  if (loading) {
    return (
      <Card className="monitor-card w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-lg">
              <HardDrive className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              磁盘监控
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !diskData) {
    return (
      <Card className="monitor-card w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg shadow-lg">
              <HardDrive className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              磁盘监控
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-8 font-medium">
            {error || "无法加载磁盘数据"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalUsagePercent =
    (diskData.total_used / diskData.total_capacity) * 100;
  const totalUsageColor = getStatusColor(totalUsagePercent, diskThresholds);

  // 柱状图数据
  const chartData = diskData.disks.map((disk) => ({
    device: disk.device,
    used: Math.round(disk.used * 100) / 100,
    free: Math.round(disk.free * 100) / 100,
    usage_percent: Math.round(disk.usage_percent * 10) / 10,
  }));

  const overallUsageStatus =
    totalUsagePercent >= diskThresholds.danger
      ? "danger"
      : totalUsagePercent >= diskThresholds.warning
      ? "warning"
      : "good";

  return (
    <Card className="monitor-card w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-lg">
              <HardDrive className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                磁盘监控
              </span>
              <div className="flex items-center gap-2 mt-1">
                <AnimatedNumber
                  value={totalUsagePercent}
                  suffix="%"
                  className="text-lg font-bold"
                  decimals={1}
                />
                <span className="text-sm text-gray-500">
                  (
                  <AnimatedNumber
                    value={diskData.total_used}
                    suffix=" GB"
                    decimals={1}
                  />{" "}
                  /{" "}
                  <AnimatedNumber
                    value={diskData.total_capacity}
                    suffix=" GB"
                    decimals={1}
                  />
                  )
                </span>
              </div>
            </div>
          </div>
          <div
            className={`status-indicator status-${overallUsageStatus} w-3 h-3 rounded-full bg-${
              overallUsageStatus === "good"
                ? "green"
                : overallUsageStatus === "warning"
                ? "yellow"
                : "red"
            }-500`}
          ></div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 总体磁盘使用情况 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">总体磁盘使用率</span>
            <Badge variant="outline" className={totalUsageColor}>
              {formatPercent(totalUsagePercent)}
            </Badge>
          </div>
          <ColoredProgress
            value={totalUsagePercent}
            size="lg"
            showAnimation={true}
          />
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>
              {formatBytes(diskData.total_used * 1024 * 1024 * 1024)} 已使用
            </span>
            <span>
              {formatBytes(diskData.total_capacity * 1024 * 1024 * 1024)} 总计
            </span>
          </div>
        </div>

        {/* 各磁盘详细信息 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">磁盘详情</h4>
          <div className="grid gap-4">
            {diskData.disks.map((disk) => {
              const usageColor = getStatusColor(disk.usage_percent, diskThresholds);

              return (
                <div
                  key={`${disk.device}-${disk.mount_point}`}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span className="font-medium">{disk.device}</span>
                      <Badge variant="secondary" className="text-xs">
                        {disk.filesystem}
                      </Badge>
                    </div>
                    <Badge variant="outline" className={usageColor}>
                      {formatPercent(disk.usage_percent)}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <ColoredProgress
                      value={disk.usage_percent}
                      size="md"
                      showAnimation={true}
                    />
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          总容量
                        </span>
                        <div className="font-medium">
                          <AnimatedNumber
                            value={disk.total}
                            suffix=" GB"
                            decimals={1}
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          已使用
                        </span>
                        <div className="font-medium text-red-600">
                          <AnimatedNumber
                            value={disk.used}
                            suffix=" GB"
                            decimals={1}
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          可用
                        </span>
                        <div className="font-medium text-green-600">
                          <AnimatedNumber
                            value={disk.free}
                            suffix=" GB"
                            decimals={1}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    挂载点: {disk.mount_point}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 磁盘使用量柱状图 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500"></div>
            磁盘使用量对比
          </h4>
          <div className="h-64 p-4 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient
                    id="usedBarGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                  <linearGradient
                    id="freeBarGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  opacity={0.1}
                  vertical={false}
                />
                <XAxis
                  dataKey="device"
                  tick={{ fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis
                  tick={{ fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  label={{
                    value: "容量 (GB)",
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
                        const label = name === "used" ? "已使用" : "空闲";
                        return [formatBytes(value * 1024 * 1024 * 1024), label];
                      }}
                      labelFormatter={(label) => `磁盘: ${label}`}
                    />
                  }
                  cursor={{
                    fill: "rgba(0, 0, 0, 0.05)",
                    radius: 4,
                  }}
                />
                <Bar
                  dataKey="used"
                  stackId="a"
                  fill="url(#usedBarGradient)"
                  name="used"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="free"
                  stackId="a"
                  fill="url(#freeBarGradient)"
                  name="free"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 磁盘使用率柱状图 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            磁盘使用率对比
          </h4>
          <div className="h-48 p-4 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient
                    id="usageBarGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  opacity={0.1}
                  vertical={false}
                />
                <XAxis
                  dataKey="device"
                  tick={{ fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
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
                      formatter={(value: number) => [`${value}%`, "使用率"]}
                      labelFormatter={(label) => `磁盘: ${label}`}
                    />
                  }
                  cursor={{
                    fill: "rgba(139, 92, 246, 0.1)",
                    radius: 4,
                  }}
                />
                <Bar
                  dataKey="usage_percent"
                  fill="url(#usageBarGradient)"
                  radius={[6, 6, 0, 0]}
                  stroke="#ffffff"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
