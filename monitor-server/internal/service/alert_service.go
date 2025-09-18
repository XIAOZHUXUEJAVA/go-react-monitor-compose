package service

import (
	"fmt"
	"os"
	"time"

	"gorm.io/gorm"

	"monitor-server/internal/model"
	"monitor-server/internal/repository"
)

// AlertService 告警服务
type AlertService struct {
	db        *gorm.DB
	alertRepo repository.AlertRepository
}

// NewAlertService 创建告警服务
func NewAlertService(db *gorm.DB) *AlertService {
	return &AlertService{
		db:        db,
		alertRepo: repository.NewAlertRepository(db),
	}
}

// MonitoringData 监控数据结构
type MonitoringData struct {
	CPU    float64 `json:"cpu"`
	Memory float64 `json:"memory"`
	Disk   float64 `json:"disk"`
}

// CheckAlerts 检查告警条件
func (s *AlertService) CheckAlerts(data MonitoringData) error {
	// 获取所有告警规则
	rules, err := s.alertRepo.GetAllRules()
	if err != nil {
		return fmt.Errorf("failed to get alert rules: %w", err)
	}

	hostname, _ := os.Hostname()
	if hostname == "" {
		hostname = "localhost"
	}

	// 检查每个指标
	metrics := map[string]float64{
		"cpu":    data.CPU,
		"memory": data.Memory,
		"disk":   data.Disk,
	}

	for metricType, currentValue := range metrics {
		for _, rule := range rules {
			if rule.MetricType == metricType {
				// 检查是否超过阈值
				if currentValue >= rule.Threshold {
					// 检查是否已经存在活跃的告警
					existingAlert, err := s.getActiveAlert(metricType, rule.Severity, hostname)
					if err != nil {
						continue // 记录错误但继续处理其他告警
					}

					if existingAlert == nil {
						// 创建新告警
						alert := &model.Alert{
							MetricType:  metricType,
							Severity:    rule.Severity,
							Value:       currentValue,
							Threshold:   rule.Threshold,
							Status:      "active",
							Message:     s.generateAlertMessage(metricType, rule.Severity, currentValue, rule.Threshold),
							Description: s.generateAlertDescription(metricType, rule.Severity, currentValue, rule.Threshold),
							HostName:    hostname,
						}

						if err := s.createAlert(alert); err != nil {
							continue // 记录错误但继续处理
						}
					} else {
						// 更新现有告警的值
						existingAlert.Value = currentValue
						existingAlert.UpdatedAt = time.Now()
						if err := s.updateAlert(existingAlert); err != nil {
							continue
						}
					}
				} else {
					// 值正常，但不自动解决告警
					// 告警需要用户手动确认或解决
					// 这里可以记录指标已恢复正常的信息，但保持告警状态不变
					existingAlert, err := s.getActiveAlert(metricType, rule.Severity, hostname)
					if err != nil {
						continue
					}

					if existingAlert != nil {
						// 更新告警的当前值，但保持状态为 active
						existingAlert.Value = currentValue
						existingAlert.UpdatedAt = time.Now()
						// 可以添加一个字段来标记指标已恢复正常
						if err := s.updateAlert(existingAlert); err != nil {
							continue
						}
					}
				}
			}
		}
	}

	return nil
}

// getActiveAlert 获取活跃的告警
func (s *AlertService) getActiveAlert(metricType, severity, hostname string) (*model.Alert, error) {
	var alert model.Alert
	err := s.db.Where("metric_type = ? AND severity = ? AND host_name = ? AND status = ?", 
		metricType, severity, hostname, "active").First(&alert).Error
	
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	
	return &alert, nil
}

// createAlert 创建告警
func (s *AlertService) createAlert(alert *model.Alert) error {
	if err := s.db.Create(alert).Error; err != nil {
		return err
	}

	// 创建告警历史记录
	history := &model.AlertHistory{
		AlertID: alert.ID,
		Action:  "created",
		Message: "告警已创建",
	}
	s.db.Create(history)

	// 创建系统事件
	event := &model.SystemEvent{
		EventType:   "alert_created",
		Severity:    alert.Severity,
		Message:     alert.Message,
		Description: alert.Description,
		Source:      "alert_service",
		HostName:    alert.HostName,
	}
	s.db.Create(event)

	return nil
}

// updateAlert 更新告警
func (s *AlertService) updateAlert(alert *model.Alert) error {
	return s.db.Save(alert).Error
}

// ResolveAlert 解决告警
func (s *AlertService) ResolveAlert(alertID uint, message string) error {
	alert := &model.Alert{}
	if err := s.db.First(alert, alertID).Error; err != nil {
		return err
	}

	alert.Status = "resolved"
	alert.UpdatedAt = time.Now()
	
	if err := s.db.Save(alert).Error; err != nil {
		return err
	}

	// 创建告警历史记录
	history := &model.AlertHistory{
		AlertID: alertID,
		Action:  "resolved",
		Message: message,
	}
	s.db.Create(history)

	// 创建系统事件
	event := &model.SystemEvent{
		EventType:   "alert_resolved",
		Severity:    "info",
		Message:     fmt.Sprintf("告警已解决: %s", alert.Message),
		Description: message,
		Source:      "alert_service",
		HostName:    alert.HostName,
	}
	s.db.Create(event)

	return nil
}

// AcknowledgeAlert 确认告警
func (s *AlertService) AcknowledgeAlert(alertID uint, message string) error {
	alert := &model.Alert{}
	if err := s.db.First(alert, alertID).Error; err != nil {
		return err
	}

	alert.Status = "acknowledged"
	alert.UpdatedAt = time.Now()
	
	if err := s.db.Save(alert).Error; err != nil {
		return err
	}

	// 创建告警历史记录
	history := &model.AlertHistory{
		AlertID: alertID,
		Action:  "acknowledged",
		Message: message,
	}
	s.db.Create(history)

	return nil
}

// GetAlertStatistics 获取告警统计
func (s *AlertService) GetAlertStatistics() (*model.AlertStatistics, error) {
	stats := &model.AlertStatistics{}

	// 总告警数
	s.db.Model(&model.Alert{}).Count(&stats.TotalAlerts)

	// 活跃告警数
	s.db.Model(&model.Alert{}).Where("status = ?", "active").Count(&stats.ActiveAlerts)

	// 严重告警数
	s.db.Model(&model.Alert{}).Where("status = ? AND severity = ?", "active", "critical").Count(&stats.CriticalAlerts)

	// 警告告警数
	s.db.Model(&model.Alert{}).Where("status = ? AND severity = ?", "active", "warning").Count(&stats.WarningAlerts)

	// 已确认告警数
	s.db.Model(&model.Alert{}).Where("status = ?", "acknowledged").Count(&stats.AcknowledgedAlerts)

	// 今日已解决告警数
	today := time.Now().Truncate(24 * time.Hour)
	s.db.Model(&model.Alert{}).Where("status = ? AND updated_at >= ?", "resolved", today).Count(&stats.ResolvedToday)

	return stats, nil
}

// GetAlerts 获取告警列表
func (s *AlertService) GetAlerts(status string, limit, offset int) ([]model.AlertSummary, error) {
	var alerts []model.Alert
	query := s.db.Model(&model.Alert{}).Order("created_at DESC")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	if err := query.Find(&alerts).Error; err != nil {
		return nil, err
	}

	// 转换为摘要格式
	summaries := make([]model.AlertSummary, len(alerts))
	for i, alert := range alerts {
		summaries[i] = model.AlertSummary{
			ID:         alert.ID,
			MetricType: alert.MetricType,
			Severity:   alert.Severity,
			Value:      alert.Value,
			Threshold:  alert.Threshold,
			Status:     alert.Status,
			Message:    alert.Message,
			HostName:   alert.HostName,
			CreatedAt:  alert.CreatedAt,
			Duration:   s.calculateDuration(alert.CreatedAt),
		}
	}

	return summaries, nil
}

// generateAlertMessage 生成告警消息
func (s *AlertService) generateAlertMessage(metricType, severity string, currentValue, threshold float64) string {
	metricNames := map[string]string{
		"cpu":    "CPU使用率",
		"memory": "内存使用率",
		"disk":   "磁盘使用率",
	}

	severityNames := map[string]string{
		"warning":  "警告",
		"critical": "严重",
	}

	metricName := metricNames[metricType]
	severityName := severityNames[severity]

	return fmt.Sprintf("%s%s: 当前值%.1f%%，超过阈值%.1f%%", 
		metricName, severityName, currentValue, threshold)
}

// generateAlertDescription 生成告警描述
func (s *AlertService) generateAlertDescription(metricType, severity string, currentValue, threshold float64) string {
	return fmt.Sprintf("系统%s使用率达到%.1f%%，超过了%s阈值%.1f%%。请及时检查系统状态并采取相应措施。", 
		metricType, currentValue, severity, threshold)
}

// calculateDuration 计算持续时间
func (s *AlertService) calculateDuration(createdAt time.Time) string {
	duration := time.Since(createdAt)
	
	if duration < time.Minute {
		return fmt.Sprintf("%.0f秒", duration.Seconds())
	} else if duration < time.Hour {
		return fmt.Sprintf("%.0f分钟", duration.Minutes())
	} else if duration < 24*time.Hour {
		return fmt.Sprintf("%.1f小时", duration.Hours())
	} else {
		return fmt.Sprintf("%.1f天", duration.Hours()/24)
	}
}