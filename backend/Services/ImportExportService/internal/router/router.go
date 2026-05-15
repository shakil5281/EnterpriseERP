package router

import (
	"github.com/enterprise-erp/importexport/internal/handlers"
	"github.com/enterprise-erp/importexport/internal/middleware"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

type Options struct {
	AllowedOrigins []string
	Jwt            middleware.JwtConfig
	Health         *handlers.HealthHandler
	Import         *handlers.ImportHandler
	Export         *handlers.ExportHandler
	Jobs           *handlers.JobsHandler
	Templates      *handlers.TemplateHandler
}

func New(opts Options) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.TraceID())
	r.Use(corsMiddleware(opts.AllowedOrigins))

	r.GET("/health", opts.Health.Get)

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.GET("/", func(c *gin.Context) { c.Redirect(302, "/swagger/index.html") })

	gatewaySwagger := ginSwagger.WrapHandler(
		swaggerFiles.Handler,
		ginSwagger.URL("/api/v1/import-export/swagger/doc.json"),
	)
	r.GET("/api/v1/import-export/swagger/*any", gatewaySwagger)

	api := r.Group("/api/v1/import-export")
	api.Use(middleware.JWTAuth(opts.Jwt))
	api.Use(middleware.RequireAnyRole("Admin", "HRAdmin", "SuperAdmin", "ImportExport"))
	{
		api.POST("/import/:module/preview", opts.Import.Preview)
		api.POST("/import/:module/confirm", opts.Import.Confirm)

		api.POST("/export/:module", opts.Export.Create)

		api.GET("/templates/:module/download", opts.Templates.Download)

		api.GET("/import-jobs", opts.Jobs.ListImportJobs)
		api.GET("/import-jobs/:id", opts.Jobs.GetImportJob)
		api.GET("/import-jobs/:id/error-file", opts.Jobs.DownloadImportErrorFile)

		api.GET("/export-jobs", opts.Jobs.ListExportJobs)
		api.GET("/export-jobs/:id/download", opts.Jobs.DownloadExportJob)
	}

	return r
}

func corsMiddleware(origins []string) gin.HandlerFunc {
	cfg := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
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
