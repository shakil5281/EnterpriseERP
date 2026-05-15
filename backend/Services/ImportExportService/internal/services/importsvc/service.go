package importsvc

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/enterprise-erp/importexport/internal/domain/enums"
	"github.com/enterprise-erp/importexport/internal/domain/models"
	"github.com/enterprise-erp/importexport/internal/dto"
	"github.com/enterprise-erp/importexport/internal/jobs"
	"github.com/enterprise-erp/importexport/internal/services/csvsvc"
	excelsvc "github.com/enterprise-erp/importexport/internal/services/excel"
	"github.com/enterprise-erp/importexport/internal/storage"
	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

const previewTTL = 2 * time.Hour

var payrollHeaders = []string{
	"EmployeeCode", "PayrollMonth", "GrossSalary", "BasicSalary", "HouseRent",
	"MedicalAllowance", "AttendanceDays", "OvertimeHours", "OvertimeAmount", "Deduction",
}

var shiftHeaders = []string{"EmployeeCode", "ShiftCode", "EffectiveFrom", "EffectiveTo", "Remarks"}
var leaveHeaders = []string{"EmployeeCode", "LeaveType", "FromDate", "ToDate", "Days", "Reason"}

type Service struct {
	DB               *gorm.DB
	Store            storage.LocalStorage
	ExportDir        string
	LargeThreshold   int
	AsynqClient      *asynq.Client
}

type previewCache struct {
	ModuleName    string          `json:"moduleName"`
	FileName      string          `json:"fileName"`
	FilePath      string          `json:"filePath"`
	ValidJSON     string          `json:"validJson"`
	Errors        []dto.RowError  `json:"errors"`
	TotalRows     int             `json:"totalRows"`
	ValidRows     int             `json:"validRows"`
	InvalidRows   int             `json:"invalidRows"`
}

func (s *Service) Preview(companyID, userID uuid.UUID, module, absFilePath, fileName string) (*dto.ImportPreviewResult, error) {
	mod := normalizeModule(module)
	validJSON, total, valid, invalid, errs, err := s.parseModule(mod, absFilePath)
	if err != nil {
		return nil, err
	}
	truncated := false
	if len(errs) > 200 {
		errs = errs[:200]
		truncated = true
	}
	cache := previewCache{
		ModuleName: mod, FileName: fileName, FilePath: absFilePath,
		ValidJSON: validJSON, Errors: errs,
		TotalRows: total, ValidRows: valid, InvalidRows: invalid,
	}
	payload, _ := json.Marshal(cache)
	sess := models.ImportPreviewSession{
		CompanyID: companyID, ModuleName: mod, FileName: fileName, FilePath: absFilePath,
		PayloadJSON: string(payload), ExpiresAt: time.Now().Add(previewTTL), CreatedBy: userID,
	}
	if err := s.DB.Create(&sess).Error; err != nil {
		return nil, err
	}
	return &dto.ImportPreviewResult{
		SessionID: sess.ID, TotalRows: total, ValidRows: valid, InvalidRows: invalid,
		Errors: errs, ErrorsTruncated: truncated,
	}, nil
}

func (s *Service) Confirm(companyID, userID uuid.UUID, sessionID uuid.UUID) (*dto.ImportJobDTO, error) {
	var sess models.ImportPreviewSession
	if err := s.DB.First(&sess, "id = ? AND company_id = ?", sessionID, companyID).Error; err != nil {
		return nil, fmt.Errorf("session not found")
	}
	if time.Now().After(sess.ExpiresAt) {
		return nil, fmt.Errorf("preview session expired")
	}
	var cache previewCache
	if err := json.Unmarshal([]byte(sess.PayloadJSON), &cache); err != nil {
		return nil, err
	}
	if cache.ValidRows > s.LargeThreshold && s.AsynqClient != nil {
		return s.enqueueLargeImport(companyID, userID, sess, cache)
	}
	return s.runImport(companyID, userID, sess, cache)
}

func (s *Service) enqueueLargeImport(companyID, userID uuid.UUID, sess models.ImportPreviewSession, cache previewCache) (*dto.ImportJobDTO, error) {
	now := time.Now()
	job := models.ImportJob{
		CompanyID: companyID, ModuleName: cache.ModuleName, ImportType: "Excel",
		FileName: sess.FileName, FilePath: sess.FilePath,
		TotalRows: cache.TotalRows, Status: string(enums.ImportPending),
		CreatedBy: userID, PreviewSession: sess.ID.String(), StartedAt: &now,
	}
	if err := s.DB.Create(&job).Error; err != nil {
		return nil, err
	}
	task, err := jobs.NewLargeImportTask(jobs.LargeImportPayload{
		ImportJobID: job.ID.String(), SessionID: sess.ID.String(),
	})
	if err != nil {
		return nil, err
	}
	if _, err := s.AsynqClient.Enqueue(task); err != nil {
		return nil, err
	}
	return toImportDTO(job), nil
}

func (s *Service) ProcessLargeImport(jobID, sessionID uuid.UUID) error {
	var job models.ImportJob
	if err := s.DB.First(&job, "id = ?", jobID).Error; err != nil {
		return err
	}
	var sess models.ImportPreviewSession
	if err := s.DB.First(&sess, "id = ?", sessionID).Error; err != nil {
		return err
	}
	var cache previewCache
	if err := json.Unmarshal([]byte(sess.PayloadJSON), &cache); err != nil {
		return err
	}
	job.Status = string(enums.ImportProcessing)
	_ = s.DB.Save(&job)
	_, err := s.finalizeImport(&job, sess.CompanyID, sess.CreatedBy, cache)
	return err
}

func (s *Service) runImport(companyID, userID uuid.UUID, sess models.ImportPreviewSession, cache previewCache) (*dto.ImportJobDTO, error) {
	now := time.Now()
	job := models.ImportJob{
		CompanyID: companyID, ModuleName: cache.ModuleName, ImportType: "Excel",
		FileName: sess.FileName, FilePath: sess.FilePath,
		TotalRows: cache.TotalRows, Status: string(enums.ImportProcessing),
		CreatedBy: userID, PreviewSession: sess.ID.String(), StartedAt: &now,
	}
	if err := s.DB.Create(&job).Error; err != nil {
		return nil, err
	}
	dtoJob, err := s.finalizeImport(&job, companyID, userID, cache)
	if err != nil {
		return nil, err
	}
	_ = s.DB.Delete(&sess)
	return dtoJob, nil
}

func (s *Service) finalizeImport(job *models.ImportJob, companyID, userID uuid.UUID, cache previewCache) (*dto.ImportJobDTO, error) {
	var staging []models.ImportStagingRow
	validCount := cache.ValidRows
	if cache.ValidJSON != "" && cache.ValidJSON != "[]" {
		staging = append(staging, models.ImportStagingRow{
			ImportJobID: job.ID, RowNumber: 0, ModuleName: cache.ModuleName,
			PayloadJSON: cache.ValidJSON, Status: "Staged",
		})
	}
	for _, e := range cache.Errors {
		_ = s.DB.Create(&models.ImportJobError{
			ImportJobID: job.ID, RowNumber: e.Row, Column: e.Column, Message: e.Message,
		}).Error
	}
	if len(cache.Errors) > 0 {
		errPath, err := s.writeErrorArtifact(job.ID, cache.Errors)
		if err == nil {
			job.ErrorFilePath = errPath
		}
	}
	if len(staging) > 0 {
		_ = s.DB.Create(&staging).Error
	}
	job.SuccessRows = validCount
	job.FailedRows = cache.InvalidRows
	now := time.Now()
	job.CompletedAt = &now
	if cache.InvalidRows > 0 && validCount > 0 {
		job.Status = string(enums.ImportCompleted)
		job.Remarks = "partial success"
	} else if cache.InvalidRows > 0 {
		job.Status = string(enums.ImportFailed)
	} else {
		job.Status = string(enums.ImportCompleted)
	}
	_ = s.DB.Save(job)
	return toImportDTO(*job), nil
}

func (s *Service) writeErrorArtifact(jobID uuid.UUID, errs []dto.RowError) (string, error) {
	dir := filepath.Join(s.Store.Root, s.ExportDir, "errors")
	_ = os.MkdirAll(dir, 0o750)
	xlsxPath := filepath.Join(dir, jobID.String()+"_errors.xlsx")
	f, err := excelsvc.BuildEmployeeErrorWorkbook(errs)
	if err != nil {
		csvPath := filepath.Join(dir, jobID.String()+"_errors.csv")
		if e := csvsvc.WriteEmployeeErrorCSV(csvPath, errs); e != nil {
			return "", e
		}
		rel, _ := filepath.Rel(s.Store.Root, csvPath)
		return rel, nil
	}
	if err := f.SaveAs(xlsxPath); err != nil {
		return "", err
	}
	rel, _ := filepath.Rel(s.Store.Root, xlsxPath)
	return rel, nil
}

func (s *Service) parseModule(mod, path string) (validJSON string, total, valid, invalid int, errs []dto.RowError, err error) {
	switch mod {
	case string(enums.ModuleEmployee):
		rows, e, err := excelsvc.ParseEmployeeImport(path)
		if err != nil {
			return "", 0, 0, 0, nil, err
		}
		b, _ := json.Marshal(rows)
		total = len(rows) + countUniqueErrorRows(e)
		valid = len(rows)
		invalid = countUniqueErrorRows(e)
		return string(b), total, valid, invalid, e, nil
	case string(enums.ModuleAttendance):
		rows, e, err := excelsvc.ParseAttendanceImport(path)
		if err != nil {
			return "", 0, 0, 0, nil, err
		}
		b, _ := json.Marshal(rows)
		total = len(rows) + countUniqueErrorRows(e)
		valid = len(rows)
		invalid = countUniqueErrorRows(e)
		return string(b), total, valid, invalid, e, nil
	case string(enums.ModulePayroll):
		return parseGeneric(path, payrollHeaders)
	case string(enums.ModuleShift):
		return parseGeneric(path, shiftHeaders)
	case string(enums.ModuleLeave):
		return parseGeneric(path, leaveHeaders)
	default:
		return "", 0, 0, 0, nil, fmt.Errorf("unsupported module: %s", mod)
	}
}

func parseGeneric(path string, headers []string) (string, int, int, int, []dto.RowError, error) {
	rows, errs, err := excelsvc.ParseNumericSheet(path, headers)
	if err != nil {
		return "", 0, 0, 0, nil, err
	}
	b, _ := json.Marshal(rows)
	total := len(rows) + countUniqueErrorRows(errs)
	return string(b), total, len(rows), countUniqueErrorRows(errs), errs, nil
}

func countUniqueErrorRows(errs []dto.RowError) int {
	seen := map[int]struct{}{}
	for _, e := range errs {
		if e.Row > 0 {
			seen[e.Row] = struct{}{}
		}
	}
	return len(seen)
}

func (s *Service) ListImportJobs(companyID uuid.UUID, module string, limit int) ([]dto.ImportJobDTO, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	q := s.DB.Where("company_id = ?", companyID).Order("created_at desc").Limit(limit)
	if module != "" {
		q = q.Where("module_name = ?", normalizeModule(module))
	}
	var jobs []models.ImportJob
	if err := q.Find(&jobs).Error; err != nil {
		return nil, err
	}
	out := make([]dto.ImportJobDTO, len(jobs))
	for i, j := range jobs {
		out[i] = *toImportDTO(j)
	}
	return out, nil
}

func (s *Service) GetImportJob(companyID, id uuid.UUID) (*dto.ImportJobDTO, error) {
	var job models.ImportJob
	if err := s.DB.First(&job, "id = ? AND company_id = ?", id, companyID).Error; err != nil {
		return nil, err
	}
	return toImportDTO(job), nil
}

func (s *Service) ErrorFilePath(companyID, id uuid.UUID) (string, error) {
	var job models.ImportJob
	if err := s.DB.First(&job, "id = ? AND company_id = ?", id, companyID).Error; err != nil {
		return "", err
	}
	if job.ErrorFilePath == "" {
		return "", fmt.Errorf("no error file")
	}
	return filepath.Join(s.Store.Root, job.ErrorFilePath), nil
}

func (s *Service) Export(companyID, userID uuid.UUID, module, format string, _ map[string]any) (*dto.ExportJobDTO, string, error) {
	mod := normalizeModule(module)
	fm := strings.TrimSpace(format)
	if fm == "" {
		fm = string(enums.FormatExcel)
	}
	if strings.EqualFold(fm, string(enums.FormatPDF)) {
		return nil, "", fmt.Errorf("PDF export is not supported; use Excel or CSV")
	}
	job := models.ExportJob{
		CompanyID: companyID, ModuleName: mod, ExportType: mod,
		Format: fm, Status: string(enums.ExportProcessing), CreatedBy: userID,
	}
	if err := s.DB.Create(&job).Error; err != nil {
		return nil, "", err
	}
	rel, fileName, err := s.buildExportFile(mod, fm, job.ID)
	if err != nil {
		job.Status = string(enums.ExportFailed)
		_ = s.DB.Save(&job)
		return nil, "", err
	}
	now := time.Now()
	job.FilePath = rel
	job.FileName = fileName
	job.Status = string(enums.ExportCompleted)
	job.CompletedAt = &now
	_ = s.DB.Save(&job)
	return toExportDTO(job), filepath.Join(s.Store.Root, rel), nil
}

func (s *Service) buildExportFile(module, format string, jobID uuid.UUID) (rel, name string, err error) {
	dir := filepath.Join(s.Store.Root, s.ExportDir)
	_ = os.MkdirAll(dir, 0o750)
	switch normalizeModule(module) {
	case string(enums.ModuleEmployee):
		f, err := excelsvc.ExportEmployeesExcel(sampleEmployees())
		if err != nil {
			return "", "", err
		}
		name = fmt.Sprintf("%s_employees.xlsx", jobID)
		full := filepath.Join(dir, name)
		if err := f.SaveAs(full); err != nil {
			return "", "", err
		}
		rel, _ = filepath.Rel(s.Store.Root, full)
		return rel, name, nil
	case string(enums.ModulePayroll), string(enums.ModuleSalarySheet):
		f, err := excelsvc.ExportPayrollExcel(samplePayroll())
		if err != nil {
			return "", "", err
		}
		name = fmt.Sprintf("%s_payroll.xlsx", jobID)
		full := filepath.Join(dir, name)
		if err := f.SaveAs(full); err != nil {
			return "", "", err
		}
		rel, _ = filepath.Rel(s.Store.Root, full)
		return rel, name, nil
	default:
		if strings.EqualFold(format, string(enums.FormatCSV)) {
			name = fmt.Sprintf("%s_%s.csv", jobID, module)
			full := filepath.Join(dir, name)
			if err := csvsvc.WriteRows(full, []string{"Message"}, [][]string{{"export placeholder — integrate HR data source"}}); err != nil {
				return "", "", err
			}
			rel, _ = filepath.Rel(s.Store.Root, full)
			return rel, name, nil
		}
		f := excelize.NewFile()
		_ = f.SetCellValue("Sheet1", "A1", "No data — configure integration for "+module)
		name = fmt.Sprintf("%s_%s.xlsx", jobID, module)
		full := filepath.Join(dir, name)
		if err := f.SaveAs(full); err != nil {
			return "", "", err
		}
		rel, _ = filepath.Rel(s.Store.Root, full)
		return rel, name, nil
	}
}

func (s *Service) ListExportJobs(companyID uuid.UUID, limit int) ([]dto.ExportJobDTO, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	var jobs []models.ExportJob
	if err := s.DB.Where("company_id = ?", companyID).Order("created_at desc").Limit(limit).Find(&jobs).Error; err != nil {
		return nil, err
	}
	out := make([]dto.ExportJobDTO, len(jobs))
	for i, j := range jobs {
		out[i] = *toExportDTO(j)
	}
	return out, nil
}

func (s *Service) GetExportJob(companyID, id uuid.UUID) (*models.ExportJob, error) {
	var job models.ExportJob
	if err := s.DB.First(&job, "id = ? AND company_id = ?", id, companyID).Error; err != nil {
		return nil, err
	}
	return &job, nil
}

func normalizeModule(m string) string {
	switch strings.ToLower(strings.TrimSpace(m)) {
	case "employee", "employees":
		return string(enums.ModuleEmployee)
	case "attendance":
		return string(enums.ModuleAttendance)
	case "payroll":
		return string(enums.ModulePayroll)
	case "shift":
		return string(enums.ModuleShift)
	case "leave":
		return string(enums.ModuleLeave)
	case "salarysheet", "salary-sheet":
		return string(enums.ModuleSalarySheet)
	default:
		m = strings.TrimSpace(m)
		if m == "" {
			return m
		}
		return strings.ToUpper(m[:1]) + strings.ToLower(m[1:])
	}
}

func toImportDTO(j models.ImportJob) *dto.ImportJobDTO {
	return &dto.ImportJobDTO{
		ID: j.ID, CompanyID: j.CompanyID, ModuleName: j.ModuleName, Status: j.Status,
		TotalRows: j.TotalRows, SuccessRows: j.SuccessRows, FailedRows: j.FailedRows,
		ErrorFilePath: j.ErrorFilePath, CreatedAt: j.CreatedAt.Format(time.RFC3339),
	}
}

func toExportDTO(j models.ExportJob) *dto.ExportJobDTO {
	return &dto.ExportJobDTO{
		ID: j.ID, ModuleName: j.ModuleName, Format: j.Format, Status: j.Status,
		FilePath: j.FilePath, CreatedAt: j.CreatedAt.Format(time.RFC3339),
	}
}

func sampleEmployees() []excelsvc.EmployeeExportRow {
	return []excelsvc.EmployeeExportRow{
		{EmployeeCode: "E001", EmployeeName: "Sample User", Department: "HR", Designation: "Executive", JoinDate: time.Now(), Status: "Active", GrossSalary: 55000},
	}
}

func samplePayroll() []excelsvc.PayrollExportRow {
	return []excelsvc.PayrollExportRow{
		{EmployeeCode: "E001", EmployeeName: "Sample User", Department: "HR", Designation: "Executive",
			GrossSalary: 55000, BasicSalary: 27500, HouseRent: 13750, MedicalAllowance: 2750,
			AttendanceDays: 26, OvertimeHours: 4, OvertimeAmount: 1200, Deduction: 500},
	}
}
