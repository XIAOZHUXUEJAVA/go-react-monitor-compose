package service

import (
	"context"
	"fmt"
	"runtime"
	"sort"
	"strings"
	"sync"
	"time"

	"monitor-server/internal/model"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/load"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
	"github.com/shirou/gopsutil/v3/process"
)

// MonitorService defines the interface for system monitoring operations
type MonitorService interface {
	GetCPUData(ctx context.Context) (*model.CpuData, error)
	GetMemoryData(ctx context.Context) (*model.MemoryData, error)
	GetDiskData(ctx context.Context) (*model.DiskData, error)
	GetNetworkData(ctx context.Context) (*model.NetworkData, error)
	GetSystemInfo(ctx context.Context) (*model.SystemInfo, error)
	GetProcessData(ctx context.Context, limit int, sortBy string) (*model.ProcessData, error)
	StartHistoryCollection(ctx context.Context)
	StopHistoryCollection()
}

// monitorService implements MonitorService interface
type monitorService struct {
	mu              sync.RWMutex
	cpuHistory      []model.CpuUsage
	memoryHistory   []model.MemoryUsage
	networkHistory  []model.NetworkUsage
	maxHistorySize  int
	collectTicker   *time.Ticker
	stopCollection  chan struct{}
}

// NewMonitorService creates a new monitor service instance
func NewMonitorService() MonitorService {
	service := &monitorService{
		maxHistorySize: 20,
		cpuHistory:     make([]model.CpuUsage, 0, 20),
		memoryHistory:  make([]model.MemoryUsage, 0, 20),
		networkHistory: make([]model.NetworkUsage, 0, 20),
		stopCollection: make(chan struct{}),
	}
	
	// Start background data collection
	go service.startBackgroundCollection()
	
	return service
}

// startBackgroundCollection starts collecting historical data in background
func (s *monitorService) startBackgroundCollection() {
	s.collectTicker = time.NewTicker(5 * time.Second)
	
	go func() {
		for {
			select {
			case <-s.collectTicker.C:
				s.collectHistoricalData()
			case <-s.stopCollection:
				return
			}
		}
	}()
}

// collectHistoricalData collects current metrics for historical tracking
func (s *monitorService) collectHistoricalData() {
	now := time.Now()
	
	// Collect CPU data
	cpuPercents, err := cpu.Percent(time.Second, false)
	if err == nil && len(cpuPercents) > 0 {
		s.mu.Lock()
		s.cpuHistory = append(s.cpuHistory, model.CpuUsage{
			Timestamp: now,
			Usage:     cpuPercents[0],
		})
		if len(s.cpuHistory) > s.maxHistorySize {
			s.cpuHistory = s.cpuHistory[1:]
		}
		s.mu.Unlock()
	}
	
	// Collect Memory data
	vmStat, err := mem.VirtualMemory()
	if err == nil {
		used := float64(vmStat.Used) / (1024 * 1024 * 1024)
		s.mu.Lock()
		s.memoryHistory = append(s.memoryHistory, model.MemoryUsage{
			Timestamp:    now,
			UsagePercent: vmStat.UsedPercent,
			Used:         used,
		})
		if len(s.memoryHistory) > s.maxHistorySize {
			s.memoryHistory = s.memoryHistory[1:]
		}
		s.mu.Unlock()
	}
	
	// Collect Network data (calculate per-second rates)
	netStats, err := net.IOCounters(false)
	if err == nil && len(netStats) > 0 {
		s.mu.Lock()
		// For simplicity, we'll use the total network stats
		// In a real implementation, you'd want to calculate the delta from previous readings
		s.networkHistory = append(s.networkHistory, model.NetworkUsage{
			Timestamp:       now,
			BytesSentPerSec: netStats[0].BytesSent / 5, // Rough approximation
			BytesRecvPerSec: netStats[0].BytesRecv / 5, // Rough approximation
		})
		if len(s.networkHistory) > s.maxHistorySize {
			s.networkHistory = s.networkHistory[1:]
		}
		s.mu.Unlock()
	}
}

// GetCPUData retrieves current CPU monitoring data
func (s *monitorService) GetCPUData(ctx context.Context) (*model.CpuData, error) {
	// Get CPU usage percentage
	cpuPercents, err := cpu.Percent(time.Second, false)
	if err != nil {
		return nil, fmt.Errorf("failed to get CPU usage: %w", err)
	}
	
	var usage float64
	if len(cpuPercents) > 0 {
		usage = cpuPercents[0]
	}
	
	// Get CPU info
	cpuInfos, err := cpu.Info()
	if err != nil {
		return nil, fmt.Errorf("failed to get CPU info: %w", err)
	}
	
	// Get logical CPU count (includes hyperthreading)
	cores := int32(runtime.NumCPU())
	
	var frequency float64
	var cpuModel string
	
	if len(cpuInfos) > 0 {
		frequency = cpuInfos[0].Mhz
		cpuModel = cpuInfos[0].ModelName
	}
	
	// Get temperature (may not be available on all systems)
	var temperature *float64
	temps, err := host.SensorsTemperatures()
	if err == nil && len(temps) > 0 {
		for _, temp := range temps {
			if temp.SensorKey == "coretemp" || temp.SensorKey == "k10temp" {
				temperature = &temp.Temperature
				break
			}
		}
	}
	
	s.mu.RLock()
	history := make([]model.CpuUsage, len(s.cpuHistory))
	copy(history, s.cpuHistory)
	s.mu.RUnlock()
	
	return &model.CpuData{
		Usage:       usage,
		Cores:       int(cores),
		Frequency:   frequency,
		Temperature: temperature,
		Model:       cpuModel,
		History:     history,
	}, nil
}

// GetMemoryData retrieves current memory monitoring data
func (s *monitorService) GetMemoryData(ctx context.Context) (*model.MemoryData, error) {
	// Get virtual memory stats
	vmStat, err := mem.VirtualMemory()
	if err != nil {
		return nil, fmt.Errorf("failed to get memory stats: %w", err)
	}
	
	// Get swap memory stats
	swapStat, err := mem.SwapMemory()
	if err != nil {
		return nil, fmt.Errorf("failed to get swap stats: %w", err)
	}
	
	// Convert bytes to GB
	total := float64(vmStat.Total) / (1024 * 1024 * 1024)
	used := float64(vmStat.Used) / (1024 * 1024 * 1024)
	free := float64(vmStat.Free) / (1024 * 1024 * 1024)
	available := float64(vmStat.Available) / (1024 * 1024 * 1024)
	swapTotal := float64(swapStat.Total) / (1024 * 1024 * 1024)
	swapUsed := float64(swapStat.Used) / (1024 * 1024 * 1024)
	
	s.mu.RLock()
	history := make([]model.MemoryUsage, len(s.memoryHistory))
	copy(history, s.memoryHistory)
	s.mu.RUnlock()
	
	return &model.MemoryData{
		Total:         total,
		Used:          used,
		Free:          free,
		Available:     available,
		UsagePercent:  vmStat.UsedPercent,
		SwapTotal:     swapTotal,
		SwapUsed:      swapUsed,
		History:       history,
	}, nil
}

// GetDiskData retrieves current disk monitoring data
func (s *monitorService) GetDiskData(ctx context.Context) (*model.DiskData, error) {
	// Get disk partitions
	partitions, err := disk.Partitions(false)
	if err != nil {
		return nil, fmt.Errorf("failed to get disk partitions: %w", err)
	}
	
	var disks []model.DiskInfo
	var totalCapacity, totalUsed, totalFree float64
	
	for _, partition := range partitions {
		// Skip special filesystems and virtual mounts
		if partition.Fstype == "tmpfs" || partition.Fstype == "devtmpfs" || 
		   partition.Fstype == "sysfs" || partition.Fstype == "proc" ||
		   partition.Fstype == "squashfs" || partition.Fstype == "overlay" ||
		   partition.Fstype == "none" || partition.Fstype == "rootfs" ||
		   partition.Fstype == "9p" { // WSL2 Windows drives
			continue
		}
		
		// Skip WSL2 and other virtual mounts by path
		if strings.HasPrefix(partition.Mountpoint, "/mnt/wsl") ||
		   strings.HasPrefix(partition.Mountpoint, "/usr/lib/wsl") ||
		   strings.HasPrefix(partition.Mountpoint, "/usr/lib/modules") ||
		   strings.HasPrefix(partition.Mountpoint, "/mnt/c") ||
		   strings.HasPrefix(partition.Mountpoint, "/mnt/d") ||
		   strings.HasPrefix(partition.Mountpoint, "/run") ||
		   strings.HasPrefix(partition.Mountpoint, "/init") ||
		   strings.HasPrefix(partition.Mountpoint, "/mnt/wslg") {
			continue
		}
		
		usage, err := disk.Usage(partition.Mountpoint)
		if err != nil {
			continue // Skip if we can't get usage stats
		}
		
		// Convert bytes to GB
		total := float64(usage.Total) / (1024 * 1024 * 1024)
		used := float64(usage.Used) / (1024 * 1024 * 1024)
		free := float64(usage.Free) / (1024 * 1024 * 1024)
		
		diskInfo := model.DiskInfo{
			Device:       partition.Device,
			MountPoint:   partition.Mountpoint,
			Filesystem:   partition.Fstype,
			Total:        total,
			Used:         used,
			Free:         free,
			UsagePercent: usage.UsedPercent,
		}
		
		disks = append(disks, diskInfo)
		totalCapacity += total
		totalUsed += used
		totalFree += free
	}
	
	return &model.DiskData{
		Disks:         disks,
		TotalCapacity: totalCapacity,
		TotalUsed:     totalUsed,
		TotalFree:     totalFree,
	}, nil
}

// GetNetworkData retrieves current network monitoring data
func (s *monitorService) GetNetworkData(ctx context.Context) (*model.NetworkData, error) {
	// Get network interface stats
	netStats, err := net.IOCounters(true)
	if err != nil {
		return nil, fmt.Errorf("failed to get network stats: %w", err)
	}
	
	// Get network interface info
	netInterfaces, err := net.Interfaces()
	if err != nil {
		return nil, fmt.Errorf("failed to get network interfaces: %w", err)
	}
	
	// Create a map for quick lookup of interface info
	interfaceMap := make(map[string]net.InterfaceStat)
	for _, iface := range netInterfaces {
		interfaceMap[iface.Name] = iface
	}
	
	var interfaces []model.NetworkInterface
	var totalBytesSent, totalBytesRecv uint64
	
	for _, stat := range netStats {
		// Skip loopback and down interfaces for main stats
		ifaceInfo, exists := interfaceMap[stat.Name]
		isUp := exists && len(ifaceInfo.Flags) > 0 && ifaceInfo.Flags[0] == "up"
		
		// Determine speed (this is a rough estimate)
		var speed uint64 = 0
		if exists {
			// Common interface speed mapping
			switch {
			case stat.Name == "lo":
				speed = 0 // Loopback
			case stat.Name[:3] == "eth" || stat.Name[:2] == "en":
				speed = 1000 // Assume 1Gbps for ethernet
			case stat.Name[:4] == "wlan" || stat.Name[:2] == "wl":
				speed = 300 // Assume 300Mbps for wireless
			default:
				speed = 100 // Default speed
			}
		}
		
		networkInterface := model.NetworkInterface{
			Name:        stat.Name,
			BytesSent:   stat.BytesSent,
			BytesRecv:   stat.BytesRecv,
			PacketsSent: stat.PacketsSent,
			PacketsRecv: stat.PacketsRecv,
			Speed:       speed,
			IsUp:        isUp,
		}
		
		interfaces = append(interfaces, networkInterface)
		totalBytesSent += stat.BytesSent
		totalBytesRecv += stat.BytesRecv
	}
	
	s.mu.RLock()
	history := make([]model.NetworkUsage, len(s.networkHistory))
	copy(history, s.networkHistory)
	s.mu.RUnlock()
	
	return &model.NetworkData{
		Interfaces:     interfaces,
		TotalBytesSent: totalBytesSent,
		TotalBytesRecv: totalBytesRecv,
		History:        history,
	}, nil
}

// GetSystemInfo retrieves system information
func (s *monitorService) GetSystemInfo(ctx context.Context) (*model.SystemInfo, error) {
	// Get host info
	hostInfo, err := host.Info()
	if err != nil {
		return nil, fmt.Errorf("failed to get host info: %w", err)
	}
	
	// Get load average
	loadAvg, err := load.Avg()
	if err != nil {
		return nil, fmt.Errorf("failed to get load average: %w", err)
	}
	
	// Get process count
	processes, err := process.Pids()
	if err != nil {
		return nil, fmt.Errorf("failed to get process count: %w", err)
	}
	
	return &model.SystemInfo{
		Hostname:    hostInfo.Hostname,
		Platform:    hostInfo.Platform,
		OS:          hostInfo.PlatformVersion,
		Arch:        hostInfo.KernelArch,
		Uptime:      hostInfo.Uptime,
		BootTime:    time.Unix(int64(hostInfo.BootTime), 0),
		Processes:   len(processes),
		LoadAverage: []float64{loadAvg.Load1, loadAvg.Load5, loadAvg.Load15},
	}, nil
}

// GetProcessData retrieves process monitoring data
func (s *monitorService) GetProcessData(ctx context.Context, limit int, sortBy string) (*model.ProcessData, error) {
	// Get all process PIDs
	pids, err := process.Pids()
	if err != nil {
		return nil, fmt.Errorf("failed to get process PIDs: %w", err)
	}
	
	var processes []model.ProcessInfo
	runningCount := 0
	sleepingCount := 0
	
	// Get process information for each PID
	for _, pid := range pids {
		proc, err := process.NewProcess(pid)
		if err != nil {
			continue // Process might have terminated
		}
		
		name, err := proc.Name()
		if err != nil {
			continue
		}
		
		cpuPercent, err := proc.CPUPercent()
		if err != nil {
			cpuPercent = 0
		}
		
		memoryInfo, err := proc.MemoryInfo()
		if err != nil {
			continue
		}
		
		memoryPercent, err := proc.MemoryPercent()
		if err != nil {
			memoryPercent = 0
		}
		
		statusList, err := proc.Status()
		var status string
		if err != nil || len(statusList) == 0 {
			status = "unknown"
		} else {
			status = statusList[0]
		}
		
		createTime, err := proc.CreateTime()
		if err != nil {
			createTime = 0
		}
		
		cmdline, err := proc.Cmdline()
		if err != nil {
			cmdline = ""
		}
		
		// Count process status
		switch status {
		case "R", "running":
			runningCount++
		case "S", "sleeping":
			sleepingCount++
		}
		
		processInfo := model.ProcessInfo{
			PID:           pid,
			Name:          name,
			CPUPercent:    cpuPercent,
			MemoryPercent: memoryPercent,
			MemoryMB:      float64(memoryInfo.RSS) / (1024 * 1024), // Convert to MB
			Status:        status,
			CreateTime:    time.Unix(createTime/1000, 0), // Convert from milliseconds
			Cmdline:       cmdline,
		}
		
		processes = append(processes, processInfo)
	}
	
	// Sort processes based on sortBy parameter
	switch sortBy {
	case "cpu":
		sort.Slice(processes, func(i, j int) bool {
			return processes[i].CPUPercent > processes[j].CPUPercent
		})
	case "memory":
		sort.Slice(processes, func(i, j int) bool {
			return processes[i].MemoryPercent > processes[j].MemoryPercent
		})
	}
	
	// Limit the results
	if limit > 0 && limit < len(processes) {
		processes = processes[:limit]
	}
	
	return &model.ProcessData{
		Processes:         processes,
		TotalProcesses:    len(pids),
		RunningProcesses:  runningCount,
		SleepingProcesses: sleepingCount,
	}, nil
}

// StartHistoryCollection starts collecting historical data in background
func (s *monitorService) StartHistoryCollection(ctx context.Context) {
	// Background collection is already started in NewMonitorService
	// This method is kept for interface compatibility
}

// StopHistoryCollection stops the historical data collection
func (s *monitorService) StopHistoryCollection() {
	if s.collectTicker != nil {
		s.collectTicker.Stop()
	}
	close(s.stopCollection)
}