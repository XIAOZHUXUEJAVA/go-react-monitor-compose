package database

import (
	"fmt"
	"monitor-server/internal/model"
)

// AutoMigrate 自动迁移所有模型
func (db *DB) AutoMigrate() error {
	models := []interface{}{
		&model.SystemMetrics{},
		&model.SystemInfoDB{},
		&model.AlertRule{},
		&model.Alert{},
		&model.AlertNotification{},
		&model.AlertHistory{},
		&model.SystemEvent{},
		&model.MonitoringConfig{},
	}

	for _, m := range models {
		if err := db.DB.AutoMigrate(m); err != nil {
			return fmt.Errorf("failed to migrate model %T: %w", m, err)
		}
	}

	return nil
}

// InitializeDefaultConfigs 初始化默认配置
func (db *DB) InitializeDefaultConfigs() error {
	defaultConfigs := []model.MonitoringConfig{
		{
			Key:         "refresh_interval",
			Value:       "60",
			Type:        "int",
			Category:    "system",
			Description: "数据刷新间隔（秒）",
			Editable:    true,
		},
		{
			Key:         "history_points",
			Value:       "10",
			Type:        "int",
			Category:    "dashboard",
			Description: "历史数据点数量",
			Editable:    true,
		},
		{
			Key:         "auto_refresh",
			Value:       "true",
			Type:        "bool",
			Category:    "system",
			Description: "启用自动刷新",
			Editable:    true,
		},
	}

	for _, config := range defaultConfigs {
		// 使用 FirstOrCreate 避免重复插入
		var existingConfig model.MonitoringConfig
		if err := db.Where("key = ?", config.Key).FirstOrCreate(&existingConfig, config).Error; err != nil {
			return fmt.Errorf("failed to create default config %s: %w", config.Key, err)
		}
	}

	return nil
}

// InitializeDefaultAlertRules 初始化默认告警规则
func (db *DB) InitializeDefaultAlertRules() error {
	defaultRules := []model.AlertRule{
		{
			Name:        "CPU使用率过高",
			MetricType:  "cpu",
			Operator:    ">",
			Threshold:   80.0,
			Duration:    300, // 5分钟
			Severity:    "warning",
			Enabled:     true,
			Description: "CPU使用率持续超过80%达5分钟时触发告警",
		},
		{
			Name:        "CPU使用率严重过高",
			MetricType:  "cpu",
			Operator:    ">",
			Threshold:   95.0,
			Duration:    60, // 1分钟
			Severity:    "critical",
			Enabled:     true,
			Description: "CPU使用率持续超过95%达1分钟时触发严重告警",
		},
		{
			Name:        "内存使用率过高",
			MetricType:  "memory",
			Operator:    ">",
			Threshold:   85.0,
			Duration:    300, // 5分钟
			Severity:    "warning",
			Enabled:     true,
			Description: "内存使用率持续超过85%达5分钟时触发告警",
		},
		{
			Name:        "内存使用率严重过高",
			MetricType:  "memory",
			Operator:    ">",
			Threshold:   95.0,
			Duration:    60, // 1分钟
			Severity:    "critical",
			Enabled:     true,
			Description: "内存使用率持续超过95%达1分钟时触发严重告警",
		},
		{
			Name:        "磁盘使用率过高",
			MetricType:  "disk",
			Operator:    ">",
			Threshold:   90.0,
			Duration:    600, // 10分钟
			Severity:    "warning",
			Enabled:     true,
			Description: "磁盘使用率持续超过90%达10分钟时触发告警",
		},
		{
			Name:        "磁盘使用率严重过高",
			MetricType:  "disk",
			Operator:    ">",
			Threshold:   98.0,
			Duration:    60, // 1分钟
			Severity:    "critical",
			Enabled:     true,
			Description: "磁盘使用率持续超过98%达1分钟时触发严重告警",
		},
	}

	for _, rule := range defaultRules {
		// 使用 FirstOrCreate 避免重复插入
		var existingRule model.AlertRule
		if err := db.Where("name = ?", rule.Name).FirstOrCreate(&existingRule, rule).Error; err != nil {
			return fmt.Errorf("failed to create default alert rule %s: %w", rule.Name, err)
		}
	}

	return nil
}

// Setup 完整的数据库设置，包括迁移和初始化数据
func (db *DB) Setup() error {
	// 自动迁移
	if err := db.AutoMigrate(); err != nil {
		return fmt.Errorf("auto migration failed: %w", err)
	}

	// 初始化默认配置
	if err := db.InitializeDefaultConfigs(); err != nil {
		return fmt.Errorf("initialize default configs failed: %w", err)
	}

	// 初始化默认告警规则
	if err := db.InitializeDefaultAlertRules(); err != nil {
		return fmt.Errorf("initialize default alert rules failed: %w", err)
	}

	return nil
}