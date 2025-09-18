"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatUptime,
  formatRelativeTime,
  formatOS,
  formatPlatform,
} from "@/lib/format";
import { Monitor, Server, Clock, Activity } from "lucide-react";
import { useMonitoringStore } from "@/store/monitoring-store";
import { useAppStore } from "@/store/app-store";
import { useAlertThresholds } from "@/hooks/use-alert-thresholds";

export default function SystemInfo() {
  // 使用Zustand store获取系统信息
  const systemInfo = useMonitoringStore((state) => state.systemInfo);
  const loading = useMonitoringStore((state) => state.loading.system);
  const error = useMonitoringStore((state) => state.errors.system);
  const fetchSystem = useMonitoringStore((state) => state.fetchSystem);

  // 获取所有监控数据用于综合状态判断
  const cpuData = useMonitoringStore((state) => state.cpuData);
  const memoryData = useMonitoringStore((state) => state.memoryData);
  const diskData = useMonitoringStore((state) => state.diskData);
  const networkData = useMonitoringStore((state) => state.networkData);

  // 获取动态告警阈值
  const { getThresholds } = useAlertThresholds();

  // 计算综合系统状态
  const calculateOverallSystemStatus = () => {
    if (!cpuData || !memoryData || !diskData) {
      return { status: "unknown", message: "数据加载中...", color: "gray" };
    }

    const cpuThresholds = getThresholds("cpu");
    const memoryThresholds = getThresholds("memory");
    const diskThresholds = getThresholds("disk");

    // 计算总磁盘使用率
    const totalDiskUsage =
      diskData.total_capacity > 0
        ? (diskData.total_used / diskData.total_capacity) * 100
        : 0;

    // 检查各项指标状态
    const cpuStatus =
      cpuData.usage >= cpuThresholds.danger
        ? "critical"
        : cpuData.usage >= cpuThresholds.warning
        ? "warning"
        : "normal";

    const memoryStatus =
      memoryData.usage_percent >= memoryThresholds.danger
        ? "critical"
        : memoryData.usage_percent >= memoryThresholds.warning
        ? "warning"
        : "normal";

    const diskStatus =
      totalDiskUsage >= diskThresholds.danger
        ? "critical"
        : totalDiskUsage >= diskThresholds.warning
        ? "warning"
        : "normal";

    // 综合判断：只要有一个指标异常，整个系统就异常
    if (
      cpuStatus === "critical" ||
      memoryStatus === "critical" ||
      diskStatus === "critical"
    ) {
      return {
        status: "critical",
        message: "系统运行异常",
        color: "red",
        details: `CPU: ${cpuData.usage.toFixed(
          1
        )}%, 内存: ${memoryData.usage_percent.toFixed(
          1
        )}%, 磁盘: ${totalDiskUsage.toFixed(1)}%`,
      };
    }

    if (
      cpuStatus === "warning" ||
      memoryStatus === "warning" ||
      diskStatus === "warning"
    ) {
      return {
        status: "warning",
        message: "系统运行警告",
        color: "yellow",
        details: `CPU: ${cpuData.usage.toFixed(
          1
        )}%, 内存: ${memoryData.usage_percent.toFixed(
          1
        )}%, 磁盘: ${totalDiskUsage.toFixed(1)}%`,
      };
    }

    return {
      status: "normal",
      message: "系统运行正常",
      color: "green",
      details: `CPU: ${cpuData.usage.toFixed(
        1
      )}%, 内存: ${memoryData.usage_percent.toFixed(
        1
      )}%, 磁盘: ${totalDiskUsage.toFixed(1)}%`,
    };
  };

  const systemStatus = calculateOverallSystemStatus();

  // 初始化加载数据
  useEffect(() => {
    fetchSystem();
  }, [fetchSystem]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            系统信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !systemInfo) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            系统信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-8">
            {error || "无法加载系统信息"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="monitor-card w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg shadow-lg">
            <Monitor className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            系统信息
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 基本系统信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span className="text-sm font-medium">主机信息</span>
            </div>
            <div className="space-y-2 pl-6">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  主机名
                </span>
                <span className="font-medium">{systemInfo.hostname}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  操作系统
                </span>
                <span className="font-medium">
                  {formatOS(systemInfo.os, systemInfo.platform)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  平台
                </span>
                <Badge variant="outline">
                  {formatPlatform(systemInfo.platform)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  架构
                </span>
                <Badge variant="secondary">{systemInfo.arch}</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">运行时间</span>
            </div>
            <div className="space-y-2 pl-6">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  运行时长
                </span>
                <span className="font-medium text-green-600">
                  {formatUptime(systemInfo.uptime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  启动时间
                </span>
                <span className="font-medium">
                  {formatRelativeTime(systemInfo.boot_time)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 进程和负载信息 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">系统负载</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  进程数量
                </span>
                <Badge variant="outline" className="font-mono">
                  {systemInfo.processes}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                负载平均值
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-xs text-gray-500">1分钟</div>
                  <div className="font-mono font-medium">
                    {systemInfo.load_average[0].toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-xs text-gray-500">5分钟</div>
                  <div className="font-mono font-medium">
                    {systemInfo.load_average[1].toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-xs text-gray-500">15分钟</div>
                  <div className="font-mono font-medium">
                    {systemInfo.load_average[2].toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 系统状态指示器 */}
        <div className="gradient-border">
          <div className="gradient-border-content">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`status-indicator w-3 h-3 rounded-full ${
                    systemStatus.color === "green"
                      ? "bg-green-500"
                      : systemStatus.color === "yellow"
                      ? "bg-yellow-500"
                      : systemStatus.color === "red"
                      ? "bg-red-500"
                      : "bg-gray-500"
                  }`}
                ></div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold ${
                      systemStatus.color === "green"
                        ? "text-green-700 dark:text-green-300"
                        : systemStatus.color === "yellow"
                        ? "text-yellow-700 dark:text-yellow-300"
                        : systemStatus.color === "red"
                        ? "text-red-700 dark:text-red-300"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {systemStatus.message}
                  </span>
                  {systemStatus.details && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {systemStatus.details}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                最后更新: {new Date().toLocaleTimeString("zh-CN")}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
