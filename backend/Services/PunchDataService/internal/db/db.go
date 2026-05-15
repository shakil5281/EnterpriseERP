package db

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/enterprise-erp/punchdata/internal/models"
	_ "github.com/microsoft/go-mssqldb"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

// Open returns a configured *gorm.DB connected to SQL Server.
//
// The connectionString can be supplied either as an ADO-style string
// ("Server=...;Database=...;User Id=...;Password=...;TrustServerCertificate=True")
// or a driver-native URL ("sqlserver://user:pass@host?database=..."). ADO style
// is auto-converted so configuration can stay in the .NET appsettings format.
func Open(connectionString string, slogger *slog.Logger) (*gorm.DB, error) {
	if strings.TrimSpace(connectionString) == "" {
		return nil, fmt.Errorf("connection string is empty")
	}

	dsn := normalizeDSN(connectionString)
	if err := ensureDatabase(dsn, slogger); err != nil {
		return nil, fmt.Errorf("ensure database: %w", err)
	}

	gormCfg := &gorm.Config{
		Logger: gormlogger.New(
			slogWriter{slogger.With("component", "gorm")},
			gormlogger.Config{
				SlowThreshold:             time.Second,
				LogLevel:                  gormlogger.Warn,
				IgnoreRecordNotFoundError: true,
				Colorful:                  false,
			},
		),
	}

	gdb, err := gorm.Open(sqlserver.Open(dsn), gormCfg)
	if err != nil {
		return nil, fmt.Errorf("open sqlserver: %w", err)
	}

	sqlDB, err := gdb.DB()
	if err != nil {
		return nil, fmt.Errorf("acquire underlying sql.DB: %w", err)
	}
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	return gdb, nil
}

// AutoMigrate creates the schema for PunchLogFiles and PunchRecords. Safe to
// call on every startup.
func AutoMigrate(gdb *gorm.DB) error {
	return gdb.AutoMigrate(
		&models.PunchLogFile{},
		&models.PunchRecord{},
	)
}

// normalizeDSN converts an ADO-style SQL Server connection string into the
// "sqlserver://" URL form that the go-mssqldb driver prefers. Already-formatted
// URL strings are passed through unchanged.
func normalizeDSN(cs string) string {
	trimmed := strings.TrimSpace(cs)
	if strings.HasPrefix(strings.ToLower(trimmed), "sqlserver://") {
		return trimmed
	}

	parts := strings.Split(trimmed, ";")
	kv := map[string]string{}
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		idx := strings.Index(p, "=")
		if idx <= 0 {
			continue
		}
		key := strings.ToLower(strings.TrimSpace(p[:idx]))
		val := strings.TrimSpace(p[idx+1:])
		kv[key] = val
	}

	server := firstNonEmpty(kv["server"], kv["data source"])
	database := firstNonEmpty(kv["database"], kv["initial catalog"])
	user := firstNonEmpty(kv["user id"], kv["uid"])
	password := firstNonEmpty(kv["password"], kv["pwd"])

	host, instance, port := parseServer(server)

	q := []string{}
	if database != "" {
		q = append(q, "database="+escape(database))
	}
	if port != "" {
		q = append(q, "port="+escape(port))
	}
	trustCert := false
	if v, ok := kv["trustservercertificate"]; ok && strings.EqualFold(v, "true") {
		trustCert = true
		q = append(q, "trustservercertificate=true")
	}
	if v, ok := kv["encrypt"]; ok {
		switch strings.ToLower(v) {
		case "mandatory", "true", "yes":
			q = append(q, "encrypt=true")
		case "optional", "false", "no":
			q = append(q, "encrypt=disable")
		case "strict":
			q = append(q, "encrypt=strict")
		}
	}
	// SQL Server Express (especially older builds) often negotiates TLS 1.0/1.1
	// with a self-signed certificate. The go-mssqldb driver rejects that combo
	// by default; loosen the minimum TLS version when the operator explicitly
	// said TrustServerCertificate=True — same trust posture as the .NET driver.
	if trustCert {
		q = append(q, "tlsmin=1.0")
	}
	if v, ok := kv["multipleactiveresultsets"]; ok && strings.EqualFold(v, "true") {
		q = append(q, "MultipleActiveResultSets=true")
	}

	auth := ""
	if user != "" {
		auth = escape(user)
		if password != "" {
			auth += ":" + escape(password)
		}
		auth += "@"
	}

	url := "sqlserver://" + auth + escape(host)
	if instance != "" {
		url += "/" + escape(instance)
	}
	if len(q) > 0 {
		url += "?" + strings.Join(q, "&")
	}
	return url
}

func parseServer(server string) (host, instance, port string) {
	if server == "" {
		return "", "", ""
	}
	if strings.Contains(server, "\\") {
		bits := strings.SplitN(server, "\\", 2)
		host = bits[0]
		instance = bits[1]
	} else if strings.Contains(server, ",") {
		bits := strings.SplitN(server, ",", 2)
		host = bits[0]
		port = bits[1]
	} else {
		host = server
	}
	return host, instance, port
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

func escape(v string) string {
	v = strings.ReplaceAll(v, " ", "%20")
	v = strings.ReplaceAll(v, "@", "%40")
	return v
}

// ensureDatabase opens a temporary connection to the `master` database on the
// same server and creates the target database if it does not exist. This
// mirrors the behaviour of EF Core's `Database.MigrateAsync()` so the service
// is self-contained on first start.
func ensureDatabase(dsn string, slogger *slog.Logger) error {
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

	slogger.Info("creating database", "name", target)
	// CREATE DATABASE cannot be parameterised and the name has already been
	// validated by being parsed out of the operator-controlled DSN, so we
	// bracket-quote it to defang the value rather than passing through raw.
	stmt := fmt.Sprintf("CREATE DATABASE [%s]", strings.ReplaceAll(target, "]", "]]"))
	if _, err := conn.ExecContext(ctx, stmt); err != nil {
		return fmt.Errorf("create database: %w", err)
	}
	return nil
}

// swapDatabase rewrites the `database=` query parameter to `replacement` and
// returns both the new DSN and the original database value.
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
			newParts = append(newParts, "database="+escape(replacement))
			continue
		}
		newParts = append(newParts, p)
	}
	return head + "?" + strings.Join(newParts, "&"), target
}

// slogWriter adapts slog.Logger to GORM's Printf-style writer.
type slogWriter struct{ l *slog.Logger }

func (w slogWriter) Printf(format string, args ...any) {
	w.l.Info(fmt.Sprintf(format, args...))
}
