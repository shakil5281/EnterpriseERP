package middleware

import (
	"net/http"
	"strings"

	"github.com/enterprise-erp/punchdata/internal/response"
	"github.com/gin-gonic/gin"
)

// RequirePermission ensures the caller has at least one of the required permissions.
func RequirePermission(permissions ...string) gin.HandlerFunc {
	required := make(map[string]struct{}, len(permissions))
	for _, p := range permissions {
		required[strings.ToLower(strings.TrimSpace(p))] = struct{}{}
	}
	return func(c *gin.Context) {
		granted, _ := c.Get(ContextPermissions)
		list, _ := granted.([]string)
		for _, perm := range list {
			if _, ok := required[strings.ToLower(perm)]; ok {
				c.Next()
				return
			}
		}
		response.Fail(c, http.StatusForbidden, response.Err("PERMISSION_DENIED", "You do not have permission to perform this action."))
	}
}

// HasPermission checks permission without aborting.
func HasPermission(c *gin.Context, permission string) bool {
	granted, _ := c.Get(ContextPermissions)
	list, _ := granted.([]string)
	needle := strings.ToLower(strings.TrimSpace(permission))
	for _, perm := range list {
		if strings.ToLower(perm) == needle {
			return true
		}
	}
	return false
}
