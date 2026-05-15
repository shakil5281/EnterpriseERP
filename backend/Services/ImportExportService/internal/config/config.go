package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type AppConfig struct {
	Server            ServerConfig            `json:"Server"`
	ConnectionStrings ConnectionStringsConfig `json:"ConnectionStrings"`
	Redis             RedisConfig             `json:"Redis"`
	Asynq             AsynqConfig             `json:"Asynq"`
	Storage           StorageConfig           `json:"Storage"`
	Jwt               JwtConfig               `json:"Jwt"`
	Cors              CorsConfig              `json:"Cors"`
}

type ServerConfig struct {
	Address string `json:"Address"`
}

type ConnectionStringsConfig struct {
	ImportExportDb string `json:"ImportExportDb"`
}

type RedisConfig struct {
	Address  string `json:"Address"`
	Password string `json:"Password"`
	DB       int    `json:"DB"`
}

type AsynqConfig struct {
	Concurrency            int `json:"Concurrency"`
	ImportLargeRowThreshold int `json:"ImportLargeRowThreshold"`
}

type StorageConfig struct {
	UploadDir    string `json:"UploadDir"`
	ExportDir    string `json:"ExportDir"`
	TemplatesDir string `json:"TemplatesDir"`
}

type JwtConfig struct {
	Issuer     string `json:"Issuer"`
	Audience   string `json:"Audience"`
	SigningKey string `json:"SigningKey"`
}

type CorsConfig struct {
	AllowedOrigins []string `json:"AllowedOrigins"`
}

func Load() (*AppConfig, error) {
	root, err := projectRoot()
	if err != nil {
		return nil, err
	}
	cfg := &AppConfig{}
	if err := readJSON(filepath.Join(root, "appsettings.json"), cfg); err != nil {
		return nil, err
	}
	applyEnv(cfg)
	applyDefaults(cfg)
	return cfg, nil
}

func readJSON(path string, into any) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, into)
}

func applyEnv(cfg *AppConfig) {
	if v := os.Getenv("IMPORTEXPORT_SERVER_ADDRESS"); v != "" {
		cfg.Server.Address = v
	}
	if v := os.Getenv("IMPORTEXPORT_CONNECTIONSTRING"); v != "" {
		cfg.ConnectionStrings.ImportExportDb = v
	}
	if v := os.Getenv("IMPORTEXPORT_REDIS"); v != "" {
		cfg.Redis.Address = v
	}
	if v := os.Getenv("IMPORTEXPORT_JWT_SIGNINGKEY"); v != "" {
		cfg.Jwt.SigningKey = v
	}
	if v := os.Getenv("IMPORTEXPORT_JWT_ISSUER"); v != "" {
		cfg.Jwt.Issuer = v
	}
	if v := os.Getenv("IMPORTEXPORT_JWT_AUDIENCE"); v != "" {
		cfg.Jwt.Audience = v
	}
}

func applyDefaults(cfg *AppConfig) {
	if cfg.Server.Address == "" {
		cfg.Server.Address = ":5060"
	}
	if cfg.Redis.Address == "" {
		cfg.Redis.Address = "127.0.0.1:6379"
	}
	if cfg.Asynq.Concurrency <= 0 {
		cfg.Asynq.Concurrency = 10
	}
	if cfg.Asynq.ImportLargeRowThreshold <= 0 {
		cfg.Asynq.ImportLargeRowThreshold = 500
	}
	if cfg.Storage.UploadDir == "" {
		cfg.Storage.UploadDir = "uploads"
	}
	if cfg.Storage.ExportDir == "" {
		cfg.Storage.ExportDir = "exports"
	}
	if cfg.Storage.TemplatesDir == "" {
		cfg.Storage.TemplatesDir = "templates"
	}
}

func projectRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for i := 0; i < 10; i++ {
		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return "", fmt.Errorf("go.mod not found")
}

func NormalizeSQLServerDSN(cs string) string {
	trimmed := strings.TrimSpace(cs)
	if strings.HasPrefix(strings.ToLower(trimmed), "sqlserver://") {
		return trimmed
	}
	// Minimal ADO -> URL (reuse logic pattern from punchdata - simplified)
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
		k := strings.ToLower(strings.TrimSpace(p[:idx]))
		v := strings.TrimSpace(p[idx+1:])
		kv[k] = v
	}
	server := first(kv, "server", "data source")
	database := first(kv, "database", "initial catalog")
	user := first(kv, "user id", "uid")
	password := first(kv, "password", "pwd")
	host := server
	port := ""
	if strings.Contains(server, ",") {
		bits := strings.SplitN(server, ",", 2)
		host, port = bits[0], bits[1]
	}
	q := []string{"database=" + esc(database)}
	if port != "" {
		q = append(q, "port="+esc(port))
	}
	if strings.EqualFold(kv["trustservercertificate"], "true") {
		q = append(q, "trustservercertificate=true", "tlsmin=1.0")
	}
	auth := ""
	if user != "" {
		auth = esc(user)
		if password != "" {
			auth += ":" + esc(password)
		}
		auth += "@"
	}
	return "sqlserver://" + auth + esc(host) + "?" + strings.Join(q, "&")
}

func first(m map[string]string, keys ...string) string {
	for _, k := range keys {
		if v := strings.TrimSpace(m[k]); v != "" {
			return v
		}
	}
	return ""
}

func esc(v string) string {
	v = strings.ReplaceAll(v, " ", "%20")
	v = strings.ReplaceAll(v, "@", "%40")
	return v
}
