using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceService.Application.Common;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Domain.Entities;
using AttendanceService.Domain.Enums;
using AttendanceService.Application.DTOs;

namespace AttendanceService.Application.Features.Attendance.Commands;

public record ProcessDailyAttendanceCommand(Guid CompanyId, DateTime Date) : IRequest<ProcessDailyAttendanceResult>;
public record UploadPunchLogsCommand(Guid CompanyId, List<PunchLogDto> Logs) : IRequest<int>;
public record ManualAdjustmentCommand(Guid Id, DateTime? InTime, DateTime? OutTime, string? Remarks, Guid AdminId) : IRequest<bool>;
public record ApproveAttendanceCommand(Guid Id, Guid AdminId) : IRequest<bool>;

public class AttendanceCommandHandlers(
    IAttendanceDbContext db,
    IShiftServiceClient shiftClient,
    IAttendanceProcessingService processingService,
    IPunchRecordReader punchRecordReader,
    IEmployeeDirectory employeeDirectory,
    IPunchCompanyIdResolver punchCompanyIdResolver) :
    IRequestHandler<ProcessDailyAttendanceCommand, ProcessDailyAttendanceResult>,
    IRequestHandler<UploadPunchLogsCommand, int>,
    IRequestHandler<ManualAdjustmentCommand, bool>,
    IRequestHandler<ApproveAttendanceCommand, bool>
{
    public async Task<ProcessDailyAttendanceResult> Handle(ProcessDailyAttendanceCommand request, CancellationToken cancellationToken)
    {
        var punchCompanyId = punchCompanyIdResolver.Resolve(request.CompanyId);
        if (punchCompanyId is null or <= 0)
        {
            throw new InvalidOperationException(
                $"No PunchData company mapping for company {request.CompanyId}. " +
                "Set PunchData:CompanyIdByGuid or PunchData:DefaultCompanyId in configuration.");
        }

        var processDate = AttendanceDateRange.ToCalendarDate(request.Date);

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

        var employees = await employeeDirectory.ListByCompanyAsync(request.CompanyId, cancellationToken);
        if (employees.Count == 0)
        {
            throw new InvalidOperationException($"No active employees found for company {request.CompanyId}.");
        }

        var punchesByNumber = punchRows
            .Where(p => p.PunchNumber > 0)
            .GroupBy(p => p.PunchNumber)
            .ToDictionary(g => g.Key, g => g.ToList());

        var presentCount = 0;
        var absentCount = 0;
        var lateCount = 0;

        foreach (var employee in employees)
        {
            punchesByNumber.TryGetValue(employee.PunchNumber, out var dayPunchRows);
            dayPunchRows ??= [];

            var shift = await shiftClient.GetApplicableShiftAsync(request.CompanyId, employee.Id, processDate)
                ?? CreateFallbackShift(request.CompanyId);

            var punchWindow = CalculatePunchWindow(processDate, shift);
            dayPunchRows = dayPunchRows
                .Where(p => p.PunchTime >= punchWindow.StartInclusive && p.PunchTime < punchWindow.EndExclusive)
                .OrderBy(p => p.PunchTime)
                .ToList();

            var punchInputs = dayPunchRows
                .Select(p => new AttendancePunchInput(p.PunchTime))
                .ToList();

            var deviceLogs = dayPunchRows
                .Select(p => new DeviceLog
                {
                    Id = Guid.NewGuid(),
                    CompanyId = request.CompanyId,
                    EmployeeId = employee.Id,
                    PunchNumber = employee.PunchNumber,
                    EmployeeID = employee.EmployeeID,
                    PunchTime = p.PunchTime,
                    DeviceSerial = p.DeviceId,
                    IsProcessed = true,
                    CreatedAt = DateTime.UtcNow,
                })
                .OrderBy(p => p.PunchTime)
                .ToList();

            await UpsertDeviceLogsAsync(request.CompanyId, employee.Id, processDate, deviceLogs, cancellationToken);

            var isNew = false;
            var attendance = await db.DailyAttendances
                .FirstOrDefaultAsync(
                    a => a.EmployeeId == employee.Id && a.AttendanceDate.Date == processDate,
                    cancellationToken);

            if (attendance is null)
            {
                isNew = true;
                attendance = new DailyAttendance
                {
                    Id = Guid.NewGuid(),
                    CompanyId = request.CompanyId,
                    EmployeeId = employee.Id,
                    PunchNumber = employee.PunchNumber,
                    EmployeeID = employee.EmployeeID,
                    AttendanceDate = processDate,
                    CreatedAt = DateTimeOffset.UtcNow,
                };
            }
            else
            {
                attendance.PunchNumber = employee.PunchNumber;
                attendance.EmployeeID = employee.EmployeeID;
            }

            processingService.Process(attendance, punchInputs, shift);

            if (isNew)
            {
                db.DailyAttendances.Add(attendance);
            }

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
                    presentCount++;
                    break;
            }
        }

        await db.SaveChangesAsync(cancellationToken);

        return new ProcessDailyAttendanceResult(employees.Count, presentCount, absentCount, lateCount);
    }

    private async Task UpsertDeviceLogsAsync(
        Guid companyId,
        Guid employeeId,
        DateTime processDate,
        List<DeviceLog> dayPunches,
        CancellationToken cancellationToken)
    {
        var existing = await db.DeviceLogs
            .Where(l => l.CompanyId == companyId
                && l.EmployeeId == employeeId
                && l.PunchTime >= processDate
                && l.PunchTime < processDate.AddDays(1))
            .ToListAsync(cancellationToken);

        foreach (var punch in dayPunches)
        {
            var duplicate = existing.Any(e =>
                e.PunchTime == punch.PunchTime
                && e.PunchNumber == punch.PunchNumber
                && string.Equals(e.DeviceSerial ?? "", punch.DeviceSerial ?? "", StringComparison.OrdinalIgnoreCase));

            if (duplicate)
            {
                continue;
            }

            db.DeviceLogs.Add(punch);
            existing.Add(punch);
        }
    }

    private static ShiftDto CreateFallbackShift(Guid companyId) =>
        new(
            Id: Guid.Empty,
            CompanyId: companyId,
            ShiftCode: "GEN",
            ShiftName: "General",
            ShiftType: "Day",
            StartTime: new TimeSpan(9, 0, 0),
            EndTime: new TimeSpan(18, 0, 0),
            IsCrossDay: false,
            IsGeneralDuty: true,
            IsDefault: true,
            IsActive: true);

    private static (DateTime StartInclusive, DateTime EndExclusive) CalculatePunchWindow(DateTime processDate, ShiftDto shift)
    {
        var shiftStart = processDate.Date.Add(shift.StartTime);
        var shiftEnd = processDate.Date.Add(shift.EndTime);
        if (shift.IsCrossDay || shift.EndTime <= shift.StartTime)
        {
            shiftEnd = shiftEnd.AddDays(1);
        }

        return (shiftStart.AddHours(-6), shiftEnd.AddHours(8));
    }

    public async Task<bool> Handle(ManualAdjustmentCommand request, CancellationToken cancellationToken)
    {
        var attendance = await db.DailyAttendances.FindAsync([request.Id], cancellationToken);
        if (attendance == null) return false;

        if (request.InTime.HasValue)
        {
            attendance.InTime = request.InTime;
            attendance.IsManualIn = true;
        }
        if (request.OutTime.HasValue)
        {
            attendance.OutTime = request.OutTime;
            attendance.IsManualOut = true;
        }
        attendance.Remarks = request.Remarks;
        attendance.UpdatedAt = DateTimeOffset.UtcNow;
        attendance.UpdatedBy = request.AdminId;

        var shift = await shiftClient.GetApplicableShiftAsync(attendance.CompanyId, attendance.EmployeeId, attendance.AttendanceDate)
            ?? CreateFallbackShift(attendance.CompanyId);
        processingService.Process(attendance, Array.Empty<AttendancePunchInput>(), shift);

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> Handle(ApproveAttendanceCommand request, CancellationToken cancellationToken)
    {
        var attendance = await db.DailyAttendances.FindAsync([request.Id], cancellationToken);
        if (attendance == null) return false;

        attendance.IsApproved = true;
        attendance.ApprovedBy = request.AdminId;
        attendance.ApprovedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<int> Handle(UploadPunchLogsCommand request, CancellationToken cancellationToken)
    {
        var logs = request.Logs.Select(l => new DeviceLog
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            PunchNumber = l.PunchNumber,
            EmployeeID = l.EmployeeID ?? string.Empty,
            PunchTime = l.PunchTime,
            DeviceSerial = l.DeviceSerial,
            IsProcessed = false,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        db.DeviceLogs.AddRange(logs);
        return await db.SaveChangesAsync(cancellationToken);
    }
}
