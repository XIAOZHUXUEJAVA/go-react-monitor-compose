// 现代化图表主题配置
export const modernChartTheme = {
  // 渐变色定义
  gradients: {
    cpu: {
      from: '#6366f1', // indigo-500
      to: '#8b5cf6',   // violet-500
    },
    memory: {
      from: '#ec4899', // pink-500
      to: '#f59e0b',   // amber-500
    },
    disk: {
      from: '#f97316', // orange-500
      to: '#ef4444',   // red-500
    },
    network: {
      from: '#06b6d4', // cyan-500
      to: '#3b82f6',   // blue-500
    },
    success: {
      from: '#10b981', // emerald-500
      to: '#22c55e',   // green-500
    },
    warning: {
      from: '#f59e0b', // amber-500
      to: '#eab308',   // yellow-500
    },
    danger: {
      from: '#ef4444', // red-500
      to: '#dc2626',   // red-600
    }
  },
  
  // 颜色方案
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    gray: '#6b7280',
    light: '#f8fafc',
    dark: '#1e293b',
  },
  
  // 图表样式
  chart: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
    },
    borderRadius: 8,
    strokeWidth: {
      thin: 1.5,
      normal: 2,
      thick: 3,
    },
    shadow: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    },
    animation: {
      duration: 750,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
  },
  
  // 网格样式
  grid: {
    strokeDasharray: '3 3',
    stroke: 'currentColor',
    opacity: 0.1,
  },
  
  // 坐标轴样式
  axis: {
    stroke: 'currentColor',
    opacity: 0.3,
    fontSize: 12,
    fontWeight: 500,
  },
  
  // 工具提示样式
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    fontSize: 12,
    fontWeight: 500,
  }
};

// 创建CSS渐变字符串
export const createGradient = (gradient: { from: string; to: string }, direction = 'to bottom right') => {
  return `linear-gradient(${direction}, ${gradient.from}, ${gradient.to})`;
};

// 获取状态颜色
export const getStatusGradient = (value: number, thresholds = { warning: 70, danger: 90 }) => {
  if (value >= thresholds.danger) {
    return modernChartTheme.gradients.danger;
  } else if (value >= thresholds.warning) {
    return modernChartTheme.gradients.warning;
  } else {
    return modernChartTheme.gradients.success;
  }
};

// 获取图表配置
export const getChartConfig = (isDark = false) => ({
  margin: { top: 20, right: 20, bottom: 20, left: 20 },
  style: {
    fontFamily: modernChartTheme.chart.fontFamily,
  },
  grid: {
    ...modernChartTheme.grid,
    stroke: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  },
  axis: {
    ...modernChartTheme.axis,
    stroke: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
  },
  tooltip: {
    ...modernChartTheme.tooltip,
    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
    color: isDark ? '#ffffff' : '#000000',
  }
});