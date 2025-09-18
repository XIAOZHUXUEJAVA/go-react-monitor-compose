// 告警管理API

export interface AlertStatistics {
  total_alerts: number;
  active_alerts: number;
  critical_alerts: number;
  warning_alerts: number;
  resolved_today: number;
  acknowledged_alerts: number;
}

export interface AlertSummary {
  id: number;
  metric_type: string;
  severity: string;
  value: number;
  threshold: number;
  status: string;
  message: string;
  host_name: string;
  created_at: string;
  duration: string;
}

export interface AlertDetail {
  id: number;
  metric_type: string;
  severity: string;
  value: number;
  threshold: number;
  status: string;
  message: string;
  description: string;
  host_name: string;
  created_at: string;
  updated_at: string;
}

export interface AlertHistory {
  id: number;
  alert_id: number;
  action: string;
  message: string;
  user_id?: number;
  created_at: string;
}

export interface SystemEvent {
  id: number;
  event_type: string;
  severity: string;
  message: string;
  description: string;
  source: string;
  host_name: string;
  metadata?: string;
  created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

// 获取告警统计
export async function getAlertStatistics(): Promise<AlertStatistics> {
  const response = await fetch(`${API_BASE_URL}/api/v1/alerts/statistics`);
  if (!response.ok) {
    throw new Error("Failed to fetch alert statistics");
  }
  return response.json();
}

// 获取告警列表
export async function getAlerts(
  status?: string,
  limit: number = 20,
  offset: number = 0
): Promise<AlertSummary[]> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  const response = await fetch(`${API_BASE_URL}/api/v1/alerts?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch alerts");
  }
  return response.json();
}

// 获取告警详情
export async function getAlertById(id: number): Promise<AlertDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/alerts/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch alert details");
  }
  return response.json();
}

// 确认告警
export async function acknowledgeAlert(
  id: number,
  message?: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/alerts/${id}/acknowledge`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: message || "告警已确认" }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to acknowledge alert");
  }
}

// 解决告警
export async function resolveAlert(
  id: number,
  message?: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/alerts/${id}/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: message || "告警已手动解决" }),
  });

  if (!response.ok) {
    throw new Error("Failed to resolve alert");
  }
}

// 获取告警历史
export async function getAlertHistory(id: number): Promise<AlertHistory[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/alerts/${id}/history`);
  if (!response.ok) {
    throw new Error("Failed to fetch alert history");
  }
  return response.json();
}

// 获取系统事件
export async function getSystemEvents(
  limit: number = 20,
  offset: number = 0
): Promise<SystemEvent[]> {
  const params = new URLSearchParams();
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  const response = await fetch(
    `${API_BASE_URL}/api/v1/system-events?${params}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch system events");
  }
  return response.json();
}

// 格式化告警类型显示名称
export function formatMetricType(metricType: string): string {
  const typeMap: { [key: string]: string } = {
    cpu: "CPU",
    memory: "内存",
    disk: "磁盘",
    network: "网络",
  };
  return typeMap[metricType] || metricType;
}

// 格式化严重程度显示名称
export function formatSeverity(severity: string): string {
  const severityMap: { [key: string]: string } = {
    critical: "严重",
    warning: "警告",
    info: "信息",
  };
  return severityMap[severity] || severity;
}

// 格式化告警状态显示名称
export function formatAlertStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    active: "活跃",
    acknowledged: "已确认",
    resolved: "已解决",
  };
  return statusMap[status] || status;
}

// 格式化时间显示
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// 计算相对时间
export function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "刚刚";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else {
    return `${diffDays}天前`;
  }
}
