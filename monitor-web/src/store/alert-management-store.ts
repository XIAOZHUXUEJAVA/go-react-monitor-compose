import { create } from "zustand";
import {
  getAlertStatistics,
  getAlerts,
  resolveAlert,
  acknowledgeAlert,
  type AlertStatistics,
  type AlertSummary,
} from "@/lib/alert-management-api";

// 告警管理状态接口
interface AlertManagementState {
  // 数据状态
  statistics: AlertStatistics | null;
  alerts: AlertSummary[];

  // 加载状态
  loadingStatistics: boolean;
  loadingAlerts: boolean;

  // 错误状态
  error: string | null;

  // 最后更新时间
  lastUpdated: number;

  // 操作方法
  setStatistics: (stats: AlertStatistics) => void;
  setAlerts: (alerts: AlertSummary[]) => void;
  setLoadingStatistics: (loading: boolean) => void;
  setLoadingAlerts: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 数据获取方法
  fetchStatistics: () => Promise<void>;
  fetchAlerts: (status?: string) => Promise<void>;
  fetchAll: () => Promise<void>;

  // 告警操作方法
  handleResolveAlert: (alertId: number, message?: string) => Promise<void>;
  handleAcknowledgeAlert: (alertId: number, message?: string) => Promise<void>;

  // 刷新方法
  refresh: () => Promise<void>;
  triggerUpdate: () => void;
}

// 创建告警管理状态管理
export const useAlertManagementStore = create<AlertManagementState>(
  (set, get) => ({
    // 初始状态
    statistics: null,
    alerts: [],
    loadingStatistics: false,
    loadingAlerts: false,
    error: null,
    lastUpdated: 0,

    // 状态设置方法
    setStatistics: (stats) =>
      set({
        statistics: stats,
        lastUpdated: Date.now(),
        error: null,
      }),

    setAlerts: (alerts) =>
      set({
        alerts,
        lastUpdated: Date.now(),
        error: null,
      }),

    setLoadingStatistics: (loading) => set({ loadingStatistics: loading }),
    setLoadingAlerts: (loading) => set({ loadingAlerts: loading }),
    setError: (error) => set({ error }),

    // 获取告警统计
    fetchStatistics: async () => {
      const { setLoadingStatistics, setStatistics, setError } = get();

      try {
        setLoadingStatistics(true);
        setError(null);

        const stats = await getAlertStatistics();
        setStatistics(stats);

        console.log("Alert statistics fetched:", stats);
      } catch (error) {
        console.error("Failed to fetch alert statistics:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoadingStatistics(false);
      }
    },

    // 获取告警列表
    fetchAlerts: async (status?: string) => {
      const { setLoadingAlerts, setAlerts, setError } = get();

      try {
        setLoadingAlerts(true);
        setError(null);

        const alerts = await getAlerts(status);
        setAlerts(alerts);

        console.log("Alerts fetched:", alerts);
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoadingAlerts(false);
      }
    },

    // 获取所有数据
    fetchAll: async () => {
      const { fetchStatistics, fetchAlerts } = get();

      await Promise.all([fetchStatistics(), fetchAlerts()]);
    },

    // 解决告警
    handleResolveAlert: async (alertId: number, message = "用户手动解决") => {
      const { fetchAll, setError } = get();

      try {
        setError(null);

        await resolveAlert(alertId, message);

        // 重新获取所有数据以保持同步
        await fetchAll();

        console.log(`Alert ${alertId} resolved successfully`);
      } catch (error) {
        console.error(`Failed to resolve alert ${alertId}:`, error);
        setError(
          error instanceof Error ? error.message : "Failed to resolve alert"
        );
        throw error;
      }
    },

    // 确认告警
    handleAcknowledgeAlert: async (
      alertId: number,
      message = "用户手动确认"
    ) => {
      const { fetchAll, setError } = get();

      try {
        setError(null);

        await acknowledgeAlert(alertId, message);

        // 重新获取所有数据以保持同步
        await fetchAll();

        console.log(`Alert ${alertId} acknowledged successfully`);
      } catch (error) {
        console.error(`Failed to acknowledge alert ${alertId}:`, error);
        setError(
          error instanceof Error ? error.message : "Failed to acknowledge alert"
        );
        throw error;
      }
    },

    // 刷新所有数据
    refresh: async () => {
      const { fetchAll } = get();
      await fetchAll();
    },

    // 触发更新（用于外部通知）
    triggerUpdate: () => {
      set({ lastUpdated: Date.now() });
    },
  })
);

// 自动刷新Hook
export function useAlertAutoRefresh(intervalMs: number = 30000) {
  const { refresh } = useAlertManagementStore();

  React.useEffect(() => {
    // 立即执行一次
    refresh();

    // 设置定时刷新
    const interval = setInterval(refresh, intervalMs);

    return () => clearInterval(interval);
  }, [refresh, intervalMs]);
}

// 导入React用于useEffect
import React from "react";
