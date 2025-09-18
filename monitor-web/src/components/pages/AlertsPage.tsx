"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getAlertRules, AlertRule, formatDuration } from "@/lib/alert-api";
import {
  formatMetricType,
  formatSeverity,
  formatAlertStatus,
  formatDateTime,
  getRelativeTime,
} from "@/lib/alert-management-api";
import { useAlertManagementStore } from "@/store/alert-management-store";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Settings,
  Filter,
  Search,
  Clock,
  RefreshCw,
} from "lucide-react";

export function AlertsPage() {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 使用统一的告警管理状态
  const {
    statistics: alertStatistics,
    alerts,
    loadingStatistics: loadingStats,
    loadingAlerts,
    error,
    fetchAll,
    handleResolveAlert,
    handleAcknowledgeAlert,
    refresh,
  } = useAlertManagementStore();

  // 加载告警规则
  const loadAlertRules = async () => {
    try {
      setLoadingRules(true);
      const rules = await getAlertRules();
      setAlertRules(rules);
    } catch (error) {
      console.error("Failed to load alert rules:", error);
    } finally {
      setLoadingRules(false);
    }
  };

  // 刷新所有数据
  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), loadAlertRules()]);
    setRefreshing(false);
  };

  // 初始化数据加载
  useEffect(() => {
    fetchAll();
    loadAlertRules();
  }, [fetchAll]);

  // 处理告警确认
  const onAcknowledgeAlert = async (alertId: number) => {
    try {
      await handleAcknowledgeAlert(alertId, "用户手动确认");
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  // 处理告警解决
  const onResolveAlert = async (alertId: number) => {
    try {
      await handleResolveAlert(alertId, "用户手动解决");
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "info":
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertBadge = (severity: string, status: string) => {
    if (status === "resolved") {
      return <Badge variant="secondary">已解决</Badge>;
    }
    if (status === "acknowledged") {
      return <Badge variant="outline">已确认</Badge>;
    }

    switch (severity) {
      case "critical":
        return <Badge variant="destructive">严重</Badge>;
      case "warning":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">警告</Badge>
        );
      case "info":
        return <Badge variant="outline">信息</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const activeAlertsCount = alertStatistics?.active_alerts || 0;
  const totalAlertsCount = alertStatistics?.total_alerts || 0;

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400">
            监控系统告警和通知 · 共 {totalAlertsCount} 条告警，
            {activeAlertsCount} 条待处理
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            刷新
          </Button>
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            搜索
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            筛选
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            配置
          </Button>
        </div>
      </div>

      {/* 告警统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="monitor-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  总告警数
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loadingStats ? "..." : alertStatistics?.total_alerts || 0}
                </p>
              </div>
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="monitor-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  严重告警
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {loadingStats ? "..." : alertStatistics?.critical_alerts || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="monitor-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  警告告警
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {loadingStats ? "..." : alertStatistics?.warning_alerts || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="monitor-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  今日已解决
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {loadingStats ? "..." : alertStatistics?.resolved_today || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 告警列表 */}
      <Card className="monitor-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            告警列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAlerts ? (
            <div className="text-center py-8">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                加载告警列表中...
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <span className="text-sm text-red-600">加载失败: {error}</span>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${
                    alert.status === "resolved"
                      ? "bg-gray-50 dark:bg-gray-800/50 opacity-75"
                      : "bg-white dark:bg-gray-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getAlertIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {formatMetricType(alert.metric_type)}告警
                          </h4>
                          {getAlertBadge(alert.severity, alert.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(alert.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <span>主机: {alert.host_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>持续: {alert.duration}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.status === "active" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAcknowledgeAlert(alert.id)}
                          >
                            确认
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onResolveAlert(alert.id)}
                          >
                            解决
                          </Button>
                        </>
                      )}
                      {alert.status === "acknowledged" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onResolveAlert(alert.id)}
                        >
                          解决
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        详情
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {alerts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    暂无告警记录
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 告警规则配置 */}
      <Card className="monitor-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            告警规则
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRules ? (
            <div className="text-center py-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                加载告警规则中...
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {alertRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{rule.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {rule.metric_type.toUpperCase()}使用率{rule.operator}
                      {rule.threshold}%持续{formatDuration(rule.duration)}时触发
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      本机告警规则
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        rule.severity === "critical"
                          ? "destructive"
                          : rule.severity === "warning"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {rule.severity === "critical"
                        ? "严重"
                        : rule.severity === "warning"
                        ? "警告"
                        : "信息"}
                    </Badge>
                    <Badge variant={rule.enabled ? "outline" : "secondary"}>
                      {rule.enabled ? "启用" : "禁用"}
                    </Badge>
                  </div>
                </div>
              ))}

              {alertRules.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    暂无告警规则
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
