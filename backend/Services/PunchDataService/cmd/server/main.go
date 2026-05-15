package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/enterprise-erp/punchdata/internal/config"
	"github.com/enterprise-erp/punchdata/internal/db"
	_ "github.com/enterprise-erp/punchdata/internal/docs"
	"github.com/enterprise-erp/punchdata/internal/handlers"
	"github.com/enterprise-erp/punchdata/internal/middleware"
	"github.com/enterprise-erp/punchdata/internal/processor"
	"github.com/enterprise-erp/punchdata/internal/repository"
	"github.com/enterprise-erp/punchdata/internal/router"
	"github.com/gin-gonic/gin"
)

// @title           PunchDataService API
// @version         1.0
// @description     Punch / attendance log collection + processing service for EnterpriseERP. Ingests device payloads (CSV / JSON), normalises them into punch records, and exposes them for downstream services.
// @contact.name    EnterpriseERP Platform Team
// @BasePath        /
// @schemes         http https
//
// @securityDefinitions.apikey  BearerAuth
// @in                          header
// @name                        Authorization
// @description                 JWT issued by AuthService. Send as: `Bearer <token>`.

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		logger.Error("load config failed", "error", err)
		os.Exit(1)
	}

	if strings.TrimSpace(cfg.Jwt.SigningKey) == "" || len(cfg.Jwt.SigningKey) < 32 {
		logger.Error("Jwt.SigningKey must be set and at least 32 chars (match AuthService)")
		os.Exit(1)
	}

	gormDB, err := db.Open(cfg.ConnectionStrings.PunchDataDb, logger)
	if err != nil {
		logger.Error("db open failed", "error", err)
		os.Exit(1)
	}
	if err := db.AutoMigrate(gormDB); err != nil {
		logger.Error("db migrate failed", "error", err)
		os.Exit(1)
	}

	repo := repository.New(gormDB)
	procSvc := processor.NewService(repo, logger, cfg.PunchData.Source)

	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	engine := router.New(router.Options{
		AllowedOrigins: cfg.Cors.AllowedOrigins,
		Jwt: middleware.JwtConfig{
			Issuer:     cfg.Jwt.Issuer,
			Audience:   cfg.Jwt.Audience,
			SigningKey: cfg.Jwt.SigningKey,
		},
		Health:  handlers.NewHealthHandler(gormDB),
		Logs:    handlers.NewLogsHandler(repo, procSvc, cfg.PunchData.MaxUploadMB),
		Punches: handlers.NewPunchesHandler(repo),
	})

	srv := &http.Server{
		Addr:              cfg.Server.Address,
		Handler:           engine,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		logger.Info("PunchDataService listening", "address", cfg.Server.Address)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	logger.Info("shutting down")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		logger.Warn("graceful shutdown failed", "error", err)
	}
	if sqlDB, err := gormDB.DB(); err == nil {
		_ = sqlDB.Close()
	}
}
