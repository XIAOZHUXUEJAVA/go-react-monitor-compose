import { useEffect, useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import { useMonitoringStore } from "@/store/monitoring-store";
import {
  useAlertRulesStore,
  getAlertThresholds,
  type AlertRule,
} from "@/store/alert-rules-store";
import type { SystemStatus } from "@/store/app-store";

// 计算状态级别的函数
const calculateStatusLevel = (
  value: number,
  warningThreshold: number,
  criticalThreshold: number
): "normal" | "warning" | "critical" => {
  if (value >= criticalThreshold) return "critical";
  if (value >= warningThreshold) return "warning";
  return "normal";
};

/**
 * 自定义Hook：统一管理监控数据获取和系统状态同步
 */
export function useMonitoringData() {
  const updateSystemStatus = useAppStore((state) => state.updateSystemStatus);
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);
  const refreshKey = useAppStore((state) => state.refreshKey);

  // 使用告警规则状态管理
  const { alertRules, fetchAlertRules, lastUpdated } = useAlertRulesStore();

  const {
    cpuData,
    memoryData,
    diskData,
    networkData,
    loading,
    errors,
    fetchAllData,
  } = useMonitoringStore();

  // 获取特定指标的告警阈值
  const getThresholds = useCallback(
    (metricType: string) => {
      return getAlertThresholds(alertRules, metricType);
    },
    [alertRules]
  );

  // 计算系统状态
  const calculateSystemStatus = useCallback((): SystemStatus => {
    const cpuUsage = cpuData?.usage || 0;
    const memoryUsage = memoryData?.usage_percent || 0;

    // 计算磁盘平均使用率
    let diskUsage = 0;
    if (diskData?.disks && diskData.disks.length > 0) {
      const totalUsage = diskData.disks.reduce(
        (sum, disk) => sum + disk.usage_percent,
        0
      );
      diskUsage = totalUsage / diskData.disks.length;
    }

    // 检查网络状态
    const networkStatus =
      networkData?.interfaces?.some((iface) => iface.is_up) || false;

    // 获取各指标的告警阈值
    const cpuThresholds = getThresholds("cpu");
    const memoryThresholds = getThresholds("memory");
    const diskThresholds = getThresholds("disk");

    // 计算状态级别
    const cpuLevel = calculateStatusLevel(
      cpuUsage,
      cpuThresholds.warning,
      cpuThresholds.critical
    );
    const memoryLevel = calculateStatusLevel(
      memoryUsage,
      memoryThresholds.warning,
      memoryThresholds.critical
    );
    const diskLevel = calculateStatusLevel(
      diskUsage,
      diskThresholds.warning,
      diskThresholds.critical
    );

    // 调试日志
    console.log("System Status Calculation:", {
      cpuUsage,
      cpuThresholds,
      cpuLevel,
      memoryUsage,
      memoryThresholds,
      memoryLevel,
      diskUsage,
      diskThresholds,
      diskLevel,
      alertRulesCount: alertRules.length,
    });

    return {
      cpu: cpuUsage,
      memory: memoryUsage,
      disk: diskUsage,
      network: networkStatus,
      cpuLevel,
      memoryLevel,
      diskLevel,
    };
  }, [cpuData, memoryData, diskData, networkData, getThresholds]);

  // 初始化数据获取和告警规则
  useEffect(() => {
    fetchAllData();
    fetchAlertRules();
  }, [fetchAllData, fetchAlertRules]);

  // 响应刷新请求
  useEffect(() => {
    if (refreshKey > 0) {
      fetchAllData();
    }
  }, [refreshKey, fetchAllData]);

  // 当告警规则更新时，重新计算系统状态
  useEffect(() => {
    if (cpuData && memoryData && diskData && networkData) {
      const systemStatus = calculateSystemStatus();
      updateSystemStatus(systemStatus);
    }
  }, [lastUpdated]); // 添加 lastUpdated 依赖

  // 定时更新数据
  const settings = useAppStore((state) => state.settings);
  useEffect(() => {
    if (!settings.autoRefresh) {
      return; // 如果禁用自动刷新，不设置定时器
    }

    const interval = setInterval(() => {
      fetchAllData();
    }, settings.refreshInterval * 1000); // 转换为毫秒

    return () => clearInterval(interval);
  }, [fetchAllData, settings.refreshInterval, settings.autoRefresh]);

  // 同步系统状态到应用状态
  useEffect(() => {
    if (cpuData && memoryData && diskData && networkData) {
      const systemStatus = calculateSystemStatus();
      updateSystemStatus(systemStatus);
    }
  }, [
    cpuData,
    memoryData,
    diskData,
    networkData,
    updateSystemStatus,
    calculateSystemStatus,
  ]);

  return {
    // 监控数据
    cpuData,
    memoryData,
    diskData,
    networkData,

    // 加载状态
    loading,
    errors,

    // 操作
    refresh: triggerRefresh,
    fetchAllData,

    // 计算的系统状态
    systemStatus: calculateSystemStatus(),
  };
}

/**
 * 自定义Hook：管理应用UI状态
 */
export function useAppState() {
  const {
    sidebarCollapsed,
    isDarkMode,
    activeSection,
    isRefreshing,
    settings,
    setSidebarCollapsed,
    setActiveSection,
    toggleDarkMode,
    loadSettings,
  } = useAppStore();

  // 初始化主题和设置
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 加载保存的设置，会自动应用主题和侧边栏设置
      loadSettings();
    }
  }, [loadSettings]);

  // 响应式侧边栏
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarCollapsed]);

  return {
    sidebarCollapsed,
    isDarkMode,
    activeSection,
    isRefreshing,
    settings,
    setSidebarCollapsed,
    setActiveSection,
    toggleDarkMode,
  };
}
