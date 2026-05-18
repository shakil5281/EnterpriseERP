package timeutil

import (
	"strconv"
	"strings"
	"time"
)

const DefaultTimezone = "Asia/Dhaka"

var punchTimeLayouts = []string{
	time.RFC3339Nano,
	time.RFC3339,
	"2006-01-02T15:04:05",
	"2006-01-02 15:04:05",
	"2006-01-02 15:04",
	"02/01/2006 15:04:05",
	"02/01/2006 15:04",
	"01/02/2006 15:04:05",
	"01/02/2006 15:04",
	"2006/01/02 15:04:05",
}

// Location returns Asia/Dhaka (GMT+6), with a fixed offset fallback.
func Location() *time.Location {
	loc, err := time.LoadLocation(DefaultTimezone)
	if err != nil {
		return time.FixedZone("GMT+6", 6*60*60)
	}
	return loc
}

// Now returns the current time in Dhaka.
func Now() time.Time {
	return time.Now().In(Location())
}

// InDhaka converts any instant to the Dhaka wall-clock zone.
func InDhaka(t time.Time) time.Time {
	return t.In(Location())
}

// ParsePunchTime parses a punch timestamp. Values without a zone are treated as Dhaka local time.
func ParsePunchTime(raw string) (time.Time, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return time.Time{}, errEmptyPunchTime
	}

	loc := Location()
	if t, err := time.Parse(time.RFC3339Nano, raw); err == nil {
		return t.In(loc), nil
	}
	if t, err := time.Parse(time.RFC3339, raw); err == nil {
		return t.In(loc), nil
	}

	for _, layout := range punchTimeLayouts[2:] {
		if t, err := time.ParseInLocation(layout, raw, loc); err == nil {
			return t, nil
		}
	}

	if n, err := strconv.ParseInt(raw, 10, 64); err == nil {
		if len(raw) >= 13 {
			return time.UnixMilli(n).In(loc), nil
		}
		return time.Unix(n, 0).In(loc), nil
	}
	return time.Time{}, errUnrecognizedPunchTime
}

// FormatPunchTime formats a punch time for API / device payloads in Dhaka (+06:00).
func FormatPunchTime(t time.Time) string {
	return t.In(Location()).Format(time.RFC3339)
}

var (
	errEmptyPunchTime        = &parseError{"empty punch time"}
	errUnrecognizedPunchTime = &parseError{"unrecognised punch time format"}
)

type parseError struct{ msg string }

func (e *parseError) Error() string { return e.msg }
