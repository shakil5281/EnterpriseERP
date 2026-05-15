package processor

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/enterprise-erp/punchdata/internal/repository"
	"github.com/google/uuid"
)

// Service orchestrates parsing of a PunchLogFile payload and persistence of
// the resulting PunchRecord rows.
type Service struct {
	repo           *repository.Repository
	logger         *slog.Logger
	defaultSource  string
}

func NewService(repo *repository.Repository, logger *slog.Logger, defaultSource string) *Service {
	if defaultSource == "" {
		defaultSource = "Device"
	}
	return &Service{repo: repo, logger: logger, defaultSource: defaultSource}
}

// Result summarises a single processing run.
type Result struct {
	LogFileID    uuid.UUID `json:"logFileId"`
	Status       string    `json:"status"`
	RowCount     int       `json:"rowCount"`
	Inserted     int       `json:"inserted"`
	Skipped      int       `json:"skipped"`
	ProcessedAt  time.Time `json:"processedAt"`
	ErrorMessage string    `json:"errorMessage,omitempty"`
	Warnings     []string  `json:"warnings,omitempty"`
}

// ProcessLogFile parses, normalises and persists punches for one payload row.
// Existing records (from a previous failed run) are removed first.
func (s *Service) ProcessLogFile(ctx context.Context, id uuid.UUID) (*Result, error) {
	lf, err := s.repo.GetLogFileWithPayload(ctx, id)
	if err != nil {
		return nil, err
	}

	lf.Status = models.StatusProcessing
	lf.ErrorMessage = nil
	if err := s.repo.UpdateLogFile(ctx, lf); err != nil {
		return nil, fmt.Errorf("mark processing: %w", err)
	}

	res := &Result{LogFileID: lf.ID, ProcessedAt: time.Now().UTC()}

	if err := s.repo.DeletePunchRecordsForLog(ctx, lf.ID); err != nil {
		return s.fail(ctx, lf, res, fmt.Errorf("clear previous records: %w", err))
	}

	batch, err := Parse(lf.ContentType, lf.FileName, lf.RawPayload)
	if err != nil {
		return s.fail(ctx, lf, res, fmt.Errorf("parse payload: %w", err))
	}

	defaults := Defaults{
		CompanyID: lf.CompanyID,
		DeviceID:  lf.DeviceID,
		Source:    s.defaultSource,
	}
	rows, warnings := Normalize(ctx, lf.ID, batch, defaults)

	if err := s.repo.InsertPunchRecords(ctx, rows); err != nil {
		return s.fail(ctx, lf, res, fmt.Errorf("insert punches: %w", err))
	}

	now := time.Now().UTC()
	lf.RowCount = len(batch.Records)
	lf.Status = models.StatusCompleted
	lf.ProcessedAt = &now
	if err := s.repo.UpdateLogFile(ctx, lf); err != nil {
		s.logger.Warn("failed to update log file status to Completed", "logFileId", lf.ID, "error", err)
	}

	res.RowCount = len(batch.Records)
	res.Inserted = len(rows)
	res.Skipped = len(batch.Records) - len(rows)
	res.Status = models.StatusCompleted
	res.Warnings = warnings
	res.ProcessedAt = now

	s.logger.Info("processed punch log",
		"logFileId", lf.ID,
		"company", lf.CompanyID,
		"rows", res.RowCount,
		"inserted", res.Inserted,
		"skipped", res.Skipped,
	)
	return res, nil
}

// ProcessPending runs ProcessLogFile for every pending payload up to limit.
func (s *Service) ProcessPending(ctx context.Context, limit int) ([]Result, error) {
	pending, err := s.repo.ListPendingLogFiles(ctx, limit)
	if err != nil {
		return nil, err
	}
	results := make([]Result, 0, len(pending))
	for _, p := range pending {
		r, err := s.ProcessLogFile(ctx, p.ID)
		if err != nil {
			s.logger.Error("processing failed", "logFileId", p.ID, "error", err)
			continue
		}
		results = append(results, *r)
	}
	return results, nil
}

func (s *Service) fail(ctx context.Context, lf *models.PunchLogFile, res *Result, cause error) (*Result, error) {
	msg := cause.Error()
	if len(msg) > 1900 {
		msg = msg[:1900] + "..."
	}
	trim := strings.TrimSpace(msg)
	lf.Status = models.StatusFailed
	lf.ErrorMessage = &trim
	if uerr := s.repo.UpdateLogFile(ctx, lf); uerr != nil {
		s.logger.Warn("failed to update log file status to Failed", "logFileId", lf.ID, "error", uerr)
	}
	res.Status = models.StatusFailed
	res.ErrorMessage = trim
	return res, cause
}
