package database

import (
	"context"
	"database/sql"
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
	if err := ensureDatabase(dsn, log); err != nil {
		return nil, fmt.Errorf("ensure database: %w", err)
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

func ensureDatabase(dsn string, log *slog.Logger) error {
	masterDSN, target := swapDatabase(dsn, "master")
	if target == "" || strings.EqualFold(target, "master") {
		return nil
	}

	conn, err := sql.Open("sqlserver", masterDSN)
	if err != nil {
		return fmt.Errorf("open master: %w", err)
	}
	defer conn.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := conn.PingContext(ctx); err != nil {
		return fmt.Errorf("ping master: %w", err)
	}

	var exists int
	row := conn.QueryRowContext(ctx, "SELECT CASE WHEN DB_ID(@p1) IS NULL THEN 0 ELSE 1 END", target)
	if err := row.Scan(&exists); err != nil {
		return fmt.Errorf("check database: %w", err)
	}
	if exists == 1 {
		return nil
	}

	if log != nil {
		log.Info("creating database", "name", target)
	}
	stmt := fmt.Sprintf("CREATE DATABASE [%s]", strings.ReplaceAll(target, "]", "]]"))
	if _, err := conn.ExecContext(ctx, stmt); err != nil {
		return fmt.Errorf("create database: %w", err)
	}
	return nil
}

func swapDatabase(dsn, replacement string) (string, string) {
	idx := strings.Index(dsn, "?")
	if idx < 0 {
		return dsn, ""
	}
	head := dsn[:idx]
	tail := dsn[idx+1:]
	parts := strings.Split(tail, "&")
	target := ""
	newParts := make([]string, 0, len(parts))
	for _, p := range parts {
		if strings.HasPrefix(strings.ToLower(p), "database=") {
			target = p[len("database="):]
			newParts = append(newParts, "database="+escapeDSNValue(replacement))
			continue
		}
		newParts = append(newParts, p)
	}
	return head + "?" + strings.Join(newParts, "&"), target
}

func escapeDSNValue(v string) string {
	v = strings.ReplaceAll(v, " ", "%20")
	v = strings.ReplaceAll(v, "@", "%40")
	return v
}
