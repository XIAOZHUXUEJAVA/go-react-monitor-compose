package api

import (
	"monitor-server/internal/config"
	"monitor-server/internal/database"
	"monitor-server/internal/handler"
	"monitor-server/internal/middleware"
	"monitor-server/internal/service"
	"monitor-server/pkg/logger"

	"github.com/gin-gonic/gin"
)

// NewRouter creates and configures the main router
func NewRouter(cfg *config.Config, logger *logger.Logger, db *database.DB) *gin.Engine {
	router := gin.New()

	// Add recovery middleware
	router.Use(gin.Recovery())

	// Add logging middleware
	router.Use(middleware.Logging(logger))

	// Add CORS middleware
	router.Use(middleware.CORS(cfg.CORS))

	// Initialize services
	monitorService := service.NewMonitorService()

	// Initialize handlers
	monitorHandler := handler.NewMonitorHandler(monitorService, logger)
	alertRuleHandler := handler.NewAlertRuleHandler(db.DB)
	alertHandler := handler.NewAlertHandler(db.DB)
	configHandler := handler.NewConfigHandler(db.DB)

	// Setup routes
	setupRoutes(router, monitorHandler, alertRuleHandler, alertHandler, configHandler)

	return router
}

// setupRoutes configures all API routes
func setupRoutes(router *gin.Engine, monitorHandler *handler.MonitorHandler, alertRuleHandler *handler.AlertRuleHandler, alertHandler *handler.AlertHandler, configHandler *handler.ConfigHandler) {
	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "monitor-server",
		})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// System monitoring endpoints
		v1.GET("/cpu", monitorHandler.GetCPU)
		v1.GET("/memory", monitorHandler.GetMemory)
		v1.GET("/disk", monitorHandler.GetDisk)
		v1.GET("/network", monitorHandler.GetNetwork)
		v1.GET("/system", monitorHandler.GetSystem)
		v1.GET("/processes", monitorHandler.GetProcesses)

		// Alert rule endpoints
		alertRules := v1.Group("/alert-rules")
		{
			alertRules.GET("", alertRuleHandler.GetAlertRules)
			alertRules.PUT("/:metric_type/:severity/threshold", alertRuleHandler.UpdateAlertRuleThreshold)
		}

		// Alert management endpoints
		alerts := v1.Group("/alerts")
		{
			alerts.GET("/statistics", alertHandler.GetAlertStatistics)
			alerts.GET("", alertHandler.GetAlerts)
			alerts.GET("/:id", alertHandler.GetAlertByID)
			alerts.POST("/:id/acknowledge", alertHandler.AcknowledgeAlert)
			alerts.POST("/:id/resolve", alertHandler.ResolveAlert)
			alerts.GET("/:id/history", alertHandler.GetAlertHistory)
		}

		// System events endpoints
		v1.GET("/system-events", alertHandler.GetSystemEvents)

		// Monitoring config endpoints
		configs := v1.Group("/monitoring-configs")
		{
			configs.GET("", configHandler.GetConfigs)
			configs.GET("/:key", configHandler.GetConfigByKey)
			configs.PUT("/:key", configHandler.UpdateConfig)
			configs.GET("/category/:category", configHandler.GetConfigsByCategory)
		}
	}

	// Legacy API routes (for backward compatibility)
	legacy := router.Group("/api")
	{
		legacy.GET("/cpu", monitorHandler.GetCPU)
		legacy.GET("/memory", monitorHandler.GetMemory)
		legacy.GET("/disk", monitorHandler.GetDisk)
		legacy.GET("/network", monitorHandler.GetNetwork)
		legacy.GET("/system", monitorHandler.GetSystem)
		legacy.GET("/processes", monitorHandler.GetProcesses)
	}
}