package router

import (
	"github.com/enterprise-erp/punchdata/internal/handlers"
	"github.com/enterprise-erp/punchdata/internal/middleware"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// Options bundles everything the router needs from main.
type Options struct {
	AllowedOrigins []string
	Jwt            middleware.JwtConfig
	Health         *handlers.HealthHandler
	Logs           *handlers.LogsHandler
	Punches        *handlers.PunchesHandler
}

// New builds a Gin engine wired with middleware, health, and the punch-data
// routes.
func New(opts Options) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CorrelationID())
	r.Use(corsMiddleware(opts.AllowedOrigins))

	r.GET("/health", opts.Health.Get)

	// Direct (dev) swagger UI.
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.GET("/", func(c *gin.Context) { c.Redirect(302, "/swagger/index.html") })

	// Gateway-friendly swagger UI: reachable through ApiGateway as
	// /api/v1/punch-data/swagger/index.html . The URL override makes the UI
	// fetch its spec from the same prefix so it works behind the proxy too.
	gatewaySwagger := ginSwagger.WrapHandler(
		swaggerFiles.Handler,
		ginSwagger.URL("/api/v1/punch-data/swagger/doc.json"),
	)
	r.GET("/api/v1/punch-data/swagger/*any", gatewaySwagger)

	api := r.Group("/api/v1/punch-data")
	api.Use(middleware.JWTAuth(opts.Jwt))
	{
		logs := api.Group("/logs")
		{
			logs.POST("/upload", opts.Logs.Upload)
			logs.POST("/batch", opts.Logs.Batch)
			logs.GET("", opts.Logs.List)
			logs.GET("/:id", opts.Logs.Get)
			logs.GET("/:id/download", opts.Logs.Download)
			logs.GET("/:id/records", opts.Punches.ListForLog)
			logs.POST("/:id/process", opts.Logs.ProcessOne)
		}

		api.POST("/process", opts.Logs.ProcessAll)
		api.GET("/punches", opts.Punches.List)
	}

	return r
}

func corsMiddleware(origins []string) gin.HandlerFunc {
	cfg := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"X-Correlation-Id"},
		AllowCredentials: true,
		MaxAge:           600,
	}
	if len(origins) > 0 {
		cfg.AllowOrigins = origins
	} else {
		cfg.AllowOriginFunc = func(origin string) bool { return true }
	}
	return cors.New(cfg)
}
