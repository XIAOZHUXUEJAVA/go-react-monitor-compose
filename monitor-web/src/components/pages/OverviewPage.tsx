"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CpuMonitor from "@/components/monitors/CpuMonitor";
import MemoryMonitor from "@/components/monitors/MemoryMonitor";
import DiskMonitor from "@/components/monitors/DiskMonitor";
import NetworkMonitor from "@/components/monitors/NetworkMonitor";
import SystemInfo from "@/components/monitors/SystemInfo";
import { TrendingUp, Zap, Activity, BarChart3 } from "lucide-react";

interface OverviewPageProps {
  refreshKey: number;
}

export function OverviewPage({ refreshKey }: OverviewPageProps) {
  return (
    <div className="space-y-6">
      {/* 系统信息概览 */}
      <div key={`system-${refreshKey}`} className="animate-fade-in">
        <SystemInfo />
      </div>

      {/* CPU 和内存监控 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div key={`cpu-${refreshKey}`} className="animate-fade-in animation-delay-100">
          <CpuMonitor />
        </div>
        <div key={`memory-${refreshKey}`} className="animate-fade-in animation-delay-200">
          <MemoryMonitor />
        </div>
      </div>

      {/* 磁盘和网络监控 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div key={`disk-${refreshKey}`} className="animate-fade-in animation-delay-300">
          <DiskMonitor />
        </div>
        <div key={`network-${refreshKey}`} className="animate-fade-in animation-delay-400">
          <NetworkMonitor />
        </div>
      </div>

      {/* 状态汇总卡片 */}
      <Card className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">系统性能</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">优秀</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">运行状态</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">稳定</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">监控状态</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">正常</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}