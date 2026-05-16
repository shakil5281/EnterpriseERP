package templatesvc

import (
	"github.com/xuri/excelize/v2"
)

// BuildEmployeeImportTemplate produces multi-sheet workbook: Instructions + Template + Sample.
func BuildEmployeeImportTemplate() (*excelize.File, error) {
	f := excelize.NewFile()
	_ = f.SetSheetName("Sheet1", "Instructions")
	inst := "Instructions"
	_ = f.SetCellValue(inst, "A1", "Employee Import Template")
	_ = f.SetCellValue(inst, "A3", "1. Fill the Template sheet. Required columns: EmployeeCode, EmployeeName, CompanyCode, DepartmentName, DesignationName, JoiningDate, GrossSalary, Phone, Email, Status")
	_ = f.SetCellValue(inst, "A4", "2. Inactive employees are rejected on import.")
	_ = f.SetCellValue(inst, "A5", "3. Use Preview API before Confirm.")

	tpl := "Template"
	f.NewSheet(tpl)
	headers := []string{"EmployeeCode", "EmployeeName", "CompanyCode", "DepartmentName", "DesignationName", "JoiningDate", "GrossSalary", "Phone", "Email", "Status"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(tpl, cell, h)
	}
	style, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true}, Fill: excelize.Fill{Type: "pattern", Color: []string{"E8F5E9"}, Pattern: 1}})
	lastCol, _ := excelize.ColumnNumberToName(len(headers))
	_ = f.SetCellStyle(tpl, "A1", lastCol+"1", style)

	sample := "Sample"
	f.NewSheet(sample)
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(sample, cell, h)
	}
	_ = f.SetCellValue(sample, "A2", "E001")
	_ = f.SetCellValue(sample, "B2", "Karim Hasan")
	_ = f.SetCellValue(sample, "C2", "COMP-001")
	_ = f.SetCellValue(sample, "D2", "HR")
	_ = f.SetCellValue(sample, "E2", "Executive")
	_ = f.SetCellValue(sample, "F2", "2024-01-15")
	_ = f.SetCellValue(sample, "G2", 55000)
	_ = f.SetCellValue(sample, "H2", "01700000000")
	_ = f.SetCellValue(sample, "I2", "karim@example.com")
	_ = f.SetCellValue(sample, "J2", "Active")

	idx, _ := f.GetSheetIndex("Template")
	f.SetActiveSheet(idx)
	return f, nil
}

// BuildPayrollImportTemplate creates payroll import template.
func BuildPayrollImportTemplate() (*excelize.File, error) {
	f := excelize.NewFile()
	f.SetSheetName("Sheet1", "Template")
	h := []string{
		"EmployeeCode", "PayrollMonth", "GrossSalary", "BasicSalary", "HouseRent",
		"MedicalAllowance", "AttendanceDays", "OvertimeHours", "OvertimeAmount", "Deduction",
	}
	for i, col := range h {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue("Template", cell, col)
	}
	idx, _ := f.GetSheetIndex("Template")
	f.SetActiveSheet(idx)
	return f, nil
}

// BuildAttendanceImportTemplate creates attendance template sheets.
func BuildAttendanceImportTemplate() (*excelize.File, error) {
	f := excelize.NewFile()
	f.SetSheetName("Sheet1", "Template")
	h := []string{"EmployeeCode", "AttendanceDate", "ShiftCode", "InTime", "OutTime", "Status", "Remarks"}
	for i, col := range h {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue("Template", cell, col)
	}
	idx, _ := f.GetSheetIndex("Template")
	f.SetActiveSheet(idx)
	return f, nil
}
