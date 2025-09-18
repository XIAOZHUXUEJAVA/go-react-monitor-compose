package repository

import (
	"time"

	"gorm.io/gorm"

	"monitor-server/internal/model"
)

// MetricsRepository 系统指标仓库接口
type MetricsRepository interface {
	Create(metric *model.SystemMetrics) error
	CreateBatch(metrics []model.SystemMetrics) error
	GetLatestByHostname(hostname string) (*model.SystemMetrics, error)
	GetHistoryByHostname(hostname string, hours int) ([]model.SystemMetrics, error)
	GetAverageCPUUsage(hostname string, hours int) (float64, error)
	GetHostStats() ([]HostStats, error)
	DeleteOldRecords(days int) error
}

// SystemInfoRepository 系统信息仓库接口
type SystemInfoRepository interface {
	CreateOrUpdate(info *model.SystemInfoDB) error
	GetByHostname(hostname string) (*model.SystemInfoDB, error)
	GetAll() ([]model.SystemInfoDB, error)
	UpdateLastSeen(hostname string) error
}

// ConfigRepository 配置仓库接口
type ConfigRepository interface {
	GetByKey(key string) (*model.MonitoringConfig, error)
	GetByCategory(category string) ([]model.MonitoringConfig, error)
	Update(config *model.MonitoringConfig) error
	GetAll() ([]model.MonitoringConfig, error)
}

// AlertRepository 告警仓库接口
type AlertRepository interface {
	CreateRule(rule *model.AlertRule) error
	GetActiveRules() ([]model.AlertRule, error)
	GetAllRules() ([]model.AlertRule, error)
	GetRuleByID(id uint) (*model.AlertRule, error)
	UpdateRule(rule *model.AlertRule) error
	DeleteRule(id uint) error
	CreateAlert(alert *model.Alert) error
	GetActiveAlerts() ([]model.Alert, error)
	ResolveAlert(id uint) error
}

// HostStats 主机统计信息
type HostStats struct {
	Hostname string  `json:"hostname"`
	Count    int64   `json:"count"`
	AvgCPU   float64 `json:"avg_cpu"`
	MaxCPU   float64 `json:"max_cpu"`
	AvgMem   float64 `json:"avg_memory"`
	MaxMem   float64 `json:"max_memory"`
	LastSeen time.Time `json:"last_seen"`
}

// metricsRepository GORM实现
type metricsRepository struct {
	db *gorm.DB
}

// NewMetricsRepository 创建系统指标仓库
func NewMetricsRepository(db *gorm.DB) MetricsRepository {
	return &metricsRepository{db: db}
}

func (r *metricsRepository) Create(metric *model.SystemMetrics) error {
	return r.db.Create(metric).Error
}

func (r *metricsRepository) CreateBatch(metrics []model.SystemMetrics) error {
	return r.db.CreateInBatches(metrics, 100).Error
}

func (r *metricsRepository) GetLatestByHostname(hostname string) (*model.SystemMetrics, error) {
	var metric model.SystemMetrics
	err := r.db.Where("hostname = ?", hostname).
		Order("timestamp desc").
		First(&metric).Error
	
	if err != nil {
		return nil, err
	}
	return &metric, nil
}

func (r *metricsRepository) GetHistoryByHostname(hostname string, hours int) ([]model.SystemMetrics, error) {
	var metrics []model.SystemMetrics
	since := time.Now().Add(-time.Duration(hours) * time.Hour)
	
	err := r.db.Where("hostname = ? AND timestamp > ?", hostname, since).
		Order("timestamp desc").
		Find(&metrics).Error
	
	return metrics, err
}

func (r *metricsRepository) GetAverageCPUUsage(hostname string, hours int) (float64, error) {
	var avgCPU float64
	since := time.Now().Add(-time.Duration(hours) * time.Hour)
	
	err := r.db.Model(&model.SystemMetrics{}).
		Where("hostname = ? AND timestamp > ?", hostname, since).
		Select("AVG(cpu_usage)").
		Scan(&avgCPU).Error
	
	return avgCPU, err
}

func (r *metricsRepository) GetHostStats() ([]HostStats, error) {
	var stats []HostStats
	
	err := r.db.Model(&model.SystemMetrics{}).
		Select(`
			hostname,
			COUNT(*) as count,
			AVG(cpu_usage) as avg_cpu,
			MAX(cpu_usage) as max_cpu,
			AVG(memory_usage) as avg_mem,
			MAX(memory_usage) as max_mem,
			MAX(timestamp) as last_seen
		`).
		Group("hostname").
		Scan(&stats).Error
	
	return stats, err
}

func (r *metricsRepository) DeleteOldRecords(days int) error {
	cutoff := time.Now().AddDate(0, 0, -days)
	return r.db.Where("timestamp < ?", cutoff).Delete(&model.SystemMetrics{}).Error
}

// systemInfoRepository GORM实现
type systemInfoRepository struct {
	db *gorm.DB
}

// NewSystemInfoRepository 创建系统信息仓库
func NewSystemInfoRepository(db *gorm.DB) SystemInfoRepository {
	return &systemInfoRepository{db: db}
}

func (r *systemInfoRepository) CreateOrUpdate(info *model.SystemInfoDB) error {
	// 使用 GORM 的 Save 方法，如果存在则更新，不存在则创建
	return r.db.Where("hostname = ?", info.Hostname).Save(info).Error
}

func (r *systemInfoRepository) GetByHostname(hostname string) (*model.SystemInfoDB, error) {
	var info model.SystemInfoDB
	err := r.db.Where("hostname = ?", hostname).First(&info).Error
	if err != nil {
		return nil, err
	}
	return &info, nil
}

func (r *systemInfoRepository) GetAll() ([]model.SystemInfoDB, error) {
	var infos []model.SystemInfoDB
	err := r.db.Find(&infos).Error
	return infos, err
}

func (r *systemInfoRepository) UpdateLastSeen(hostname string) error {
	return r.db.Model(&model.SystemInfoDB{}).
		Where("hostname = ?", hostname).
		Update("last_seen", time.Now()).Error
}

// configRepository GORM实现
type configRepository struct {
	db *gorm.DB
}

// NewConfigRepository 创建配置仓库
func NewConfigRepository(db *gorm.DB) ConfigRepository {
	return &configRepository{db: db}
}

func (r *configRepository) GetByKey(key string) (*model.MonitoringConfig, error) {
	var config model.MonitoringConfig
	err := r.db.Where("key = ?", key).First(&config).Error
	if err != nil {
		return nil, err
	}
	return &config, nil
}

func (r *configRepository) GetByCategory(category string) ([]model.MonitoringConfig, error) {
	var configs []model.MonitoringConfig
	err := r.db.Where("category = ?", category).Find(&configs).Error
	return configs, err
}

func (r *configRepository) Update(config *model.MonitoringConfig) error {
	return r.db.Save(config).Error
}

func (r *configRepository) GetAll() ([]model.MonitoringConfig, error) {
	var configs []model.MonitoringConfig
	err := r.db.Find(&configs).Error
	return configs, err
}

// alertRepository GORM实现
type alertRepository struct {
	db *gorm.DB
}

// NewAlertRepository 创建告警仓库
func NewAlertRepository(db *gorm.DB) AlertRepository {
	return &alertRepository{db: db}
}

func (r *alertRepository) CreateRule(rule *model.AlertRule) error {
	return r.db.Create(rule).Error
}

func (r *alertRepository) GetActiveRules() ([]model.AlertRule, error) {
	var rules []model.AlertRule
	err := r.db.Where("enabled = ?", true).Find(&rules).Error
	return rules, err
}

func (r *alertRepository) GetAllRules() ([]model.AlertRule, error) {
	var rules []model.AlertRule
	err := r.db.Find(&rules).Error
	return rules, err
}

func (r *alertRepository) GetRuleByID(id uint) (*model.AlertRule, error) {
	var rule model.AlertRule
	err := r.db.First(&rule, id).Error
	if err != nil {
		return nil, err
	}
	return &rule, nil
}

func (r *alertRepository) UpdateRule(rule *model.AlertRule) error {
	return r.db.Save(rule).Error
}

func (r *alertRepository) DeleteRule(id uint) error {
	return r.db.Delete(&model.AlertRule{}, id).Error
}

func (r *alertRepository) CreateAlert(alert *model.Alert) error {
	return r.db.Create(alert).Error
}

func (r *alertRepository) GetActiveAlerts() ([]model.Alert, error) {
	var alerts []model.Alert
	err := r.db.Preload("Rule").Where("status = ?", "active").Find(&alerts).Error
	return alerts, err
}

func (r *alertRepository) ResolveAlert(id uint) error {
	now := time.Now()
	return r.db.Model(&model.Alert{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":   "resolved",
			"end_time": &now,
		}).Error
}