using AttendanceService.Application.Common;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using AttendanceService.Domain.Entities;
using AttendanceService.Domain.Enums;
using Erp.BuildingBlocks.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace AttendanceService.Infrastructure.Services;

public sealed class DailyAttendanceProcessOrchestrator(
    IAttendanceDbContext db,
    IShiftServiceClient shiftClient,
    IAttendanceProcessingService processingService,
    IPunchRecordReader punchRecordReader,
    IEmployeeDirectory employeeDirectory,
    IPunchCompanyIdResolver punchCompanyIdResolver) : IDailyAttendanceProcessOrchestrator
{
    public async Task<ProcessDailyAttendanceResult> ProcessDayAsync(
        Guid companyId,
        DateTime date,
        IReadOnlyList<string>? employeeIDs = null,
        CancellationToken cancellationToken = default)
    {
        var punchCompanyId = punchCompanyIdResolver.Resolve(companyId);
        if (punchCompanyId is null or <= 0)
        {
            throw new InvalidOperationException(
                $"No PunchData company mapping for company {companyId}. " +
                "Set PunchData:CompanyIdByGuid or PunchData:DefaultCompanyId in configuration.");
        }

        var processDate = AttendanceDateRange.ToCalendarDate(date);

        IReadOnlyList<PunchRecordRow> punchRows;
        try
        {
            punchRows = await punchRecordReader.GetForCompanyAndRangeAsync(
                punchCompanyId.Value,
                processDate,
                processDate.AddDays(2),
                cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                $"Failed to read punch data for company {punchCompanyId} on {processDate:yyyy-MM-dd}. {ex.Message}",
                ex);
        }

        var employees = await employeeDirectory.ListByCompanyAsync(companyId, cancellationToken);
        if (employees.Count == 0)
        {
            throw new InvalidOperationException($"No active employees found for company {companyId}.");
        }

        if (employeeIDs is { Count: > 0 })
        {
            var filterTokens = employeeIDs
                .Select(e => e.Trim())
                .Where(e => e.Length > 0)
                .ToList();
            employees = employees
                .Where(e => filterTokens.Any(token => EmployeeFilterMatcher.Matches(e, token)))
                .ToList();
            if (employees.Count == 0)
            {
                throw new InvalidOperationException("No employees matched the provided EmployeeIDs filter.");
            }
        }

        var punchesByNumber = punchRows
            .Where(p => p.PunchNumber > 0)
            .GroupBy(p => p.PunchNumber)
            .ToDictionary(g => g.Key, g => g.ToList());

        var createdCount = 0;
        var updatedCount = 0;
        var skippedLockedCount = 0;
        var presentCount = 0;
        var absentCount = 0;
        var lateCount = 0;

        foreach (var employee in employees)
        {
            punchesByNumber.TryGetValue(employee.PunchNumber, out var dayPunchRows);
            dayPunchRows ??= [];

            var evaluation = ShiftEvaluationNormalizer.Normalize(
                await shiftClient.GetShiftEvaluationAsync(
                        companyId,
                        employee.Id,
                        processDate,
                        cancellationToken)
                    ?? ShiftEvaluationFallback.Create(companyId, employee.Id, processDate));

            dayPunchRows = await ExcludeNextDayTemporaryPunchesAsync(
                companyId,
                employee.Id,
                processDate,
                evaluation,
                dayPunchRows,
                cancellationToken);

            var claimedPunchIds = await GetClaimedPunchIdsAsync(
                companyId,
                employee.Id,
                processDate,
                dayPunchRows,
                cancellationToken);

            dayPunchRows = dayPunchRows
                .Where(p => p.PunchTime >= evaluation.PunchWindowStart && p.PunchTime < evaluation.PunchWindowEnd)
                .Where(p => !claimedPunchIds.Contains(p.Id))
                .OrderBy(p => p.PunchTime)
                .ToList();

            var attendance = await db.DailyAttendances
                .FirstOrDefaultAsync(
                    a => a.CompanyId == companyId
                        && a.EmployeeId == employee.Id
                        && a.AttendanceDate.Date == processDate,
                    cancellationToken);

            if (attendance is { IsPayrollLocked: true } or { IsApproved: true })
            {
                skippedLockedCount++;
                continue;
            }

            var punchInputs = dayPunchRows
                .Select(p => new AttendancePunchInput(p.PunchTime, p.Id))
                .ToList();

            var isNew = false;
            if (attendance is null)
            {
                isNew = true;
                attendance = new DailyAttendance
                {
                    Id = Guid.NewGuid(),
                    CompanyId = companyId,
                    EmployeeId = employee.Id,
                    PunchNumber = employee.PunchNumber,
                    EmployeeID = employee.EmployeeID,
                    AttendanceDate = processDate,
                    CreatedAt = BusinessTime.NowOffset,
                };
            }
            else
            {
                attendance.PunchNumber = employee.PunchNumber;
                attendance.EmployeeID = employee.EmployeeID;
                attendance.UpdatedAt = BusinessTime.NowOffset;
            }

            processingService.Process(attendance, punchInputs, evaluation, employee.IsOtEnabled);

            if (isNew)
            {
                db.DailyAttendances.Add(attendance);
                createdCount++;
            }
            else
            {
                updatedCount++;
            }

            await SyncDeviceLogsInWindowAsync(
                companyId,
                employee,
                evaluation.PunchWindowStart,
                evaluation.PunchWindowEnd,
                dayPunchRows,
                cancellationToken);

            switch (attendance.Status)
            {
                case AttendanceStatus.Absent:
                    absentCount++;
                    break;
                case AttendanceStatus.Late:
                    lateCount++;
                    presentCount++;
                    break;
                case AttendanceStatus.Present:
                case AttendanceStatus.EarlyOut:
                case AttendanceStatus.HolidayPresent:
                case AttendanceStatus.WeeklyOffPresent:
                    presentCount++;
                    break;
            }
        }

        await db.SaveChangesAsync(cancellationToken);

        return new ProcessDailyAttendanceResult(
            employees.Count,
            presentCount,
            absentCount,
            lateCount,
            createdCount,
            updatedCount,
            skippedLockedCount);
    }

    private async Task<List<PunchRecordRow>> ExcludeNextDayTemporaryPunchesAsync(
        Guid companyId,
        Guid employeeId,
        DateTime processDate,
        ShiftEvaluationDto evaluation,
        List<PunchRecordRow> punches,
        CancellationToken cancellationToken)
    {
        if (!IsGeneralDutyDayShift(evaluation)
            || evaluation.PunchWindowEnd.Date <= processDate.Date
            || string.Equals(evaluation.AssignmentSource, "Temporary", StringComparison.OrdinalIgnoreCase))
        {
            return punches;
        }

        var nextDate = processDate.Date.AddDays(1);
        var nextEvaluation = await shiftClient.GetShiftEvaluationAsync(
            companyId,
            employeeId,
            nextDate,
            cancellationToken);

        if (nextEvaluation is null)
        {
            return punches;
        }

        nextEvaluation = ShiftEvaluationNormalizer.Normalize(nextEvaluation);
        if (!string.Equals(nextEvaluation.AssignmentSource, "Temporary", StringComparison.OrdinalIgnoreCase))
        {
            return punches;
        }

        return punches
            .Where(p => p.PunchTime < nextEvaluation.PunchWindowStart || p.PunchTime >= nextEvaluation.PunchWindowEnd)
            .ToList();
    }

    private static bool IsGeneralDutyDayShift(ShiftEvaluationDto evaluation) =>
        !evaluation.IsCrossDay
        && string.Equals(evaluation.ShiftCategory, "GeneralDuty", StringComparison.OrdinalIgnoreCase);

    private async Task<HashSet<Guid>> GetClaimedPunchIdsAsync(
        Guid companyId,
        Guid employeeId,
        DateTime processDate,
        List<PunchRecordRow> punches,
        CancellationToken cancellationToken)
    {
        var candidateIds = punches
            .Select(p => p.Id)
            .Where(id => id != Guid.Empty)
            .ToHashSet();

        if (candidateIds.Count == 0)
        {
            return [];
        }

        var existingClaims = await db.DailyAttendances
            .AsNoTracking()
            .Where(a => a.CompanyId == companyId
                && a.EmployeeId == employeeId
                && a.AttendanceDate != processDate.Date
                && ((a.InPunchId.HasValue && candidateIds.Contains(a.InPunchId.Value))
                    || (a.OutPunchId.HasValue && candidateIds.Contains(a.OutPunchId.Value))))
            .Select(a => new { a.InPunchId, a.OutPunchId })
            .ToListAsync(cancellationToken);

        return existingClaims
            .SelectMany(a => new[] { a.InPunchId, a.OutPunchId })
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .ToHashSet();
    }

    private async Task SyncDeviceLogsInWindowAsync(
        Guid companyId,
        EmployeeDirectoryEntry employee,
        DateTime windowStart,
        DateTime windowEnd,
        List<PunchRecordRow> dayPunchRows,
        CancellationToken cancellationToken)
    {
        var existing = await db.DeviceLogs
            .Where(l => l.CompanyId == companyId
                && l.EmployeeId == employee.Id
                && l.PunchTime >= windowStart
                && l.PunchTime < windowEnd)
            .ToListAsync(cancellationToken);

        if (existing.Count > 0)
        {
            db.DeviceLogs.RemoveRange(existing);
        }

        foreach (var punch in dayPunchRows)
        {
            db.DeviceLogs.Add(new DeviceLog
            {
                Id = Guid.NewGuid(),
                CompanyId = companyId,
                EmployeeId = employee.Id,
                PunchNumber = employee.PunchNumber,
                EmployeeID = employee.EmployeeID,
                PunchTime = punch.PunchTime,
                DeviceSerial = punch.DeviceId,
                IsProcessed = true,
                CreatedAt = BusinessTime.Now,
            });
        }
    }
}
