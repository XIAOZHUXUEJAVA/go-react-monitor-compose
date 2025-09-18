"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  BarChart,
  Bar,
} from "recharts";
import { formatBytes, formatNetworkSpeed } from "@/lib/format";
import { modernChartTheme, getChartConfig, getStatusGradient } from "@/lib/chart-theme";
import { ModernTooltip } from "@/components/ui/modern-tooltip";
import { Wifi, WifiOff, Activity, Upload, Download } from "lucide-react";
import { useMonitoringStore } from "@/store/monitoring-store";

export default function NetworkMonitor() {
  // 使用Zustand store获取网络数据
  const networkData = useMonitoringStore(state => state.networkData);
  const loading = useMonitoringStore(state => state.loading.network);
  const error = useMonitoringStore(state => state.errors.network);
  
  // 移除了个别的fetch调用，现在使用统一的数据获取机制

  if (loading) {
    return (
      <Card className="monitor-card w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              网络监控
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !networkData) {
    return (
      <Card className="monitor-card w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg shadow-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              网络监控
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-8 font-medium">
            {error || "无法加载网络数据"}
          </div>
        </CardContent>
      </Card>
    );
  }

  // 历史流量图表数据
  const chartData = networkData.history.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    sent: Math.round((item.bytes_sent_per_sec / 1024 / 1024) * 100) / 100, // MB/s
    recv: Math.round((item.bytes_recv_per_sec / 1024 / 1024) * 100) / 100, // MB/s
  }));

  // 网卡流量对比数据
  const interfaceData = networkData.interfaces.map((iface) => ({
    name: iface.name,
    sent: Math.round((iface.bytes_sent / 1024 / 1024) * 100) / 100, // MB
    recv: Math.round((iface.bytes_recv / 1024 / 1024) * 100) / 100, // MB
    is_up: iface.is_up,
  }));

  const activeInterfaces = networkData.interfaces.filter(iface => iface.is_up).length;
  const networkStatus: 'good' | 'warning' | 'danger' = activeInterfaces > 0 ? 'good' : 'danger';

  return (
    <Card className="monitor-card w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                网络监控
              </span>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1 text-sm">
                  <Upload className="h-3 w-3 text-blue-500" />
                  <AnimatedNumber 
                    value={networkData.total_bytes_sent / (1024 * 1024 * 1024)} 
                    suffix=" GB" 
                    decimals={2}
                    className="font-semibold"
                  />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Download className="h-3 w-3 text-green-500" />
                  <AnimatedNumber 
                    value={networkData.total_bytes_recv / (1024 * 1024 * 1024)} 
                    suffix=" GB" 
                    decimals={2}
                    className="font-semibold"
                  />
                </div>
                <div className="w-16 h-6">
                  <MiniSparkline 
                    data={networkData.history.slice(-10).map(h => h.bytes_recv_per_sec / (1024 * 1024))}
                    color="#06b6d4"
                    height={24}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className={`status-indicator status-${networkStatus} w-3 h-3 rounded-full ${networkStatus === 'good' ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 总体网络统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">总发送</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              <AnimatedNumber 
                value={networkData.total_bytes_sent / (1024 * 1024 * 1024)} 
                suffix=" GB" 
                decimals={2}
              />
            </div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Download className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">总接收</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              <AnimatedNumber 
                value={networkData.total_bytes_recv / (1024 * 1024 * 1024)} 
                suffix=" GB" 
                decimals={2}
              />
            </div>
          </div>
        </div>

        {/* 网络接口详情 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">网络接口</h4>
          <div className="grid gap-4">
            {networkData.interfaces.map((iface) => (
              <div key={iface.name} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {iface.is_up ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="font-medium">{iface.name}</span>
                    <Badge
                      variant={iface.is_up ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {iface.is_up ? "启用" : "禁用"}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {iface.speed} Mbps
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      发送字节
                    </span>
                    <div className="font-medium text-blue-600">
                      <AnimatedNumber 
                        value={iface.bytes_sent / (1024 * 1024)} 
                        suffix=" MB" 
                        decimals={1}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      接收字节
                    </span>
                    <div className="font-medium text-green-600">
                      <AnimatedNumber 
                        value={iface.bytes_recv / (1024 * 1024)} 
                        suffix=" MB" 
                        decimals={1}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      发送包数
                    </span>
                    <div className="font-medium">
                      {iface.packets_sent.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      接收包数
                    </span>
                    <div className="font-medium">
                      {iface.packets_recv.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 网络流量历史图表 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"></div>
            实时流量趋势
          </h4>
          <div className="h-64 p-4 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="sentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="recvGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="sentLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                  <linearGradient id="recvLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#10b981" />
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
                  tick={{ fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  label={{
                    value: "流量 (MB/s)",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: 'middle', fontSize: 11, fontWeight: 500 }
                  }}
                  className="text-gray-600 dark:text-gray-400"
                />
                <Tooltip
                  content={<ModernTooltip 
                    formatter={(value: number, name: string) => {
                      const label = name === "sent" ? "上传" : "下载";
                      return [`${value} MB/s`, label];
                    }}
                    labelFormatter={(label) => `时间: ${label}`}
                  />}
                  cursor={{
                    stroke: '#06b6d4',
                    strokeWidth: 1,
                    strokeDasharray: '4 4',
                    opacity: 0.5
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sent"
                  stroke="url(#sentLineGradient)"
                  strokeWidth={3}
                  fill="url(#sentGradient)"
                  dot={{
                    fill: '#3b82f6',
                    strokeWidth: 2,
                    r: 4,
                    stroke: '#ffffff'
                  }}
                  activeDot={{
                    r: 6,
                    stroke: '#3b82f6',
                    strokeWidth: 3,
                    fill: '#ffffff',
                    filter: 'drop-shadow(0 4px 8px rgba(59,130,246,0.3))'
                  }}
                  name="sent"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="recv"
                  stroke="url(#recvLineGradient)"
                  strokeWidth={3}
                  fill="url(#recvGradient)"
                  dot={{
                    fill: '#22c55e',
                    strokeWidth: 2,
                    r: 4,
                    stroke: '#ffffff'
                  }}
                  activeDot={{
                    r: 6,
                    stroke: '#22c55e',
                    strokeWidth: 3,
                    fill: '#ffffff',
                    filter: 'drop-shadow(0 4px 8px rgba(34,197,94,0.3))'
                  }}
                  name="recv"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 网卡流量对比 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"></div>
            网卡流量对比
          </h4>
          <div className="h-48 p-4 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={interfaceData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="sentBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="recvBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#15803d" />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="currentColor" 
                  opacity={0.1}
                  vertical={false}
                />
                <XAxis 
                  dataKey="name" 
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
                    value: "流量 (MB)",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: 'middle', fontSize: 11, fontWeight: 500 }
                  }}
                  className="text-gray-600 dark:text-gray-400"
                />
                <Tooltip
                  content={<ModernTooltip 
                    formatter={(value: number, name: string) => {
                      const label = name === "sent" ? "发送" : "接收";
                      return [`${value} MB`, label];
                    }}
                    labelFormatter={(label) => `网卡: ${label}`}
                  />}
                  cursor={{
                    fill: 'rgba(0, 0, 0, 0.05)',
                    radius: 4
                  }}
                />
                <Bar
                  dataKey="sent"
                  fill="url(#sentBarGradient)"
                  name="sent"
                  radius={[4, 4, 0, 0]}
                  stroke="#ffffff"
                  strokeWidth={1}
                />
                <Bar
                  dataKey="recv"
                  fill="url(#recvBarGradient)"
                  name="recv"
                  radius={[4, 4, 0, 0]}
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
