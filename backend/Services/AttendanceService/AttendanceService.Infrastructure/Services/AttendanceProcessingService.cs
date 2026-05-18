using AttendanceService.Application.Common;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Domain.Entities;
using AttendanceService.Domain.Enums;
using AttendanceService.Application.DTOs;

namespace AttendanceService.Infrastructure.Services;

public class AttendanceProcessingService : IAttendanceProcessingService
{
    public DailyAttendance Process(DailyAttendance record, IReadOnlyList<AttendancePunchInput> punches, ShiftDto shift)
    {
        ApplyPunchTimes(record, punches);

        record.ShiftId = shift.Id == Guid.Empty ? null : shift.Id;
        record.ShiftCode = shift.ShiftCode;

        var attendanceDate = record.AttendanceDate.Date;
        var shiftStart = attendanceDate.Add(shift.StartTime);
        var shiftEnd = attendanceDate.Add(shift.EndTime);
        if (shift.IsCrossDay)
        {
            shiftEnd = shiftEnd.AddDays(1);
        }

        record.LateMinutes = 0;
        record.EarlyOutMinutes = 0;
        record.OTMinutes = 0;
        record.WorkingMinutes = 0;
        record.Remarks = null;

        if (!record.InTime.HasValue && !record.OutTime.HasValue)
        {
            record.Status = AttendanceStatus.Absent;
            return record;
        }

        if (record.InTime.HasValue && !record.OutTime.HasValue)
        {
            record.Remarks = "OUT punch not recorded";
            if (record.InTime > shiftStart.AddMinutes(10))
            {
                record.LateMinutes = (int)(record.InTime.Value - shiftStart).TotalMinutes;
                record.Status = AttendanceStatus.Late;
            }
            else
            {
                record.Status = AttendanceStatus.Present;
            }

            return record;
        }

        if (!record.InTime.HasValue && record.OutTime.HasValue)
        {
            record.Remarks = "IN punch not recorded";
            if (record.OutTime < shiftEnd.AddMinutes(-5))
            {
                record.EarlyOutMinutes = (int)(shiftEnd - record.OutTime.Value).TotalMinutes;
                record.Status = AttendanceStatus.EarlyOut;
            }
            else
            {
                record.Status = AttendanceStatus.Present;
            }

            return record;
        }

        record.WorkingMinutes = (int)(record.OutTime!.Value - record.InTime!.Value).TotalMinutes;

        if (record.InTime > shiftStart.AddMinutes(10))
        {
            record.LateMinutes = (int)(record.InTime.Value - shiftStart).TotalMinutes;
        }

        if (record.OutTime < shiftEnd.AddMinutes(-5))
        {
            record.EarlyOutMinutes = (int)(shiftEnd - record.OutTime.Value).TotalMinutes;
        }

        if (record.OutTime > shiftEnd.AddMinutes(30))
        {
            record.OTMinutes = (int)(record.OutTime.Value - shiftEnd).TotalMinutes;
        }

        if (record.LateMinutes > 0)
        {
            record.Status = AttendanceStatus.Late;
        }
        else if (record.EarlyOutMinutes > 0)
        {
            record.Status = AttendanceStatus.EarlyOut;
        }
        else
        {
            record.Status = AttendanceStatus.Present;
        }

        return record;
    }

    private static void ApplyPunchTimes(DailyAttendance record, IReadOnlyList<AttendancePunchInput> punches)
    {
        var orderedTimes = punches
            .Select(p => p.PunchTime)
            .OrderBy(t => t)
            .ToList();

        if (orderedTimes.Count == 0)
        {
            return;
        }

        if (!record.IsManualIn)
        {
            record.InTime = orderedTimes[0];
        }

        if (!record.IsManualOut && orderedTimes.Count > 1)
        {
            record.OutTime = orderedTimes[^1];
        }
    }
}
