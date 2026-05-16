package reportexport

import (
	"bytes"
	"fmt"
	"regexp"
	"strings"

	"github.com/xuri/excelize/v2"
)

func BuildXLSX(title string, columns []string, rows [][]string, meta map[string]string) ([]byte, error) {
	if len(columns) == 0 {
		return nil, fmt.Errorf("at least one column is required")
	}
	f := excelize.NewFile()
	sheet := "Report"
	f.SetSheetName("Sheet1", sheet)
	_ = f.SetCellValue(sheet, "A1", title)
	titleStyle, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true, Size: 16}})
	headerStyle, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true}, Fill: excelize.Fill{Type: "pattern", Color: []string{"D9EAF7"}, Pattern: 1}})
	_ = f.SetCellStyle(sheet, "A1", "A1", titleStyle)

	rowIndex := 3
	for key, value := range meta {
		_ = f.SetCellValue(sheet, fmt.Sprintf("A%d", rowIndex), key)
		_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", rowIndex), value)
		rowIndex++
	}
	rowIndex++

	for i, header := range columns {
		cell, _ := excelize.CoordinatesToCellName(i+1, rowIndex)
		_ = f.SetCellValue(sheet, cell, header)
	}
	lastCol, _ := excelize.ColumnNumberToName(len(columns))
	_ = f.SetCellStyle(sheet, fmt.Sprintf("A%d", rowIndex), fmt.Sprintf("%s%d", lastCol, rowIndex), headerStyle)
	_ = f.AutoFilter(sheet, fmt.Sprintf("A%d:%s%d", rowIndex, lastCol, rowIndex), nil)
	headerRow := rowIndex
	rowIndex++

	for _, row := range rows {
		for ci, value := range row {
			if ci >= len(columns) {
				break
			}
			cell, _ := excelize.CoordinatesToCellName(ci+1, rowIndex)
			_ = f.SetCellValue(sheet, cell, value)
		}
		rowIndex++
	}
	for i := range columns {
		col, _ := excelize.ColumnNumberToName(i + 1)
		_ = f.SetColWidth(sheet, col, col, 18)
	}
	_ = f.SetPanes(sheet, &excelize.Panes{Freeze: true, Split: false, XSplit: 0, YSplit: headerRow, TopLeftCell: fmt.Sprintf("A%d", headerRow+1), ActivePane: "bottomLeft"})

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func BuildPDF(title string, columns []string, rows [][]string, meta map[string]string) ([]byte, error) {
	if len(columns) == 0 {
		return nil, fmt.Errorf("at least one column is required")
	}
	lines := []string{title}
	for key, value := range meta {
		lines = append(lines, key+": "+value)
	}
	lines = append(lines, strings.Join(columns, " | "))
	for _, row := range rows {
		lines = append(lines, trimPdfLine(strings.Join(row, " | ")))
		if len(lines) >= 45 {
			lines = append(lines, "... truncated for PDF preview")
			break
		}
	}
	content := "BT /F1 9 Tf 36 790 Td "
	for i, line := range lines {
		if i > 0 {
			content += " T* "
		}
		content += "(" + escapePdf(line) + ")"
	}
	content += " ET"
	pdf := fmt.Sprintf(`%%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length %d >> stream
%s
endstream endobj
xref
0 6
0000000000 65535 f 
trailer << /Root 1 0 R /Size 6 >>
startxref
0
%%%%EOF`, len(content), content)
	return []byte(pdf), nil
}

func SafeFileName(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "" {
		return "report"
	}
	re := regexp.MustCompile(`[^a-z0-9]+`)
	return strings.Trim(re.ReplaceAllString(value, "-"), "-")
}

func trimPdfLine(value string) string {
	if len(value) <= 110 {
		return value
	}
	return value[:107] + "..."
}

func escapePdf(value string) string {
	value = strings.ReplaceAll(value, `\`, `\\`)
	value = strings.ReplaceAll(value, "(", `\(`)
	value = strings.ReplaceAll(value, ")", `\)`)
	return value
}
