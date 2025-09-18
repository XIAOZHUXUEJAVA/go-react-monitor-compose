package model

import (
	"time"

	"gorm.io/gorm"
)

// BaseModel 基础模型，包含通用字段
type BaseModel struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// SystemMetrics 系统指标模型
type SystemMetrics struct {
	BaseModel
	Hostname     string    `gorm:"type:varchar(255);not null;index" json:"hostname"`
	CPUUsage     float64   `gorm:"type:decimal(5,2);not null" json:"cpu_usage"`
	MemoryUsage  float64   `gorm:"type:decimal(5,2);not null" json:"memory_usage"`
	MemoryTotal  uint64    `gorm:"not null" json:"memory_total"`
	MemoryUsed   uint64    `gorm:"not null" json:"memory_used"`
	DiskUsage    float64   `gorm:"type:decimal(5,2);not null" json:"disk_usage"`
	DiskTotal    uint64    `gorm:"not null" json:"disk_total"`
	DiskUsed     uint64    `gorm:"not null" json:"disk_used"`
	NetworkSent  uint64    `gorm:"not null" json:"network_sent"`
	NetworkRecv  uint64    `gorm:"not null" json:"network_recv"`
	Timestamp    time.Time `gorm:"not null;index" json:"timestamp"`
}

// SystemInfo 系统信息模型（用于数据库存储）
type SystemInfoDB struct {
	BaseModel
	Hostname        string `gorm:"type:varchar(255);not null;uniqueIndex" json:"hostname"`
	OS              string `gorm:"type:varchar(100);not null" json:"os"`
	Platform        string `gorm:"type:varchar(100);not null" json:"platform"`
	PlatformFamily  string `gorm:"type:varchar(100);not null" json:"platform_family"`
	PlatformVersion string `gorm:"type:varchar(100);not null" json:"platform_version"`
	KernelVersion   string `gorm:"type:varchar(100);not null" json:"kernel_version"`
	KernelArch      string `gorm:"type:varchar(50);not null" json:"kernel_arch"`
	CPUCores        int    `gorm:"not null" json:"cpu_cores"`
	CPUModel        string `gorm:"type:text" json:"cpu_model"`
	TotalMemory     uint64 `gorm:"not null" json:"total_memory"`
	Uptime          uint64 `gorm:"not null" json:"uptime"`
	LastSeen        time.Time `gorm:"not null" json:"last_seen"`
}

// AlertRule 告警规则模型
type AlertRule struct {
	BaseModel
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`
	MetricType  string    `gorm:"type:varchar(100);not null;index" json:"metric_type"` // cpu, memory, disk, network
	Operator    string    `gorm:"type:varchar(10);not null" json:"operator"`           // >, <, >=, <=, ==
	Threshold   float64   `gorm:"type:decimal(10,2);not null" json:"threshold"`
	Duration    int       `gorm:"not null" json:"duration"`     // 持续时间（秒）
	Severity    string    `gorm:"type:varchar(50);not null" json:"severity"` // info, warning, critical
	Enabled     bool      `gorm:"not null;default:true" json:"enabled"`
	Description string    `gorm:"type:text" json:"description"`
}



// MonitoringConfig 监控配置模型
type MonitoringConfig struct {
	BaseModel
	Key         string `gorm:"type:varchar(255);not null;uniqueIndex" json:"key"`
	Value       string `gorm:"type:text;not null" json:"value"`
	Type        string `gorm:"type:varchar(50);not null" json:"type"`        // string, int, float, bool, json
	Category    string `gorm:"type:varchar(100);not null;index" json:"category"` // system, alert, dashboard
	Description string `gorm:"type:text" json:"description"`
	Editable    bool   `gorm:"not null;default:true" json:"editable"`
}



// TableName 设置表名
func (SystemMetrics) TableName() string {
	return "system_metrics"
}

func (SystemInfoDB) TableName() string {
	return "system_info"
}

func (AlertRule) TableName() string {
	return "alert_rules"
}

func (Alert) TableName() string {
	return "alerts"
}

func (MonitoringConfig) TableName() string {
	return "monitoring_configs"
}

