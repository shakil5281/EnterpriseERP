package dto

import "github.com/google/uuid"

type RowError struct {
	Row     int    `json:"row"`
	Column  string `json:"column,omitempty"`
	Message string `json:"message"`
}

type ImportPreviewResult struct {
	SessionID    uuid.UUID   `json:"sessionId"`
	TotalRows    int         `json:"totalRows"`
	ValidRows    int         `json:"validRows"`
	InvalidRows  int         `json:"invalidRows"`
	Errors       []RowError  `json:"errors,omitempty"`
	ErrorsTruncated bool     `json:"errorsTruncated"`
	SampleValid  []any       `json:"sampleValid,omitempty"`
}

type ConfirmImportRequest struct {
	SessionID uuid.UUID `json:"sessionId" binding:"required"`
}

type ImportJobDTO struct {
	ID            uuid.UUID `json:"id"`
	CompanyID     uuid.UUID `json:"companyId"`
	ModuleName    string    `json:"moduleName"`
	Status        string    `json:"status"`
	TotalRows     int       `json:"totalRows"`
	SuccessRows   int       `json:"successRows"`
	FailedRows    int       `json:"failedRows"`
	ErrorFilePath string    `json:"errorFilePath,omitempty"`
	CreatedAt     string    `json:"createdAt"`
}

type ExportJobDTO struct {
	ID        uuid.UUID `json:"id"`
	ModuleName string   `json:"moduleName"`
	Format    string    `json:"format"`
	Status    string    `json:"status"`
	FilePath  string    `json:"filePath,omitempty"`
	CreatedAt string    `json:"createdAt"`
}
