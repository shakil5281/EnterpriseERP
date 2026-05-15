using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Domain.Entities;
using AttendanceService.Domain.Enums;
using AttendanceService.Application.DTOs;

namespace AttendanceService.Infrastructure.Services;

public class AttendanceProcessingService : IAttendanceProcessingService
{
    public DailyAttendance Process(DailyAttendance record, List<DeviceLog> punches, ShiftDto shift)
    {
        var sortedPunches = punches.OrderBy(p => p.PunchTime).ToList();
        
        // Identify IN/OUT
        if (!record.IsManualIn)
            record.InTime = sortedPunches.FirstOrDefault()?.PunchTime;
            
        if (!record.IsManualOut)
            record.OutTime = sortedPunches.Count > 1 ? sortedPunches.Last().PunchTime : null;

        record.ShiftId = shift.Id;
        record.ShiftCode = shift.ShiftCode;

        // Basic Info
        var attendanceDate = record.AttendanceDate.Date;
        var shiftStart = attendanceDate.Add(shift.StartTime);
        var shiftEnd = attendanceDate.Add(shift.EndTime);
        if (shift.IsCrossDay) shiftEnd = shiftEnd.AddDays(1);

        // Reset metrics
        record.LateMinutes = 0;
        record.EarlyOutMinutes = 0;
        record.OTMinutes = 0;
        record.WorkingMinutes = 0;

        // Logic
        if (!record.InTime.HasValue && !record.OutTime.HasValue)
        {
            record.Status = AttendanceStatus.Absent;
            return record;
        }

        if (record.InTime.HasValue && !record.OutTime.HasValue)
        {
            record.Status = AttendanceStatus.MissingPunch;
            record.Remarks = "Missing OUT punch";
        }
        else if (!record.InTime.HasValue && record.OutTime.HasValue)
        {
            record.Status = AttendanceStatus.MissingPunch;
            record.Remarks = "Missing IN punch";
        }
        else
        {
            // Full cycle
            record.WorkingMinutes = (int)(record.OutTime!.Value - record.InTime!.Value).TotalMinutes;
            
            // Late Calculation (Assuming 10 mins grace from shift rules or global)
            if (record.InTime > shiftStart.AddMinutes(10)) 
            {
                record.LateMinutes = (int)(record.InTime.Value - shiftStart).TotalMinutes;
            }

            // Early Out Calculation
            if (record.OutTime < shiftEnd.AddMinutes(-5))
            {
                record.EarlyOutMinutes = (int)(shiftEnd - record.OutTime.Value).TotalMinutes;
            }

            // OT Calculation
            if (record.OutTime > shiftEnd.AddMinutes(30)) // 30 mins buffer for OT
            {
                record.OTMinutes = (int)(record.OutTime.Value - shiftEnd).TotalMinutes;
            }

            // Final Status
            if (record.LateMinutes > 0) record.Status = AttendanceStatus.Late;
            else if (record.EarlyOutMinutes > 0) record.Status = AttendanceStatus.EarlyOut;
            else record.Status = AttendanceStatus.Present;
        }

        return record;
    }
}
