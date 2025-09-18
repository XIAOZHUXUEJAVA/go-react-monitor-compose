import { create } from "zustand";

// 告警规则接口
export interface AlertRule {
  id: number;
  metric_type: string;
  severity: string;
  threshold: number;
  enabled: boolean;
}

// 告警规则状态接口
interface AlertRulesState {
  alertRules: AlertRule[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;

  // 操作方法
  setAlertRules: (rules: AlertRule[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateRule: (metricType: string, severity: string, threshold: number) => void;
  fetchAlertRules: () => Promise<void>;
  triggerRefresh: () => void;
}

// 创建告警规则状态管理
export const useAlertRulesStore = create<AlertRulesState>((set, get) => ({
  alertRules: [],
  loading: false,
  error: null,
  lastUpdated: 0,

  setAlertRules: (rules) =>
    set({
      alertRules: rules,
      lastUpdated: Date.now(),
      error: null,
    }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  updateRule: (metricType, severity, threshold) =>
    set((state) => ({
      alertRules: state.alertRules.map((rule) =>
        rule.metric_type === metricType && rule.severity === severity
          ? { ...rule, threshold }
          : rule
      ),
      lastUpdated: Date.now(),
    })),

  fetchAlertRules: async () => {
    const { setLoading, setAlertRules, setError } = get();

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/v1/alert-rules");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rules = await response.json();
      setAlertRules(Array.isArray(rules) ? rules : []);

      console.log("Alert rules fetched:", rules);
    } catch (error) {
      console.error("Failed to fetch alert rules:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  },

  triggerRefresh: () => {
    get().fetchAlertRules();
  },
}));

// 获取特定指标的告警阈值的辅助函数
export const getAlertThresholds = (
  alertRules: AlertRule[],
  metricType: string
) => {
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

  return {
    warning: warningRule?.threshold || 80, // 默认值
    critical: criticalRule?.threshold || 90, // 默认值
  };
};
