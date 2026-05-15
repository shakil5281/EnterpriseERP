using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Domain.Entities;
using AttendanceService.Domain.Enums;
using AttendanceService.Application.DTOs;

namespace AttendanceService.Application.Features.Attendance.Commands;

public record ProcessDailyAttendanceCommand(Guid CompanyId, DateTime Date) : IRequest<bool>;
public record UploadPunchLogsCommand(Guid CompanyId, List<PunchLogDto> Logs) : IRequest<int>;
public record ManualAdjustmentCommand(Guid Id, DateTime? InTime, DateTime? OutTime, string? Remarks, Guid AdminId) : IRequest<bool>;
public record ApproveAttendanceCommand(Guid Id, Guid AdminId) : IRequest<bool>;

public class AttendanceCommandHandlers(
    IAttendanceDbContext db,
    IShiftServiceClient shiftClient,
    IAttendanceProcessingService processingService) : 
    IRequestHandler<ProcessDailyAttendanceCommand, bool>,
    IRequestHandler<UploadPunchLogsCommand, int>,
    IRequestHandler<ManualAdjustmentCommand, bool>,
    IRequestHandler<ApproveAttendanceCommand, bool>
{
    public async Task<bool> Handle(ProcessDailyAttendanceCommand request, CancellationToken cancellationToken)
    {
        // 1. Get all employees who have punches on this date
        var punches = await db.DeviceLogs
            .Where(l => l.CompanyId == request.CompanyId && l.PunchTime.Date == request.Date.Date)
            .GroupBy(l => l.EmployeeId)
            .ToListAsync(cancellationToken);

        foreach (var group in punches)
        {
            var employeeId = group.Key;
            if (employeeId == null) continue;

            // 2. Get applicable shift
            var shift = await shiftClient.GetApplicableShiftAsync(request.CompanyId, employeeId.Value, request.Date);
            if (shift == null) continue;

            var dayPunches = group.OrderBy(p => p.PunchTime).ToList();
            var inPunch = dayPunches.First();
            var outPunch = dayPunches.Count > 1 ? dayPunches.Last() : null;

            // 3. Calculate status and times
            var attendance = await db.DailyAttendances
                .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.AttendanceDate.Date == request.Date.Date, cancellationToken)
                ?? new DailyAttendance { Id = Guid.NewGuid(), CompanyId = request.CompanyId, EmployeeId = employeeId.Value, AttendanceDate = request.Date.Date };

            // Use the engine
            processingService.Process(attendance, dayPunches, shift);

            if (!await db.DailyAttendances.AnyAsync(a => a.Id == attendance.Id, cancellationToken))
            {
                db.DailyAttendances.Add(attendance);
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        return true;
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

        // Re-process with shift rules
        var shift = await shiftClient.GetApplicableShiftAsync(attendance.CompanyId, attendance.EmployeeId, attendance.AttendanceDate);
        if (shift != null)
        {
            processingService.Process(attendance, new List<DeviceLog>(), shift);
        }

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
            EmployeeCode = l.EmployeeCode,
            PunchTime = l.PunchTime,
            DeviceSerial = l.DeviceSerial,
            IsProcessed = false,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        db.DeviceLogs.AddRange(logs);
        return await db.SaveChangesAsync(cancellationToken);
    }
}
