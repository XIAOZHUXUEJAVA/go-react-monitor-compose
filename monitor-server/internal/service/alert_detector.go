package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"

	"monitor-server/internal/repository"
)

// AlertDetector 告警检测器
type AlertDetector struct {
	db           *gorm.DB
	alertService *AlertService
	monitorService MonitorService
	metricsRepo  repository.MetricsRepository
	ticker       *time.Ticker
	stopCh       chan struct{}
	running      bool
}

// NewAlertDetector 创建告警检测器
func NewAlertDetector(db *gorm.DB, monitorService MonitorService) *AlertDetector {
	return &AlertDetector{
		db:             db,
		alertService:   NewAlertService(db),
		monitorService: monitorService,
		metricsRepo:    repository.NewMetricsRepository(db),
		stopCh:         make(chan struct{}),
	}
}

// Start 启动告警检测
func (d *AlertDetector) Start(ctx context.Context, interval time.Duration) {
	if d.running {
		log.Println("Alert detector is already running")
		return
	}

	d.running = true
	d.ticker = time.NewTicker(interval)

	log.Printf("Starting alert detector with interval: %v", interval)

	go func() {
		defer func() {
			d.ticker.Stop()
			d.running = false
			log.Println("Alert detector stopped")
		}()

		// 立即执行一次检测
		d.checkAlerts()

		for {
			select {
			case <-ctx.Done():
				log.Println("Alert detector context cancelled")
				return
			case <-d.stopCh:
				log.Println("Alert detector stop signal received")
				return
			case <-d.ticker.C:
				d.checkAlerts()
			}
		}
	}()
}

// Stop 停止告警检测
func (d *AlertDetector) Stop() {
	if !d.running {
		return
	}

	close(d.stopCh)
}

// checkAlerts 执行告警检测
func (d *AlertDetector) checkAlerts() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Alert detection panic recovered: %v", r)
		}
	}()

	// 获取当前系统监控数据
	monitoringData, err := d.getCurrentMonitoringData()
	if err != nil {
		log.Printf("Failed to get current monitoring data: %v", err)
		return
	}

	// 执行告警检测
	if err := d.alertService.CheckAlerts(*monitoringData); err != nil {
		log.Printf("Failed to check alerts: %v", err)
		return
	}

	log.Printf("Alert detection completed - CPU: %.1f%%, Memory: %.1f%%, Disk: %.1f%%", 
		monitoringData.CPU, monitoringData.Memory, monitoringData.Disk)
}

// getCurrentMonitoringData 获取当前监控数据
func (d *AlertDetector) getCurrentMonitoringData() (*MonitoringData, error) {
	ctx := context.Background()
	
	// 获取CPU数据
	cpuData, err := d.monitorService.GetCPUData(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get CPU data: %w", err)
	}

	// 获取内存数据
	memoryData, err := d.monitorService.GetMemoryData(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get memory data: %w", err)
	}

	// 获取磁盘数据
	diskData, err := d.monitorService.GetDiskData(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get disk data: %w", err)
	}

	// 计算平均磁盘使用率
	var totalDiskUsage float64
	if len(diskData.Disks) > 0 {
		for _, disk := range diskData.Disks {
			totalDiskUsage += disk.UsagePercent
		}
		totalDiskUsage = totalDiskUsage / float64(len(diskData.Disks))
	}

	return &MonitoringData{
		CPU:    cpuData.Usage,
		Memory: memoryData.UsagePercent,
		Disk:   totalDiskUsage,
	}, nil
}

// GetStatus 获取检测器状态
func (d *AlertDetector) GetStatus() map[string]interface{} {
	return map[string]interface{}{
		"running":     d.running,
		"last_check":  time.Now().Format("2006-01-02 15:04:05"),
	}
}

// AlertDetectorManager 告警检测器管理器
type AlertDetectorManager struct {
	detector *AlertDetector
	ctx      context.Context
	cancel   context.CancelFunc
}

// NewAlertDetectorManager 创建告警检测器管理器
func NewAlertDetectorManager(db *gorm.DB, monitorService MonitorService) *AlertDetectorManager {
	ctx, cancel := context.WithCancel(context.Background())
	return &AlertDetectorManager{
		detector: NewAlertDetector(db, monitorService),
		ctx:      ctx,
		cancel:   cancel,
	}
}

// Start 启动管理器
func (m *AlertDetectorManager) Start() {
	// 默认每30秒检测一次
	interval := 30 * time.Second
	
	// 从配置中读取检测间隔（如果有的话）
	configRepo := repository.NewConfigRepository(m.detector.db)
	if config, err := configRepo.GetByKey("alert_check_interval"); err == nil {
		if config.Value != "" {
			if duration, err := time.ParseDuration(config.Value + "s"); err == nil {
				interval = duration
			}
		}
	}

	m.detector.Start(m.ctx, interval)
	log.Printf("Alert detector manager started with interval: %v", interval)
}

// Stop 停止管理器
func (m *AlertDetectorManager) Stop() {
	m.cancel()
	m.detector.Stop()
	log.Println("Alert detector manager stopped")
}

// GetStatus 获取状态
func (m *AlertDetectorManager) GetStatus() map[string]interface{} {
	return m.detector.GetStatus()
}