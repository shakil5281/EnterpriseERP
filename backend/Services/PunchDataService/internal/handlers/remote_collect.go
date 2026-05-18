package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/enterprise-erp/punchdata/internal/collector"
	"github.com/enterprise-erp/punchdata/internal/middleware"
	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/enterprise-erp/punchdata/internal/repository"
	"github.com/enterprise-erp/punchdata/internal/response"
	"github.com/enterprise-erp/punchdata/internal/timeutil"
	"github.com/gin-gonic/gin"
)

// RemoteCollectHandler exposes read-only public SQL Server punch import on port 5050.
type RemoteCollectHandler struct {
	collector *collector.RemoteService
	repo      *repository.Repository
	enabled   bool
}

func NewRemoteCollectHandler(col *collector.RemoteService, repo *repository.Repository, enabled bool) *RemoteCollectHandler {
	return &RemoteCollectHandler{collector: col, repo: repo, enabled: enabled}
}

type remoteCollectBody struct {
	CompanyID    int        `json:"companyId"`
	From         *time.Time `json:"from,omitempty"`
	To           *time.Time `json:"to,omitempty"`
	BatchSize    int        `json:"batchSize,omitempty"`
	UseWatermark bool       `json:"useWatermark,omitempty"`
}

func (h *RemoteCollectHandler) requireEnabled(c *gin.Context) bool {
	if h.enabled && h.collector != nil {
		return true
	}
	response.Fail(c, http.StatusServiceUnavailable, response.Err("REMOTE_COLLECT_DISABLED", "Remote ZKTeco collect is not configured (set ConnectionStrings.RemoteZktecoDb)."))
	return false
}

// Collect godoc
// @Summary      Collect punches from public ZKTeco SQL Server
// @Description  Read-only SELECT from remote CHECKINOUT joined to USERINFO; maps BADGENUMBER to PunchRecords.EmployeeCode (ERP EmployeeCode). Pages through the full from/to window with deduplication. Does not modify the remote database. Omit from/to to import the last 62 days (configurable).
// @Tags         remote-collect
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body  remoteCollectBody  true  "Collect window"
// @Success      201   {object}  response.ApiResponse[collector.RemoteCollectResult]
// @Failure      400   {object}  response.ApiResponse[any]
// @Failure      401   {object}  response.ApiResponse[any]
// @Failure      502   {object}  response.ApiResponse[any]
// @Failure      503   {object}  response.ApiResponse[any]
// @Router       /api/v1/punch-data/remote/collect [post]
func (h *RemoteCollectHandler) Collect(c *gin.Context) {
	if !h.requireEnabled(c) {
		return
	}
	var body remoteCollectBody
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("INVALID_BODY", err.Error()))
		return
	}
	companyID, ok := middleware.ResolveCompanyID(c, body.CompanyID)
	if !ok {
		return
	}
	body.CompanyID = companyID

	result, err := h.collector.Collect(c.Request.Context(), collector.RemoteCollectRequest{
		CompanyID:    body.CompanyID,
		From:         body.From,
		To:           body.To,
		BatchSize:    body.BatchSize,
		UseWatermark: body.UseWatermark,
	})
	if err != nil {
		response.Fail(c, http.StatusBadGateway, response.Err("REMOTE_COLLECT_FAILED", err.Error()))
		return
	}
	response.Created(c, result)
}

// Preview godoc
// @Summary      Preview remote punch row count
// @Description  Counts mappable rows (CHECKINOUT with USERINFO badge) and unmapped rows in the time window without importing. Defaults to the last 24 hours when from/to are omitted.
// @Tags         remote-collect
// @Produce      json
// @Security     BearerAuth
// @Param        from  query  string  false  "RFC3339 start (default: now - 24h)"
// @Param        to    query  string  false  "RFC3339 end (default: now)"
// @Success      200   {object}  response.ApiResponse[remoteCollectPreviewResponse]
// @Failure      401   {object}  response.ApiResponse[any]
// @Failure      502   {object}  response.ApiResponse[any]
// @Failure      503   {object}  response.ApiResponse[any]
// @Router       /api/v1/punch-data/remote/collect/preview [get]
func (h *RemoteCollectHandler) Preview(c *gin.Context) {
	if !h.requireEnabled(c) {
		return
	}
	to := timeutil.Now()
	if v := c.Query("to"); v != "" {
		if t, err := time.Parse(time.RFC3339, v); err == nil {
			to = timeutil.InDhaka(t)
		}
	}
	from := to.Add(-24 * time.Hour)
	if v := c.Query("from"); v != "" {
		if t, err := time.Parse(time.RFC3339, v); err == nil {
			from = timeutil.InDhaka(t)
		}
	}
	mapped, unmapped, err := h.collector.PreviewDetail(c.Request.Context(), from, to)
	if err != nil {
		response.Fail(c, http.StatusBadGateway, response.Err("REMOTE_PREVIEW_FAILED", err.Error()))
		return
	}
	response.OK(c, remoteCollectPreviewResponse{
		From: from, To: to, RemoteRows: mapped, UnmappedRemote: unmapped, ReadOnly: true,
	})
}

// ListHistories godoc
// @Summary      List remote collect runs
// @Description  Paginated history of read-only imports from the public ZKTeco database.
// @Tags         remote-collect
// @Produce      json
// @Security     BearerAuth
// @Param        companyId  query  int  false  "Company filter"
// @Param        page       query  int  false  "Page (1-based)"  default(1)
// @Param        pageSize   query  int  false  "Page size (max 100)"  default(20)
// @Success      200  {object}  response.ApiResponse[response.PagedResult[models.RemoteCollectHistory]]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      500  {object}  response.ApiResponse[any]
// @Failure      503  {object}  response.ApiResponse[any]
// @Router       /api/v1/punch-data/remote/collect/histories [get]
func (h *RemoteCollectHandler) ListHistories(c *gin.Context) {
	if h.repo == nil {
		response.Fail(c, http.StatusServiceUnavailable, response.Err("REMOTE_COLLECT_DISABLED", "Remote collect history is unavailable."))
		return
	}
	companyID := 0
	if id, ok := middleware.CompanyID(c); ok {
		companyID = id
	}
	page, pageSize := 1, 20
	if v := c.Query("page"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			page = n
		}
	}
	if v := c.Query("pageSize"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			pageSize = n
		}
	}
	items, total, err := h.repo.ListCollectHistories(c.Request.Context(), companyID, page, pageSize)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("HISTORY_LIST_FAILED", err.Error()))
		return
	}
	response.OK(c, response.PagedResult[models.RemoteCollectHistory]{
		Items: items, Page: page, PageSize: pageSize, TotalCount: total,
	})
}
