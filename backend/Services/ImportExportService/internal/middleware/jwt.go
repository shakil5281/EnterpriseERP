package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/enterprise-erp/importexport/internal/response"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type JwtConfig struct {
	Issuer     string
	Audience   string
	SigningKey string
}

const (
	CtxUserID       = "auth.userId"
	CtxRoles        = "auth.roles"
	CtxPermissions  = "auth.permissions"
	CtxCompanyID    = "auth.companyId"
)

func JWTAuth(cfg JwtConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.GetHeader("Authorization")
		if !strings.HasPrefix(h, "Bearer ") {
			response.FailWithStatus(c, http.StatusUnauthorized, response.Err("AUTH", "missing bearer token"))
			c.Abort()
			return
		}
		raw := strings.TrimSpace(strings.TrimPrefix(h, "Bearer "))
		token, err := jwt.Parse(raw, func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("signing method")
			}
			return []byte(cfg.SigningKey), nil
		},
			jwt.WithIssuer(cfg.Issuer),
			jwt.WithAudience(cfg.Audience),
			jwt.WithValidMethods([]string{"HS256"}),
		)
		if err != nil || !token.Valid {
			response.FailWithStatus(c, http.StatusUnauthorized, response.Err("AUTH", "invalid token"))
			c.Abort()
			return
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			response.FailWithStatus(c, http.StatusUnauthorized, response.Err("AUTH", "claims"))
			c.Abort()
			return
		}
		uid := extractUserID(claims)
		if uid == uuid.Nil {
			response.FailWithStatus(c, http.StatusUnauthorized, response.Err("AUTH", "no sub"))
			c.Abort()
			return
		}
		c.Set(CtxUserID, uid)
		c.Set(CtxRoles, extractRoles(claims))
		c.Set(CtxPermissions, extractPermissions(claims))
		if cid := extractCompanyID(claims); cid != nil {
			c.Set(CtxCompanyID, *cid)
		}
		c.Next()
	}
}

func extractCompanyID(claims jwt.MapClaims) *uuid.UUID {
	for _, k := range []string{"companyId", "company_id", "CompanyId"} {
		if v, ok := claims[k].(string); ok {
			if id, err := uuid.Parse(v); err == nil {
				return &id
			}
		}
	}
	return nil
}

func extractUserID(claims jwt.MapClaims) uuid.UUID {
	for _, k := range []string{"sub", "nameid"} {
		if v, ok := claims[k].(string); ok {
			if id, err := uuid.Parse(v); err == nil {
				return id
			}
		}
	}
	return uuid.Nil
}

func extractPermissions(claims jwt.MapClaims) []string {
	var out []string
	seen := map[string]struct{}{}
	for _, k := range []string{"permission", "permissions"} {
		v, ok := claims[k]
		if !ok {
			continue
		}
		switch t := v.(type) {
		case string:
			out = appendPermission(out, seen, t)
		case []any:
			for _, x := range t {
				if s, ok := x.(string); ok {
					out = appendPermission(out, seen, s)
				}
			}
		}
	}
	return out
}

func appendPermission(out []string, seen map[string]struct{}, perm string) []string {
	perm = strings.TrimSpace(perm)
	if perm == "" {
		return out
	}
	key := strings.ToLower(perm)
	if _, ok := seen[key]; ok {
		return out
	}
	seen[key] = struct{}{}
	return append(out, perm)
}

func extractRoles(claims jwt.MapClaims) []string {
	var out []string
	seen := map[string]struct{}{}
	for _, k := range []string{
		"role",
		"roles",
		"http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
		"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role",
	} {
		v, ok := claims[k]
		if !ok {
			continue
		}
		switch t := v.(type) {
		case string:
			out = appendRole(out, seen, t)
		case []any:
			for _, x := range t {
				if s, ok := x.(string); ok {
					out = appendRole(out, seen, s)
				}
			}
		}
	}
	return out
}

func appendRole(out []string, seen map[string]struct{}, role string) []string {
	role = strings.TrimSpace(role)
	if role == "" {
		return out
	}
	key := strings.ToLower(role)
	if _, ok := seen[key]; ok {
		return out
	}
	seen[key] = struct{}{}
	return append(out, role)
}
