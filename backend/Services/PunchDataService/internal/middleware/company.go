package middleware

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/enterprise-erp/punchdata/internal/response"
	"github.com/gin-gonic/gin"
)

const ContextCompanyID = "auth.companyId"

// CompanyScope optionally stores companyId from the JWT when present.
// It does not require X-Company-Id or any header.
func CompanyScope() gin.HandlerFunc {
	return func(c *gin.Context) {
		if companyID, ok := companyIDFromClaims(c); ok {
			c.Set(ContextCompanyID, companyID)
		}
		c.Next()
	}
}

// CompanyID returns companyId from query ?companyId=, then JWT context if set.
func CompanyID(c *gin.Context) (int, bool) {
	if v := strings.TrimSpace(c.Query("companyId")); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return n, true
		}
	}
	if v, ok := c.Get(ContextCompanyID); ok {
		if id, ok := v.(int); ok && id > 0 {
			return id, true
		}
	}
	return 0, false
}

// ResolveCompanyID picks companyId from the request body/value, then query, then JWT.
func ResolveCompanyID(c *gin.Context, requested int) (int, bool) {
	if requested > 0 {
		return requested, true
	}
	if id, ok := CompanyID(c); ok {
		return id, true
	}
	response.Fail(c, http.StatusBadRequest, response.Err("COMPANY_REQUIRED", "companyId is required in the request body or query."))
	return 0, false
}

// EnsureResourceCompany rejects access when an explicit companyId scope does not match the resource.
func EnsureResourceCompany(c *gin.Context, resourceCompanyID int) bool {
	if scope, ok := CompanyID(c); ok && scope != resourceCompanyID {
		response.Fail(c, http.StatusForbidden, response.Err("COMPANY_FORBIDDEN", "Resource belongs to another company."))
		return false
	}
	return true
}

func companyIDFromClaims(c *gin.Context) (int, bool) {
	claims, ok := c.Get("auth.claims")
	if !ok {
		return 0, false
	}
	m, ok := claims.(map[string]any)
	if !ok {
		return 0, false
	}
	for _, key := range []string{"companyId", "company_id", "CompanyId"} {
		switch v := m[key].(type) {
		case float64:
			if int(v) > 0 {
				return int(v), true
			}
		case string:
			if n, err := strconv.Atoi(strings.TrimSpace(v)); err == nil && n > 0 {
				return n, true
			}
		}
	}
	return 0, false
}
