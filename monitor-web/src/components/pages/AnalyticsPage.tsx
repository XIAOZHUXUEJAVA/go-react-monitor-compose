"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Download,
  Calendar,
  Filter,
  RefreshCw
} from "lucide-react";

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        {/* <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">数据分析</h2>
          <p className="text-gray-600 dark:text-gray-400">深入分析系统性能趋势和统计数据</p>
        </div> */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            时间范围
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            筛选
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      {/* 统计概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="monitor-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">平均CPU使用率</p>
                <p className="text-2xl font-bold text-blue-600">45.2%</p>
                <p className="text-xs text-green-600">↓ 较昨日降低 3.2%</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="monitor-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">平均内存使用率</p>
                <p className="text-2xl font-bold text-purple-600">67.8%</p>
                <p className="text-xs text-red-600">↑ 较昨日上升 1.5%</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <PieChart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="monitor-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">磁盘I/O峰值</p>
                <p className="text-2xl font-bold text-orange-600">89.1%</p>
                <p className="text-xs text-yellow-600">↔ 与昨日持平</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="monitor-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">网络流量</p>
                <p className="text-2xl font-bold text-green-600">2.4 GB</p>
                <p className="text-xs text-green-600">↑ 较昨日增加 12.3%</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <LineChart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 趋势分析图表占位 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="monitor-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              性能趋势分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">趋势图表开发中...</p>
                <Badge variant="outline" className="mt-2">即将推出</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="monitor-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              资源使用分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">分布图表开发中...</p>
                <Badge variant="outline" className="mt-2">即将推出</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细报告 */}
      <Card className="monitor-card">
        <CardHeader>
          <CardTitle>系统健康报告</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">系统运行稳定</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">CPU和内存使用率在正常范围内</p>
                </div>
              </div>
              <Badge variant="secondary">正常</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="font-medium">磁盘空间注意</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">建议定期清理临时文件</p>
                </div>
              </div>
              <Badge variant="outline">建议</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}