package model

import "time"

// CpuData represents CPU monitoring data
type CpuData struct {
	Usage       float64     `json:"usage"`
	Cores       int         `json:"cores"`
	Frequency   float64     `json:"frequency"`
	Temperature *float64    `json:"temperature,omitempty"`
	Model       string      `json:"model"`
	History     []CpuUsage  `json:"history"`
}

// CpuUsage represents historical CPU usage data
type CpuUsage struct {
	Timestamp time.Time `json:"timestamp"`
	Usage     float64   `json:"usage"`
}

// MemoryData represents memory monitoring data
type MemoryData struct {
	Total         float64       `json:"total"`
	Used          float64       `json:"used"`
	Free          float64       `json:"free"`
	Available     float64       `json:"available"`
	UsagePercent  float64       `json:"usage_percent"`
	SwapTotal     float64       `json:"swap_total"`
	SwapUsed      float64       `json:"swap_used"`
	History       []MemoryUsage `json:"history"`
}

// MemoryUsage represents historical memory usage data
type MemoryUsage struct {
	Timestamp    time.Time `json:"timestamp"`
	UsagePercent float64   `json:"usage_percent"`
	Used         float64   `json:"used"`
}

// DiskData represents disk monitoring data
type DiskData struct {
	Disks         []DiskInfo `json:"disks"`
	TotalCapacity float64    `json:"total_capacity"`
	TotalUsed     float64    `json:"total_used"`
	TotalFree     float64    `json:"total_free"`
}

// DiskInfo represents individual disk information
type DiskInfo struct {
	Device       string  `json:"device"`
	MountPoint   string  `json:"mount_point"`
	Filesystem   string  `json:"filesystem"`
	Total        float64 `json:"total"`
	Used         float64 `json:"used"`
	Free         float64 `json:"free"`
	UsagePercent float64 `json:"usage_percent"`
}

// NetworkData represents network monitoring data
type NetworkData struct {
	Interfaces     []NetworkInterface `json:"interfaces"`
	TotalBytesSent uint64             `json:"total_bytes_sent"`
	TotalBytesRecv uint64             `json:"total_bytes_recv"`
	History        []NetworkUsage     `json:"history"`
}

// NetworkInterface represents network interface information
type NetworkInterface struct {
	Name        string `json:"name"`
	BytesSent   uint64 `json:"bytes_sent"`
	BytesRecv   uint64 `json:"bytes_recv"`
	PacketsSent uint64 `json:"packets_sent"`
	PacketsRecv uint64 `json:"packets_recv"`
	Speed       uint64 `json:"speed"`
	IsUp        bool   `json:"is_up"`
}

// NetworkUsage represents historical network usage data
type NetworkUsage struct {
	Timestamp       time.Time `json:"timestamp"`
	BytesSentPerSec uint64    `json:"bytes_sent_per_sec"`
	BytesRecvPerSec uint64    `json:"bytes_recv_per_sec"`
}

// SystemInfo represents system information
type SystemInfo struct {
	Hostname    string    `json:"hostname"`
	Platform    string    `json:"platform"`
	OS          string    `json:"os"`
	Arch        string    `json:"arch"`
	Uptime      uint64    `json:"uptime"`
	BootTime    time.Time `json:"boot_time"`
	Processes   int       `json:"processes"`
	LoadAverage []float64 `json:"load_average"`
}

// ProcessData represents process monitoring data
type ProcessData struct {
	Processes         []ProcessInfo `json:"processes"`
	TotalProcesses    int           `json:"total_processes"`
	RunningProcesses  int           `json:"running_processes"`
	SleepingProcesses int           `json:"sleeping_processes"`
}

// ProcessInfo represents individual process information
type ProcessInfo struct {
	PID           int32     `json:"pid"`
	Name          string    `json:"name"`
	CPUPercent    float64   `json:"cpu_percent"`
	MemoryPercent float32   `json:"memory_percent"`
	MemoryMB      float64   `json:"memory_mb"`
	Status        string    `json:"status"`
	CreateTime    time.Time `json:"create_time"`
	Cmdline       string    `json:"cmdline"`
}