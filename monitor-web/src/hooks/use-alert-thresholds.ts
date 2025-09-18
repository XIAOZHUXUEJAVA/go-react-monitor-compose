import { useState, useEffect, useCallback } from "react";

// 告警规则接口
interface AlertRule {
  id: number;
  metric_type: string;
  severity: string;
  threshold: number;
  enabled: boolean;
}

// 阈值配置接口
interface ThresholdConfig {
  warning: number;
  danger: number;
}

/**
 * 自定义Hook：获取告警规则阈值
 */
export function useAlertThresholds() {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取告警规则
  const fetchAlertRules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/alert-rules");
      if (response.ok) {
        const rules = await response.json();
        setAlertRules(Array.isArray(rules) ? rules : []);
      }
    } catch (error) {
      console.error("Failed to fetch alert rules:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlertRules();
  }, [fetchAlertRules]);

  // 获取特定指标的阈值配置
  const getThresholds = useCallback(
    (metricType: string): ThresholdConfig => {
      const warningRule = alertRules.find(
        (rule) =>
          rule.metric_type === metricType &&
          rule.severity === "warning" &&
          rule.enabled
      );
      const criticalRule = alertRules.find(
        (rule) =>
          rule.metric_type === metricType &&
          rule.severity === "critical" &&
          rule.enabled
      );

      // 默认值
      const defaults = {
        cpu: { warning: 70, danger: 90 },
        memory: { warning: 75, danger: 90 },
        disk: { warning: 80, danger: 95 },
      };

      const defaultConfig = defaults[metricType as keyof typeof defaults] || {
        warning: 80,
        danger: 90,
      };

      return {
        warning: warningRule?.threshold || defaultConfig.warning,
        danger: criticalRule?.threshold || defaultConfig.danger,
      };
    },
    [alertRules]
  );

  return {
    alertRules,
    loading,
    getThresholds,
    refetch: fetchAlertRules,
  };
}
