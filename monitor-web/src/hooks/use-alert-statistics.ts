import { useEffect } from "react";
import { useAlertManagementStore } from "@/store/alert-management-store";

export function useAlertStatistics() {
  const {
    statistics,
    loadingStatistics: loading,
    error,
    fetchStatistics,
    lastUpdated,
  } = useAlertManagementStore();

  useEffect(() => {
    // 初始加载
    fetchStatistics();

    // 每30秒刷新一次告警统计
    const interval = setInterval(fetchStatistics, 30000);

    return () => clearInterval(interval);
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refresh: fetchStatistics,
    lastUpdated,
  };
}
