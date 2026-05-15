package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/enterprise-erp/punchdata/internal/repository"
	"github.com/enterprise-erp/punchdata/internal/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// PunchesHandler exposes read endpoints over the normalised punch records.
type PunchesHandler struct{ repo *repository.Repository }

func NewPunchesHandler(repo *repository.Repository) *PunchesHandler {
	return &PunchesHandler{repo: repo}
}

// List godoc
// @Summary      List processed punches
// @Description  Returns a paginated, filterable view over normalised punch records.
// @Tags         punches
// @Produce      json
// @Param        companyId     query  int     false  "Filter by company id"
// @Param        employeeCode  query  string  false  "Filter by employee code"
// @Param        deviceId      query  string  false  "Filter by device id"
// @Param        direction     query  string  false  "Filter by direction"  Enums(In, Out, Unknown)
// @Param        logFileId     query  string  false  "Filter by source log file id (uuid)"
// @Param        from          query  string  false  "Inclusive lower bound for punchTime (RFC3339 or YYYY-MM-DD)"
// @Param        to            query  string  false  "Inclusive upper bound for punchTime (RFC3339 or YYYY-MM-DD)"
// @Param        page          query  int     false  "Page number (1-based)"   default(1)
// @Param        pageSize      query  int     false  "Page size (max 500)"     default(100)
// @Success      200  {object}  response.ApiResponse[response.PagedResult[models.PunchRecord]]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      500  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/punches [get]
func (h *PunchesHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("pageSize", "100"))

	f := repository.PunchFilter{
		EmployeeCode: c.Query("employeeCode"),
		DeviceID:     c.Query("deviceId"),
		Direction:    c.Query("direction"),
		Page:         page,
		PageSize:     size,
	}
	if v := c.Query("companyId"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			f.CompanyID = &n
		}
	}
	if v := c.Query("logFileId"); v != "" {
		if id, err := uuid.Parse(v); err == nil {
			f.LogFileID = &id
		}
	}
	if v := c.Query("from"); v != "" {
		if t, err := parseTimeFlexible(v); err == nil {
			f.From = &t
		}
	}
	if v := c.Query("to"); v != "" {
		if t, err := parseTimeFlexible(v); err == nil {
			f.To = &t
		}
	}

	items, total, err := h.repo.ListPunches(c.Request.Context(), f)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("LIST_FAILED", err.Error()))
		return
	}
	response.OK(c, response.PagedResult[models.PunchRecord]{
		Items:      items,
		Page:       page,
		PageSize:   size,
		TotalCount: total,
	})
}

// ListForLog godoc
// @Summary      List punches for a single log file
// @Description  Returns every normalised punch record produced from the given log payload.
// @Tags         logs
// @Produce      json
// @Param        id        path   string  true   "Log file id (uuid)"
// @Param        page      query  int     false  "Page number (1-based)"  default(1)
// @Param        pageSize  query  int     false  "Page size (max 500)"    default(200)
// @Success      200  {object}  response.ApiResponse[response.PagedResult[models.PunchRecord]]
// @Failure      400  {object}  response.ApiResponse[any]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      500  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/logs/{id}/records [get]
func (h *PunchesHandler) ListForLog(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("INVALID_ID", "Invalid log id."))
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("pageSize", "200"))
	items, total, err := h.repo.ListPunches(c.Request.Context(), repository.PunchFilter{
		LogFileID: &id,
		Page:      page,
		PageSize:  size,
	})
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("LIST_FAILED", err.Error()))
		return
	}
	response.OK(c, response.PagedResult[models.PunchRecord]{
		Items:      items,
		Page:       page,
		PageSize:   size,
		TotalCount: total,
	})
}

func parseTimeFlexible(s string) (time.Time, error) {
	for _, layout := range []string{
		time.RFC3339Nano,
		time.RFC3339,
		"2006-01-02T15:04:05",
		"2006-01-02 15:04:05",
		"2006-01-02",
	} {
		if t, err := time.Parse(layout, s); err == nil {
			return t.UTC(), nil
		}
	}
	return time.Time{}, http.ErrNotSupported
}
