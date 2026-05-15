package middleware

import (
	"net/http"
	"slices"
	"strings"

	"github.com/enterprise-erp/importexport/internal/response"
	"github.com/gin-gonic/gin"
)

// RequireAnyRole aborts with 403 unless caller has one of the roles (case-insensitive).
func RequireAnyRole(roles ...string) gin.HandlerFunc {
	lower := make([]string, len(roles))
	for i, r := range roles {
		lower[i] = strings.ToLower(strings.TrimSpace(r))
	}
	return func(c *gin.Context) {
		got, _ := c.Get(CtxRoles)
		list, _ := got.([]string)
		var glower []string
		for _, r := range list {
			glower = append(glower, strings.ToLower(strings.TrimSpace(r)))
		}
		ok := false
		for _, want := range lower {
			if want == "" {
				continue
			}
			if slices.Contains(glower, want) {
				ok = true
				break
			}
		}
		if !ok {
			response.FailWithStatus(c, http.StatusForbidden, response.Err("FORBIDDEN", "insufficient role"))
			c.Abort()
			return
		}
		c.Next()
	}
}
