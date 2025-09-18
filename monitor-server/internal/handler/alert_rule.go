package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"monitor-server/internal/model"
	"monitor-server/internal/repository"
)

// AlertRuleHandler 告警规则管理处理器
type AlertRuleHandler struct {
	alertRepo repository.AlertRepository
}

// NewAlertRuleHandler 创建告警规则管理处理器
func NewAlertRuleHandler(db *gorm.DB) *AlertRuleHandler {
	return &AlertRuleHandler{
		alertRepo: repository.NewAlertRepository(db),
	}
}

// UpdateAlertRuleThresholdRequest 更新告警规则阈值请求
type UpdateAlertRuleThresholdRequest struct {
	Threshold float64 `json:"threshold" binding:"required"`
}

// GetAlertRules 获取告警规则列表
// @Summary 获取告警规则列表
// @Description 获取所有告警规则
// @Tags alert-rules
// @Accept json
// @Produce json
// @Success 200 {array} model.AlertRule
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/alert-rules [get]
func (h *AlertRuleHandler) GetAlertRules(c *gin.Context) {
	rules, err := h.alertRepo.GetAllRules()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, rules)
}

// UpdateAlertRuleThreshold 更新告警规则阈值
// @Summary 更新告警规则阈值
// @Description 根据指标类型和严重级别更新告警规则阈值
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param metric_type path string true "指标类型" Enums(cpu,memory,disk)
// @Param severity path string true "严重级别" Enums(warning,critical)
// @Param request body UpdateAlertRuleThresholdRequest true "阈值信息"
// @Success 200 {object} model.AlertRule
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/alert-rules/{metric_type}/{severity}/threshold [put]
func (h *AlertRuleHandler) UpdateAlertRuleThreshold(c *gin.Context) {
	metricType := c.Param("metric_type")
	severity := c.Param("severity")

	var req UpdateAlertRuleThresholdRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 查找对应的告警规则
	rules, err := h.alertRepo.GetAllRules()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var targetRule *model.AlertRule
	for _, rule := range rules {
		if rule.MetricType == metricType && rule.Severity == severity {
			targetRule = &rule
			break
		}
	}

	if targetRule == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Alert rule not found"})
		return
	}

	// 更新阈值
	targetRule.Threshold = req.Threshold
	if err := h.alertRepo.UpdateRule(targetRule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, targetRule)
}