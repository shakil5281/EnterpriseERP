package handlers

import (
	"net/http"
	"strings"

	"github.com/enterprise-erp/importexport/internal/response"
	reportexport "github.com/enterprise-erp/importexport/internal/services/reportexport"
	"github.com/gin-gonic/gin"
)

type ReportExportHandler struct{}

type ReportExportRequest struct {
	Title   string            `json:"title" binding:"required"`
	Format  string            `json:"format" binding:"required" example:"Excel"`
	Columns []string          `json:"columns" binding:"required"`
	Rows    [][]string        `json:"rows"`
	Meta    map[string]string `json:"meta"`
}

func (h *ReportExportHandler) Export(c *gin.Context) {
	var req ReportExportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("REPORT_EXPORT", err.Error()))
		return
	}

	format := strings.ToLower(strings.TrimSpace(req.Format))
	switch format {
	case "excel", "xlsx":
		bytes, err := reportexport.BuildXLSX(req.Title, req.Columns, req.Rows, req.Meta)
		if err != nil {
			response.FailWithStatus(c, http.StatusBadRequest, response.Err("REPORT_EXPORT", err.Error()))
			return
		}
		c.Header("Content-Disposition", "attachment; filename="+reportexport.SafeFileName(req.Title)+".xlsx")
		c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes)
	case "pdf":
		bytes, err := reportexport.BuildPDF(req.Title, req.Columns, req.Rows, req.Meta)
		if err != nil {
			response.FailWithStatus(c, http.StatusBadRequest, response.Err("REPORT_EXPORT", err.Error()))
			return
		}
		c.Header("Content-Disposition", "attachment; filename="+reportexport.SafeFileName(req.Title)+".pdf")
		c.Data(http.StatusOK, "application/pdf", bytes)
	default:
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("REPORT_EXPORT", "format must be Excel or PDF"))
	}
}
