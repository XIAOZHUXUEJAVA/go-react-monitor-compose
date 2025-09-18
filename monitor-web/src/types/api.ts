// API 响应基础类型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

// CPU 使用率数据
export interface CpuData {
  usage: number; // CPU 使用率百分比 (0-100)
  cores: number; // CPU 核心数
  frequency: number; // CPU 频率 (MHz)
  temperature?: number; // CPU 温度 (摄氏度)
  model: string; // CPU 型号
  history: Array<{
    timestamp: string;
    usage: number;
  }>; // 历史数据用于折线图
}

// 内存使用数据
export interface MemoryData {
  total: number; // 总内存 (GB)
  used: number; // 已使用内存 (GB)
  free: number; // 空闲内存 (GB)
  available: number; // 可用内存 (GB)
  usage_percent: number; // 使用率百分比 (0-100)
  swap_total: number; // 交换分区总大小 (GB)
  swap_used: number; // 交换分区已使用 (GB)
  history: Array<{
    timestamp: string;
    usage_percent: number;
    used: number;
  }>; // 历史数据
}

// 磁盘使用数据
export interface DiskData {
  disks: Array<{
    device: string; // 设备名称 (如 C:, D:, /dev/sda1)
    mount_point: string; // 挂载点
    filesystem: string; // 文件系统类型
    total: number; // 总容量 (GB)
    used: number; // 已使用 (GB)
    free: number; // 空闲空间 (GB)
    usage_percent: number; // 使用率百分比 (0-100)
  }>;
  total_capacity: number; // 总容量 (GB)
  total_used: number; // 总已使用 (GB)
  total_free: number; // 总空闲 (GB)
}

// 网络流量数据
export interface NetworkData {
  interfaces: Array<{
    name: string; // 网卡名称
    bytes_sent: number; // 发送字节数
    bytes_recv: number; // 接收字节数
    packets_sent: number; // 发送包数
    packets_recv: number; // 接收包数
    speed: number; // 网卡速度 (Mbps)
    is_up: boolean; // 是否启用
  }>;
  total_bytes_sent: number; // 总发送字节数
  total_bytes_recv: number; // 总接收字节数
  history: Array<{
    timestamp: string;
    bytes_sent_per_sec: number; // 每秒发送字节数
    bytes_recv_per_sec: number; // 每秒接收字节数
  }>; // 历史流量数据
}

// 系统信息
export interface SystemInfo {
  hostname: string; // 主机名
  platform: string; // 操作系统平台
  os: string; // 操作系统版本
  arch: string; // 系统架构
  uptime: number; // 系统运行时间 (秒)
  boot_time: string; // 启动时间
  processes: number; // 进程数量
  load_average: number[]; // 负载平均值 [1min, 5min, 15min]
}

// 进程信息
export interface ProcessData {
  processes: Array<{
    pid: number; // 进程ID
    name: string; // 进程名称
    cpu_percent: number; // CPU使用率
    memory_percent: number; // 内存使用率
    memory_mb: number; // 内存使用量 (MB)
    status: string; // 进程状态
    create_time: string; // 创建时间
    cmdline: string; // 命令行
  }>;
  total_processes: number; // 总进程数
  running_processes: number; // 运行中进程数
  sleeping_processes: number; // 睡眠进程数
}

// API 端点类型定义
export type ApiEndpoints = {
  "/api/cpu": CpuData;
  "/api/memory": MemoryData;
  "/api/disk": DiskData;
  "/api/network": NetworkData;
  "/api/system": SystemInfo;
  "/api/processes": ProcessData;
};
