// 告警规则相关类型定义
export interface AlertRule {
  id: number;
  name: string;
  metric_type: "cpu" | "memory" | "disk" | "network";
  operator: ">" | "<" | ">=" | "<=" | "==";
  threshold: number;
  duration: number; // 持续时间（秒）
  severity: "info" | "warning" | "critical";
  enabled: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

// 更新阈值请求
export interface UpdateThresholdRequest {
  threshold: number;
}

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

// 通用API调用函数
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    console.log(`Making API call to: ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Response data:", data);
    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// 获取所有告警规则
export async function getAlertRules(): Promise<AlertRule[]> {
  return apiCall<AlertRule[]>("/api/v1/alert-rules");
}

// 更新告警规则阈值
export async function updateAlertRuleThreshold(
  metricType: string,
  severity: string,
  threshold: number
): Promise<AlertRule> {
  return apiCall<AlertRule>(
    `/api/v1/alert-rules/${metricType}/${severity}/threshold`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ threshold }),
    }
  );
}

// 辅助函数：获取特定类型和严重级别的告警规则
export function getAlertRuleByTypeAndSeverity(
  rules: AlertRule[],
  metricType: string,
  severity: string
): AlertRule | undefined {
  return rules.find(
    (rule) => rule.metric_type === metricType && rule.severity === severity
  );
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}分钟`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  }
}
