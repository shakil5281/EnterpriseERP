package importsvc

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/enterprise-erp/importexport/internal/domain/enums"
	"github.com/enterprise-erp/importexport/internal/domain/models"
	"github.com/enterprise-erp/importexport/internal/dto"
	excelsvc "github.com/enterprise-erp/importexport/internal/services/excel"
	"github.com/enterprise-erp/importexport/internal/services/hrclient"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type organogramRefs struct {
	DepartmentID  string
	SectionID     string
	DesignationID string
}

func (s *Service) applyEmployeeImport(job *models.ImportJob, companyID uuid.UUID, cache previewCache, bearer string) (successCount int, applyErrors []dto.RowError, err error) {
	if strings.TrimSpace(bearer) == "" {
		return 0, nil, fmt.Errorf("authorization token required for employee import")
	}
	if s.HR == nil {
		return 0, nil, fmt.Errorf("HR client is not configured")
	}
	if cache.ValidJSON == "" || cache.ValidJSON == "[]" {
		return 0, nil, nil
	}

	var rows []excelsvc.EmployeeImportRow
	if err := json.Unmarshal([]byte(cache.ValidJSON), &rows); err != nil {
		return 0, nil, fmt.Errorf("parse staged rows: %w", err)
	}

	companyIDStr := companyID.String()
	ctx := context.Background()

	for _, row := range rows {
		refs, resolveErr := s.resolveOrganogramRefs(companyIDStr, row.DepartmentName, row.DesignationName)
		if resolveErr != nil {
			applyErrors = append(applyErrors, dto.RowError{
				Row: row.RowIndex, Column: "Department/Designation", Message: resolveErr.Error(),
			})
			continue
		}

		empID := strings.TrimSpace(row.EmployeeID)
		var empIDPtr *string
		if empID != "" {
			empIDPtr = &empID
		}
		phone := strings.TrimSpace(row.Phone)
		var phonePtr *string
		if phone != "" {
			phonePtr = &phone
		}
		email := strings.TrimSpace(row.Email)
		var emailPtr *string
		if email != "" {
			emailPtr = &email
		}

		joinDate := row.JoiningDate.Format("2006-01-02T00:00:00Z")
		if row.JoiningDate.IsZero() && strings.TrimSpace(row.RawJoiningDate) != "" {
			joinDate = strings.TrimSpace(row.RawJoiningDate)
		}

		status := strings.TrimSpace(row.Status)
		employmentType := "Permanent"
		if strings.EqualFold(status, "Probation") {
			employmentType = "Probation"
		}

		gross := row.GrossSalary
		req := hrclient.CreateEmployeeRequest{
			CompanyID:           companyIDStr,
			PunchNumber:         row.PunchNumber,
			EmployeeID:          empIDPtr,
			FullName:            strings.TrimSpace(row.EmployeeName),
			Phone:               phonePtr,
			Email:               emailPtr,
			JoinDate:            joinDate,
			EmploymentType:      employmentType,
			DepartmentID:        refs.DepartmentID,
			SectionID:           strPtr(refs.SectionID),
			DesignationID:       refs.DesignationID,
			BasicSalary:         gross,
			HouseRent:           0,
			MedicalAllowance:    0,
			ConveyanceAllowance: 0,
			FoodAllowance:       0,
		}

		if err := s.HR.CreateEmployee(ctx, bearer, req); err != nil {
			applyErrors = append(applyErrors, dto.RowError{
				Row: row.RowIndex, Column: "Create", Message: err.Error(),
			})
			continue
		}
		successCount++
	}

	return successCount, applyErrors, nil
}

func strPtr(s string) *string {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	v := s
	return &v
}

func (s *Service) resolveOrganogramRefs(companyID, departmentName, designationName string) (organogramRefs, error) {
	deptName := strings.TrimSpace(departmentName)
	desigName := strings.TrimSpace(designationName)
	if deptName == "" || desigName == "" {
		return organogramRefs{}, fmt.Errorf("department and designation are required")
	}

	var dept models.CompanyDepartment
	err := s.CompanyDB.Where(
		"CompanyId = ? AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER(?)",
		companyID, deptName,
	).First(&dept).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return organogramRefs{}, fmt.Errorf("department %q not found for company", deptName)
		}
		return organogramRefs{}, err
	}

	var desig models.CompanyDesignation
	err = s.CompanyDB.Table("Designations AS ds").
		Select("ds.*").
		Joins("JOIN Sections AS s ON s.Id = ds.SectionId").
		Where("s.DepartmentId = ? AND UPPER(LTRIM(RTRIM(ds.NameEn))) = UPPER(?)", dept.ID, desigName).
		First(&desig).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return organogramRefs{}, fmt.Errorf("designation %q not found under department %q", desigName, deptName)
		}
		return organogramRefs{}, err
	}

	return organogramRefs{
		DepartmentID:  dept.ID,
		SectionID:     desig.SectionID,
		DesignationID: desig.ID,
	}, nil
}

func mergeRowErrors(a, b []dto.RowError) []dto.RowError {
	out := make([]dto.RowError, 0, len(a)+len(b))
	out = append(out, a...)
	out = append(out, b...)
	return out
}

func isEmployeeModule(module string) bool {
	return normalizeModule(module) == string(enums.ModuleEmployee)
}
