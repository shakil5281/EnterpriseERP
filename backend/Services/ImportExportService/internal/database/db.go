package database

import (
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/enterprise-erp/importexport/internal/domain/models"
	_ "github.com/microsoft/go-mssqldb"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Open(dsn string, log *slog.Logger) (*gorm.DB, error) {
	if strings.TrimSpace(dsn) == "" {
		return nil, fmt.Errorf("connection string is empty")
	}
	gdb, err := gorm.Open(sqlserver.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return nil, err
	}
	sqlDB, err := gdb.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)
	_ = log
	return gdb, nil
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.ImportJob{},
		&models.ExportJob{},
		&models.ImportJobError{},
		&models.ImportTemplate{},
		&models.FileStorageRecord{},
		&models.ImportPreviewSession{},
		&models.ImportStagingRow{},
	)
}
