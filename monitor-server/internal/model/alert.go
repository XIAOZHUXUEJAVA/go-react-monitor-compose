package model

import (
	"time"

	"gorm.io/gorm"
)

// Alert 告警记录
type Alert struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	MetricType  string         `json:"metric_type" gorm:"size:50;not null;index"` // cpu, memory, disk, network
	Severity    string         `json:"severity" gorm:"size:20;not null;index"`    // warning, critical
	Value       float64        `json:"value" gorm:"not null"`                     // 当前值
	Threshold   float64        `json:"threshold" gorm:"not null"`                 // 触发阈值
	Status      string         `json:"status" gorm:"size:20;not null;index;default:'active'"` // active, acknowledged, resolved
	Message     string         `json:"message" gorm:"type:text"`                  // 告警消息
	Description string         `json:"description" gorm:"type:text"`              // 详细描述
	HostName    string         `json:"host_name" gorm:"size:100;index"`           // 主机名
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// AlertNotification 告警通知记录
type AlertNotification struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	AlertID   uint           `json:"alert_id" gorm:"not null;index"`
	Type      string         `json:"type" gorm:"size:20;not null"` // email, webhook, sms
	Target    string         `json:"target" gorm:"size:255"`       // 通知目标
	Status    string         `json:"status" gorm:"size:20;not null;default:'pending'"` // pending, sent, failed
	Message   string         `json:"message" gorm:"type:text"`
	SentAt    *time.Time     `json:"sent_at"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	Alert Alert `json:"alert" gorm:"foreignKey:AlertID"`
}

// AlertHistory 告警历史记录
type AlertHistory struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	AlertID   uint           `json:"alert_id" gorm:"not null;index"`
	Action    string         `json:"action" gorm:"size:50;not null"` // created, acknowledged, resolved, escalated
	Message   string         `json:"message" gorm:"type:text"`
	UserID    *uint          `json:"user_id" gorm:"index"` // 操作用户ID（如果有用户系统）
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	Alert Alert `json:"alert" gorm:"foreignKey:AlertID"`
}

// SystemEvent 系统事件记录
type SystemEvent struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	EventType   string         `json:"event_type" gorm:"size:50;not null;index"` // system_start, system_stop, high_load, etc.
	Severity    string         `json:"severity" gorm:"size:20;not null;index"`   // info, warning, error, critical
	Message     string         `json:"message" gorm:"type:text;not null"`
	Description string         `json:"description" gorm:"type:text"`
	Source      string         `json:"source" gorm:"size:100"`                   // 事件来源
	HostName    string         `json:"host_name" gorm:"size:100;index"`
	Metadata    string         `json:"metadata" gorm:"type:json"`                // 额外的元数据，JSON格式
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// AlertStatistics 告警统计
type AlertStatistics struct {
	TotalAlerts      int64 `json:"total_alerts"`
	ActiveAlerts     int64 `json:"active_alerts"`
	CriticalAlerts   int64 `json:"critical_alerts"`
	WarningAlerts    int64 `json:"warning_alerts"`
	ResolvedToday    int64 `json:"resolved_today"`
	AcknowledgedAlerts int64 `json:"acknowledged_alerts"`
}

// AlertSummary 告警摘要（用于列表显示）
type AlertSummary struct {
	ID          uint      `json:"id"`
	MetricType  string    `json:"metric_type"`
	Severity    string    `json:"severity"`
	Value       float64   `json:"value"`
	Threshold   float64   `json:"threshold"`
	Status      string    `json:"status"`
	Message     string    `json:"message"`
	HostName    string    `json:"host_name"`
	CreatedAt   time.Time `json:"created_at"`
	Duration    string    `json:"duration"` // 持续时间（计算得出）
}