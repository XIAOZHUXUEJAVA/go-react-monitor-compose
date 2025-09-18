package repository

import (
	"time"

	"gorm.io/gorm"

	"monitor-server/internal/model"
)

// AlertRecordRepository 告警记录仓库接口
type AlertRecordRepository interface {
	// 告警记录管理
	CreateAlert(alert *model.Alert) error
	GetAlertByID(id uint) (*model.Alert, error)
	UpdateAlert(alert *model.Alert) error
	DeleteAlert(id uint) error
	
	// 告警查询
	GetAlerts(status string, limit, offset int) ([]model.Alert, error)
	GetAlertsByMetricType(metricType string, limit int) ([]model.Alert, error)
	GetActiveAlert(metricType, severity, hostname string) (*model.Alert, error)
	
	// 告警统计
	GetAlertStatistics() (*model.AlertStatistics, error)
	CountAlertsByStatus(status string) (int64, error)
	CountAlertsBySeverity(severity string) (int64, error)
	CountResolvedAlertsToday() (int64, error)
	
	// 告警历史
	CreateAlertHistory(history *model.AlertHistory) error
	GetAlertHistory(alertID uint) ([]model.AlertHistory, error)
	
	// 系统事件
	CreateSystemEvent(event *model.SystemEvent) error
	GetSystemEvents(limit, offset int) ([]model.SystemEvent, error)
}

// alertRecordRepository 告警记录仓库实现
type alertRecordRepository struct {
	db *gorm.DB
}

// NewAlertRecordRepository 创建告警记录仓库
func NewAlertRecordRepository(db *gorm.DB) AlertRecordRepository {
	return &alertRecordRepository{db: db}
}

// CreateAlert 创建告警记录
func (r *alertRecordRepository) CreateAlert(alert *model.Alert) error {
	return r.db.Create(alert).Error
}

// GetAlertByID 根据ID获取告警记录
func (r *alertRecordRepository) GetAlertByID(id uint) (*model.Alert, error) {
	var alert model.Alert
	err := r.db.First(&alert, id).Error
	if err != nil {
		return nil, err
	}
	return &alert, nil
}

// UpdateAlert 更新告警记录
func (r *alertRecordRepository) UpdateAlert(alert *model.Alert) error {
	return r.db.Save(alert).Error
}

// DeleteAlert 删除告警记录
func (r *alertRecordRepository) DeleteAlert(id uint) error {
	return r.db.Delete(&model.Alert{}, id).Error
}

// GetAlerts 获取告警列表
func (r *alertRecordRepository) GetAlerts(status string, limit, offset int) ([]model.Alert, error) {
	var alerts []model.Alert
	query := r.db.Model(&model.Alert{}).Order("created_at DESC")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	err := query.Find(&alerts).Error
	return alerts, err
}

// GetAlertsByMetricType 根据指标类型获取告警
func (r *alertRecordRepository) GetAlertsByMetricType(metricType string, limit int) ([]model.Alert, error) {
	var alerts []model.Alert
	query := r.db.Where("metric_type = ?", metricType).Order("created_at DESC")
	
	if limit > 0 {
		query = query.Limit(limit)
	}
	
	err := query.Find(&alerts).Error
	return alerts, err
}

// GetActiveAlert 获取活跃的告警
func (r *alertRecordRepository) GetActiveAlert(metricType, severity, hostname string) (*model.Alert, error) {
	var alert model.Alert
	err := r.db.Where("metric_type = ? AND severity = ? AND host_name = ? AND status = ?", 
		metricType, severity, hostname, "active").First(&alert).Error
	
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	
	return &alert, nil
}

// GetAlertStatistics 获取告警统计
func (r *alertRecordRepository) GetAlertStatistics() (*model.AlertStatistics, error) {
	stats := &model.AlertStatistics{}

	// 总告警数
	r.db.Model(&model.Alert{}).Count(&stats.TotalAlerts)

	// 活跃告警数
	r.db.Model(&model.Alert{}).Where("status = ?", "active").Count(&stats.ActiveAlerts)

	// 严重告警数
	r.db.Model(&model.Alert{}).Where("status = ? AND severity = ?", "active", "critical").Count(&stats.CriticalAlerts)

	// 警告告警数
	r.db.Model(&model.Alert{}).Where("status = ? AND severity = ?", "active", "warning").Count(&stats.WarningAlerts)

	// 已确认告警数
	r.db.Model(&model.Alert{}).Where("status = ?", "acknowledged").Count(&stats.AcknowledgedAlerts)

	// 今日已解决告警数
	today := time.Now().Truncate(24 * time.Hour)
	r.db.Model(&model.Alert{}).Where("status = ? AND updated_at >= ?", "resolved", today).Count(&stats.ResolvedToday)

	return stats, nil
}

// CountAlertsByStatus 按状态统计告警数量
func (r *alertRecordRepository) CountAlertsByStatus(status string) (int64, error) {
	var count int64
	err := r.db.Model(&model.Alert{}).Where("status = ?", status).Count(&count).Error
	return count, err
}

// CountAlertsBySeverity 按严重程度统计告警数量
func (r *alertRecordRepository) CountAlertsBySeverity(severity string) (int64, error) {
	var count int64
	err := r.db.Model(&model.Alert{}).Where("severity = ? AND status IN (?)", severity, []string{"active", "acknowledged"}).Count(&count).Error
	return count, err
}

// CountResolvedAlertsToday 统计今日已解决告警数量
func (r *alertRecordRepository) CountResolvedAlertsToday() (int64, error) {
	var count int64
	today := time.Now().Truncate(24 * time.Hour)
	err := r.db.Model(&model.Alert{}).Where("status = ? AND updated_at >= ?", "resolved", today).Count(&count).Error
	return count, err
}

// CreateAlertHistory 创建告警历史记录
func (r *alertRecordRepository) CreateAlertHistory(history *model.AlertHistory) error {
	return r.db.Create(history).Error
}

// GetAlertHistory 获取告警历史记录
func (r *alertRecordRepository) GetAlertHistory(alertID uint) ([]model.AlertHistory, error) {
	var histories []model.AlertHistory
	err := r.db.Where("alert_id = ?", alertID).Order("created_at DESC").Find(&histories).Error
	return histories, err
}

// CreateSystemEvent 创建系统事件
func (r *alertRecordRepository) CreateSystemEvent(event *model.SystemEvent) error {
	return r.db.Create(event).Error
}

// GetSystemEvents 获取系统事件列表
func (r *alertRecordRepository) GetSystemEvents(limit, offset int) ([]model.SystemEvent, error) {
	var events []model.SystemEvent
	query := r.db.Model(&model.SystemEvent{}).Order("created_at DESC")
	
	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}
	
	err := query.Find(&events).Error
	return events, err
}