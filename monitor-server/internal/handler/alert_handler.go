package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"monitor-server/internal/repository"
	"monitor-server/internal/service"
)

// AlertHandler 告警管理处理器
type AlertHandler struct {
	alertService      *service.AlertService
	alertRecordRepo   repository.AlertRecordRepository
}

// NewAlertHandler 创建告警管理处理器
func NewAlertHandler(db *gorm.DB) *AlertHandler {
	return &AlertHandler{
		alertService:    service.NewAlertService(db),
		alertRecordRepo: repository.NewAlertRecordRepository(db),
	}
}

// GetAlertStatistics 获取告警统计
// @Summary 获取告警统计信息
// @Description 获取告警的统计数据，包括总数、活跃数、严重程度分布等
// @Tags alerts
// @Accept json
// @Produce json
// @Success 200 {object} model.AlertStatistics
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/alerts/statistics [get]
func (h *AlertHandler) GetAlertStatistics(c *gin.Context) {
	stats, err := h.alertService.GetAlertStatistics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetAlerts 获取告警列表
// @Summary 获取告警列表
// @Description 获取告警列表，支持按状态筛选和分页
// @Tags alerts
// @Accept json
// @Produce json
// @Param status query string false "告警状态" Enums(active,acknowledged,resolved)
// @Param limit query int false "每页数量" default(20)
// @Param offset query int false "偏移量" default(0)
// @Success 200 {array} model.AlertSummary
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/alerts [get]
func (h *AlertHandler) GetAlerts(c *gin.Context) {
	status := c.Query("status")
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
		return
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offset parameter"})
		return
	}

	alerts, err := h.alertService.GetAlerts(status, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, alerts)
}

// GetAlertByID 获取告警详情
// @Summary 获取告警详情
// @Description 根据ID获取告警的详细信息
// @Tags alerts
// @Accept json
// @Produce json
// @Param id path int true "告警ID"
// @Success 200 {object} model.Alert
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/alerts/{id} [get]
func (h *AlertHandler) GetAlertByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	alert, err := h.alertRecordRepo.GetAlertByID(uint(id))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Alert not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, alert)
}

// AcknowledgeAlertRequest 确认告警请求
type AcknowledgeAlertRequest struct {
	Message string `json:"message"`
}

// AcknowledgeAlert 确认告警
// @Summary 确认告警
// @Description 确认一个告警，将其状态设置为已确认
// @Tags alerts
// @Accept json
// @Produce json
// @Param id path int true "告警ID"
// @Param request body AcknowledgeAlertRequest false "确认信息"
// @Success 200 {object} gin.H
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/alerts/{id}/acknowledge [post]
func (h *AlertHandler) AcknowledgeAlert(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	var req AcknowledgeAlertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message := req.Message
	if message == "" {
		message = "告警已确认"
	}

	if err := h.alertService.AcknowledgeAlert(uint(id), message); err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Alert not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Alert acknowledged successfully"})
}

// ResolveAlertRequest 解决告警请求
type ResolveAlertRequest struct {
	Message string `json:"message"`
}

// ResolveAlert 解决告警
// @Summary 解决告警
// @Description 解决一个告警，将其状态设置为已解决
// @Tags alerts
// @Accept json
// @Produce json
// @Param id path int true "告警ID"
// @Param request body ResolveAlertRequest false "解决信息"
// @Success 200 {object} gin.H
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/alerts/{id}/resolve [post]
func (h *AlertHandler) ResolveAlert(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	var req ResolveAlertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message := req.Message
	if message == "" {
		message = "告警已手动解决"
	}

	if err := h.alertService.ResolveAlert(uint(id), message); err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Alert not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Alert resolved successfully"})
}

// GetAlertHistory 获取告警历史
// @Summary 获取告警历史
// @Description 获取指定告警的历史记录
// @Tags alerts
// @Accept json
// @Produce json
// @Param id path int true "告警ID"
// @Success 200 {array} model.AlertHistory
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/alerts/{id}/history [get]
func (h *AlertHandler) GetAlertHistory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	history, err := h.alertRecordRepo.GetAlertHistory(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, history)
}

// GetSystemEvents 获取系统事件
// @Summary 获取系统事件列表
// @Description 获取系统事件列表，支持分页
// @Tags alerts
// @Accept json
// @Produce json
// @Param limit query int false "每页数量" default(20)
// @Param offset query int false "偏移量" default(0)
// @Success 200 {array} model.SystemEvent
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/system-events [get]
func (h *AlertHandler) GetSystemEvents(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
		return
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offset parameter"})
		return
	}

	events, err := h.alertRecordRepo.GetSystemEvents(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, events)
}