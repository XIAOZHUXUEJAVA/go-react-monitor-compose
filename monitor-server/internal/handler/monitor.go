package handler

import (
	"strconv"

	"monitor-server/internal/service"
	"monitor-server/pkg/logger"
	"monitor-server/pkg/response"

	"github.com/gin-gonic/gin"
)

// MonitorHandler handles HTTP requests for system monitoring
type MonitorHandler struct {
	monitorService service.MonitorService
	logger         *logger.Logger
}

// NewMonitorHandler creates a new monitor handler instance
func NewMonitorHandler(monitorService service.MonitorService, logger *logger.Logger) *MonitorHandler {
	return &MonitorHandler{
		monitorService: monitorService,
		logger:         logger,
	}
}

// GetCPU handles GET /api/cpu requests
func (h *MonitorHandler) GetCPU(c *gin.Context) {
	data, err := h.monitorService.GetCPUData(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to get CPU data", "error", err)
		response.InternalServerError(c, "Failed to retrieve CPU data")
		return
	}

	response.Success(c, data)
}

// GetMemory handles GET /api/memory requests
func (h *MonitorHandler) GetMemory(c *gin.Context) {
	data, err := h.monitorService.GetMemoryData(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to get memory data", "error", err)
		response.InternalServerError(c, "Failed to retrieve memory data")
		return
	}

	response.Success(c, data)
}

// GetDisk handles GET /api/disk requests
func (h *MonitorHandler) GetDisk(c *gin.Context) {
	data, err := h.monitorService.GetDiskData(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to get disk data", "error", err)
		response.InternalServerError(c, "Failed to retrieve disk data")
		return
	}

	response.Success(c, data)
}

// GetNetwork handles GET /api/network requests
func (h *MonitorHandler) GetNetwork(c *gin.Context) {
	data, err := h.monitorService.GetNetworkData(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to get network data", "error", err)
		response.InternalServerError(c, "Failed to retrieve network data")
		return
	}

	response.Success(c, data)
}

// GetSystem handles GET /api/system requests
func (h *MonitorHandler) GetSystem(c *gin.Context) {
	data, err := h.monitorService.GetSystemInfo(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to get system info", "error", err)
		response.InternalServerError(c, "Failed to retrieve system information")
		return
	}

	response.Success(c, data)
}

// GetProcesses handles GET /api/processes requests
func (h *MonitorHandler) GetProcesses(c *gin.Context) {
	// Parse query parameters
	limitStr := c.DefaultQuery("limit", "10")
	sortBy := c.DefaultQuery("sort", "cpu")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		response.BadRequest(c, "Invalid limit parameter")
		return
	}

	if sortBy != "cpu" && sortBy != "memory" {
		response.BadRequest(c, "Invalid sort parameter. Must be 'cpu' or 'memory'")
		return
	}

	data, err := h.monitorService.GetProcessData(c.Request.Context(), limit, sortBy)
	if err != nil {
		h.logger.Error("Failed to get process data", "error", err)
		response.InternalServerError(c, "Failed to retrieve process data")
		return
	}

	response.Success(c, data)
}