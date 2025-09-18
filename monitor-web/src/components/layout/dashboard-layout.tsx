"use client";

import { Sidebar } from "@/components/ui/sidebar";
import { PageManager } from "@/components/pages/PageManager";
import { Button } from "@/components/ui/button";
import { RefreshCw, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState, useMonitoringData } from "@/hooks/use-monitoring";
import { useAppStore } from "@/store/app-store";

interface DashboardLayoutProps {
  className?: string;
}

export function DashboardLayout({ className }: DashboardLayoutProps) {
  // 使用自定义hooks管理状态
  const {
    sidebarCollapsed,
    activeSection,
    isRefreshing,
    settings,
    setSidebarCollapsed,
    setActiveSection,
  } = useAppState();

  const { refresh, systemStatus } = useMonitoringData();

  // 从store获取updateSettings函数
  const updateSettings = useAppStore((state) => state.updateSettings);

  // 从store获取refreshKey
  const refreshKey = useAppStore((state) => state.refreshKey);

  // 获取页面标题
  const getPageTitle = () => {
    const titles: Record<string, string> = {
      overview: "系统概览",
      cpu: "CPU 监控",
      memory: "内存监控",
      disk: "磁盘监控",
      network: "网络监控",
      system: "系统信息",
      analytics: "数据分析",
      alerts: "告警中心",
      settings: "系统设置",
    };
    return titles[activeSection] || "系统概览";
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          systemStatus={systemStatus}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {getPageTitle()}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                实时监控系统性能和资源使用情况
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* 快速操作按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-700"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "刷新中..." : "刷新数据"}
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateSettings({
                      ...settings,
                      autoRefresh: !settings.autoRefresh,
                    })
                  }
                  className={`flex items-center gap-2 px-3 py-1 transition-all duration-200 ${
                    settings.autoRefresh
                      ? "bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300"
                      : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {settings.autoRefresh ? (
                    <>
                      <Pause className="h-3 w-3" />
                      <span className="text-sm font-medium">暂停刷新</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" />
                      <span className="text-sm font-medium">启用刷新</span>
                    </>
                  )}
                </Button>

                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-200 ${
                    settings.autoRefresh
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      settings.autoRefresh
                        ? "bg-green-500 animate-pulse"
                        : "bg-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      settings.autoRefresh
                        ? "text-green-700 dark:text-green-300"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {settings.autoRefresh
                      ? `实时监控中 (每${settings.refreshInterval}秒刷新)`
                      : "手动刷新模式"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={cn("flex-1 overflow-auto p-6", className)}>
          <PageManager activeSection={activeSection} refreshKey={refreshKey} />
        </div>
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
}
