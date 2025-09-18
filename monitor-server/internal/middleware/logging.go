package middleware

import (
	"time"

	"monitor-server/pkg/logger"

	"github.com/gin-gonic/gin"
)

// Logging returns a Gin middleware for logging HTTP requests
func Logging(logger *logger.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// Process request
		c.Next()

		// Calculate latency
		latency := time.Since(start)

		// Get client IP
		clientIP := c.ClientIP()

		// Get status code
		statusCode := c.Writer.Status()

		// Get request method
		method := c.Request.Method

		// Build path with query params
		if raw != "" {
			path = path + "?" + raw
		}

		// Log the request
		logger.Info("HTTP Request",
			"method", method,
			"path", path,
			"status", statusCode,
			"latency", latency,
			"client_ip", clientIP,
			"user_agent", c.Request.UserAgent(),
		)
	}
}