package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// HealthHandler reports liveness + a basic DB ping.
type HealthHandler struct {
	db *gorm.DB
}

func NewHealthHandler(db *gorm.DB) *HealthHandler { return &HealthHandler{db: db} }

// HealthResponse is the payload returned by GET /health.
type HealthResponse struct {
	Service string `json:"service" example:"PunchDataService"`
	Status  string `json:"status"  example:"Healthy"`
	DB      string `json:"db,omitempty"`
}

// Get godoc
// @Summary      Health check
// @Description  Liveness probe + SQL Server ping. Returns 503 when the database is unreachable.
// @Tags         health
// @Produce      json
// @Success      200  {object}  HealthResponse
// @Failure      503  {object}  HealthResponse
// @Router       /health [get]
func (h *HealthHandler) Get(c *gin.Context) {
	out := gin.H{"service": "PunchDataService", "status": "Healthy"}
	if sqlDB, err := h.db.DB(); err == nil {
		if err := sqlDB.PingContext(c.Request.Context()); err != nil {
			out["status"] = "Degraded"
			out["db"] = err.Error()
			c.JSON(http.StatusServiceUnavailable, out)
			return
		}
	}
	c.JSON(http.StatusOK, out)
}
