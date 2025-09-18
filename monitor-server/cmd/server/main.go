package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"monitor-server/internal/api"
	"monitor-server/internal/config"
	"monitor-server/internal/database"
	"monitor-server/internal/service"
	"monitor-server/pkg/logger"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize logger
	logger := logger.New(cfg.Log)

	// Initialize database
	db, err := database.New(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer func() {
		if err := db.Close(); err != nil {
			logger.Error("Failed to close database connection", "error", err)
		}
	}()

	// Run database setup (migrations and initial data)
	if err := db.Setup(); err != nil {
		log.Fatalf("Failed to setup database: %v", err)
	}

	logger.Info("Database connected and initialized successfully")

	// Set Gin mode
	if cfg.App.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize services
	monitorService := service.NewMonitorService()
	alertDetectorManager := service.NewAlertDetectorManager(db.DB, monitorService)

	// Start alert detector
	alertDetectorManager.Start()
	defer alertDetectorManager.Stop()

	// Initialize router
	router := api.NewRouter(cfg, logger, db)

	// Create HTTP server
	srv := &http.Server{
		Addr:    cfg.Server.Address(),
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		logger.Info("Starting server", "address", cfg.Server.Address())
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("Failed to start server", "error", err)
			os.Exit(1)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Create context with timeout for graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("Server forced to shutdown", "error", err)
		os.Exit(1)
	}

	logger.Info("Server exited")
}