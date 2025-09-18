package handler

import (
	"net/http"
	"monitor-server/internal/repository"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ConfigHandler 配置处理器
type ConfigHandler struct {
	configRepo repository.ConfigRepository
}

// NewConfigHandler 创建配置处理器
func NewConfigHandler(db *gorm.DB) *ConfigHandler {
	return &ConfigHandler{
		configRepo: repository.NewConfigRepository(db),
	}
}

// GetConfigs 获取所有配置
func (h *ConfigHandler) GetConfigs(c *gin.Context) {
	configs, err := h.configRepo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get configs",
		})
		return
	}

	c.JSON(http.StatusOK, configs)
}

// GetConfigByKey 根据key获取配置
func (h *ConfigHandler) GetConfigByKey(c *gin.Context) {
	key := c.Param("key")
	
	config, err := h.configRepo.GetByKey(key)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Config not found",
		})
		return
	}

	c.JSON(http.StatusOK, config)
}

// UpdateConfig 更新配置
func (h *ConfigHandler) UpdateConfig(c *gin.Context) {
	key := c.Param("key")
	
	// 获取现有配置
	config, err := h.configRepo.GetByKey(key)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Config not found",
		})
		return
	}

	// 解析请求体
	var updateReq struct {
		Value string `json:"value" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	// 更新配置值
	config.Value = updateReq.Value
	
	if err := h.configRepo.Update(config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update config",
		})
		return
	}

	c.JSON(http.StatusOK, config)
}

// GetConfigsByCategory 根据分类获取配置
func (h *ConfigHandler) GetConfigsByCategory(c *gin.Context) {
	category := c.Param("category")
	
	configs, err := h.configRepo.GetByCategory(category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get configs by category",
		})
		return
	}

	c.JSON(http.StatusOK, configs)
}