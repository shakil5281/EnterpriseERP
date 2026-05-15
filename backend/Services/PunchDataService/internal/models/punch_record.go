package models

import (
	"time"

	"github.com/google/uuid"
)

// Direction enumerates the punch direction. Unknown is used when the source
// does not provide an in/out flag so downstream processing can still detect it.
const (
	DirectionIn      = "In"
	DirectionOut     = "Out"
	DirectionUnknown = "Unknown"
)

// PunchRecord is a single normalised punch event derived from a PunchLogFile.
type PunchRecord struct {
	ID           uuid.UUID `gorm:"type:nvarchar(36);primaryKey;column:Id" json:"id"`
	LogFileID    uuid.UUID `gorm:"type:nvarchar(36);column:LogFileId;index" json:"logFileId"`
	CompanyID    int       `gorm:"column:CompanyId;index:idx_punch_company_time,priority:1" json:"companyId"`
	EmployeeCode string    `gorm:"type:nvarchar(64);column:EmployeeCode;index:idx_punch_emp_time,priority:1" json:"employeeCode"`
	DeviceID     string    `gorm:"type:nvarchar(64);column:DeviceId" json:"deviceId"`
	PunchTime    time.Time `gorm:"column:PunchTime;index:idx_punch_company_time,priority:2;index:idx_punch_emp_time,priority:2" json:"punchTime"`
	Direction    string    `gorm:"type:nvarchar(16);column:Direction" json:"direction"`
	Source       string    `gorm:"type:nvarchar(64);column:Source" json:"source"`
	CreatedAt    time.Time `gorm:"column:CreatedAt" json:"createdAt"`
}

func (PunchRecord) TableName() string { return "PunchRecords" }
