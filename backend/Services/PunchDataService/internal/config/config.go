package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// AppConfig mirrors the shape of appsettings.json so the Go service feels
// at home next to the .NET microservices that share the same convention.
type AppConfig struct {
	Server            ServerConfig            `json:"Server"`
	ConnectionStrings ConnectionStringsConfig `json:"ConnectionStrings"`
	Jwt               JwtConfig               `json:"Jwt"`
	Cors              CorsConfig              `json:"Cors"`
	PunchData         PunchDataConfig         `json:"PunchData"`
	RemoteCollect     RemoteCollectConfig     `json:"RemoteCollect"`
	RabbitMQ          RabbitMQConfig          `json:"RabbitMQ"`
	Logging           LoggingConfig           `json:"Logging"`
}

type ServerConfig struct {
	Address string `json:"Address"`
}

type ConnectionStringsConfig struct {
	PunchDataDb    string `json:"PunchDataDb"`
	RemoteZktecoDb string `json:"RemoteZktecoDb"`
}

type JwtConfig struct {
	Issuer             string `json:"Issuer"`
	Audience           string `json:"Audience"`
	SigningKey         string `json:"SigningKey"`
	AccessTokenMinutes int    `json:"AccessTokenMinutes"`
}

type CorsConfig struct {
	AllowedOrigins []string `json:"AllowedOrigins"`
}

type PunchDataConfig struct {
	MaxUploadMB            int  `json:"MaxUploadMB"`
	Source                 string `json:"Source"`
	EnableBackgroundSync   bool `json:"EnableBackgroundSync"`
	SyncIntervalMinutes    int  `json:"SyncIntervalMinutes"`
}

type RemoteCollectConfig struct {
	Source              string `json:"Source"`
	DefaultBatchSize    int    `json:"DefaultBatchSize"`
	MaxBatchSize        int    `json:"MaxBatchSize"`
	MaxRowsPerCollect   int    `json:"MaxRowsPerCollect"`
	DefaultLookbackDays int    `json:"DefaultLookbackDays"`
}

type RabbitMQConfig struct {
	HostName     string `json:"HostName"`
	UserName     string `json:"UserName"`
	Password     string `json:"Password"`
	ExchangeName string `json:"ExchangeName"`
	Enabled      bool   `json:"Enabled"`
}

type LoggingConfig struct {
	Level string `json:"Level"`
}

// Load reads appsettings.json and an optional appsettings.<env>.json overlay
// from the project root, then merges ConnectionStrings.PunchDataDb from
// ../../Configuration/connectionstrings.json (repo central file) when present,
// then applies environment-variable overrides.
//
// Env overrides (all optional):
//
//	PUNCHDATA_SERVER_ADDRESS               -> Server.Address
//	PUNCHDATA_CONNECTIONSTRING             -> ConnectionStrings.PunchDataDb
//	PUNCHDATA_JWT_SIGNINGKEY               -> Jwt.SigningKey
//	PUNCHDATA_JWT_ISSUER                   -> Jwt.Issuer
//	PUNCHDATA_JWT_AUDIENCE                 -> Jwt.Audience
//	ASPNETCORE_ENVIRONMENT (Development)   -> picks the overlay file
func Load() (*AppConfig, error) {
	root, err := projectRoot()
	if err != nil {
		return nil, err
	}

	cfg := &AppConfig{}
	base := filepath.Join(root, "appsettings.json")
	if err := readJSON(base, cfg); err != nil {
		return nil, fmt.Errorf("read %s: %w", base, err)
	}

	env := strings.TrimSpace(os.Getenv("ASPNETCORE_ENVIRONMENT"))
	if env == "" {
		env = "Development"
	}
	overlay := filepath.Join(root, fmt.Sprintf("appsettings.%s.json", env))
	if _, err := os.Stat(overlay); err == nil {
		if err := readJSON(overlay, cfg); err != nil {
			return nil, fmt.Errorf("read %s: %w", overlay, err)
		}
	}

	central := filepath.Clean(filepath.Join(root, "..", "..", "Configuration", "connectionstrings.json"))
	if _, err := os.Stat(central); err == nil {
		var centralCfg struct {
			ConnectionStrings ConnectionStringsConfig `json:"ConnectionStrings"`
		}
		if err := readJSON(central, &centralCfg); err == nil {
			if strings.TrimSpace(centralCfg.ConnectionStrings.PunchDataDb) != "" {
				cfg.ConnectionStrings.PunchDataDb = centralCfg.ConnectionStrings.PunchDataDb
			}
			if strings.TrimSpace(centralCfg.ConnectionStrings.RemoteZktecoDb) != "" {
				cfg.ConnectionStrings.RemoteZktecoDb = centralCfg.ConnectionStrings.RemoteZktecoDb
			}
		}
	}

	applyEnvOverrides(cfg)
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

func applyEnvOverrides(cfg *AppConfig) {
	if v := os.Getenv("PUNCHDATA_SERVER_ADDRESS"); v != "" {
		cfg.Server.Address = v
	}
	if v := os.Getenv("PUNCHDATA_CONNECTIONSTRING"); v != "" {
		cfg.ConnectionStrings.PunchDataDb = v
	}
	if v := os.Getenv("PUNCHDATA_REMOTE_CONNECTIONSTRING"); v != "" {
		cfg.ConnectionStrings.RemoteZktecoDb = v
	}
	if v := os.Getenv("PUNCHDATA_JWT_SIGNINGKEY"); v != "" {
		cfg.Jwt.SigningKey = v
	}
	if v := os.Getenv("PUNCHDATA_JWT_ISSUER"); v != "" {
		cfg.Jwt.Issuer = v
	}
	if v := os.Getenv("PUNCHDATA_JWT_AUDIENCE"); v != "" {
		cfg.Jwt.Audience = v
	}
}

func applyDefaults(cfg *AppConfig) {
	if cfg.Server.Address == "" {
		cfg.Server.Address = ":5050"
	}
	if cfg.PunchData.MaxUploadMB <= 0 {
		cfg.PunchData.MaxUploadMB = 32
	}
	if cfg.PunchData.Source == "" {
		cfg.PunchData.Source = "Device"
	}
	if cfg.PunchData.SyncIntervalMinutes <= 0 {
		cfg.PunchData.SyncIntervalMinutes = 30
	}
	if cfg.RemoteCollect.Source == "" {
		cfg.RemoteCollect.Source = "ZKTecoRemote"
	}
	if cfg.RemoteCollect.DefaultBatchSize <= 0 {
		cfg.RemoteCollect.DefaultBatchSize = 500
	}
	if cfg.RemoteCollect.MaxBatchSize <= 0 {
		cfg.RemoteCollect.MaxBatchSize = 2000
	}
	if cfg.RemoteCollect.MaxRowsPerCollect <= 0 {
		cfg.RemoteCollect.MaxRowsPerCollect = 200000
	}
	if cfg.RemoteCollect.DefaultLookbackDays <= 0 {
		cfg.RemoteCollect.DefaultLookbackDays = 62
	}
	if cfg.RabbitMQ.ExchangeName == "" {
		cfg.RabbitMQ.ExchangeName = "erp.events"
	}
	if cfg.RabbitMQ.UserName == "" {
		cfg.RabbitMQ.UserName = "erp"
	}
	if cfg.RabbitMQ.Password == "" {
		cfg.RabbitMQ.Password = "erp_dev_password"
	}
	if cfg.RabbitMQ.HostName == "" {
		cfg.RabbitMQ.HostName = "localhost"
	}
	if cfg.Logging.Level == "" {
		cfg.Logging.Level = "info"
	}
}

// projectRoot finds the directory that contains go.mod, walking up from CWD.
// We fall back to the directory containing the executable as a courtesy.
func projectRoot() (string, error) {
	if dir, err := os.Getwd(); err == nil {
		if p := walkUpForFile(dir, "go.mod"); p != "" {
			return p, nil
		}
	}
	if exe, err := os.Executable(); err == nil {
		if p := walkUpForFile(filepath.Dir(exe), "appsettings.json"); p != "" {
			return p, nil
		}
	}
	return "", fmt.Errorf("could not locate project root (go.mod / appsettings.json)")
}

func walkUpForFile(start, fileName string) string {
	dir := start
	for i := 0; i < 8; i++ {
		if _, err := os.Stat(filepath.Join(dir, fileName)); err == nil {
			return dir
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return ""
		}
		dir = parent
	}
	return ""
}
