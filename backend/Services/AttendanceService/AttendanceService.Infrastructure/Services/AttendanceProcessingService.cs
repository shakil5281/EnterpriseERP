using AttendanceService.Application.Common;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using AttendanceService.Domain.Entities;
using AttendanceService.Domain.Enums;

namespace AttendanceService.Infrastructure.Services;

public class AttendanceProcessingService : IAttendanceProcessingService
{
    public DailyAttendance Process(
        DailyAttendance record,
        IReadOnlyList<AttendancePunchInput> punches,
        ShiftEvaluationDto eval,
        bool isOtEnabled = true)
    {
        ApplyPunchTimes(record, punches, eval);

        record.ShiftId = eval.ShiftId == Guid.Empty ? null : eval.ShiftId;
        record.ShiftName = eval.ShiftName;

        var policy = eval.Policy;
        var shiftStart = eval.ShiftStart;
        var shiftEnd = eval.ShiftEnd;

        record.DayType = eval.IsHoliday ? DayType.Holiday
            : eval.IsWeeklyOff ? DayType.WeeklyOff
            : DayType.WorkingDay;

        record.LateMinutes = 0;
        record.EarlyOutMinutes = 0;
        record.OTMinutes = 0;
        record.WorkingMinutes = 0;
        record.BreakMinutes = 0;
        record.Remarks = null;

        if (!record.InTime.HasValue && !record.OutTime.HasValue)
        {
            record.Status = eval.IsHoliday
                ? AttendanceStatus.Holiday
                : eval.IsWeeklyOff
                    ? AttendanceStatus.WeeklyOff
                    : AttendanceStatus.Absent;
            return record;
        }

        if (record.InTime.HasValue && !record.OutTime.HasValue)
        {
            record.Remarks = "OUT punch not recorded";
            record.LateMinutes = CalcLate(record.InTime.Value, shiftStart, policy);
            record.Status = record.LateMinutes > 0 ? AttendanceStatus.Late : AttendanceStatus.Present;
            return record;
        }

        if (!record.InTime.HasValue && record.OutTime.HasValue)
        {
            record.Remarks = "IN punch not recorded";
            record.EarlyOutMinutes = CalcEarlyOut(record.OutTime.Value, shiftEnd, policy);
            record.Status = record.EarlyOutMinutes > 0 ? AttendanceStatus.EarlyOut : AttendanceStatus.Present;
            return record;
        }

        var rawMinutes = (int)(record.OutTime!.Value - record.InTime!.Value).TotalMinutes;
        var lunch = policy.DeductLunchFromWorking ? policy.LunchBreakMinutes : 0;
        record.BreakMinutes = lunch;

        if (eval.IsOffDayWorkEligibleForFullOt && (eval.IsHoliday || eval.IsWeeklyOff))
        {
            record.WorkingMinutes = Math.Max(0, rawMinutes - lunch);
            record.OvertimeMinutes = isOtEnabled ? record.WorkingMinutes : 0;
            record.Status = eval.IsHoliday ? AttendanceStatus.HolidayPresent : AttendanceStatus.WeeklyOffPresent;
            return record;
        }

        record.LateMinutes = CalcLate(record.InTime!.Value, shiftStart, policy);
        record.EarlyOutMinutes = CalcEarlyOut(record.OutTime!.Value, shiftEnd, policy);
        record.OvertimeMinutes = isOtEnabled
            ? CalcOvertime(record.OutTime!.Value, shiftEnd, policy, eval)
            : 0;

        var netWorking = rawMinutes - lunch;
        if (record.OvertimeMinutes > 0)
        {
            netWorking -= record.OvertimeMinutes;
        }

        record.WorkingMinutes = Math.Max(0, netWorking);

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

    private static int CalcLate(DateTime inTime, DateTime shiftStart, ShiftPolicyDto policy)
    {
        var threshold = shiftStart.AddMinutes(policy.LateAfterMinutes);
        if (inTime <= threshold) return 0;
        return (int)(inTime - shiftStart).TotalMinutes;
    }

    private static int CalcEarlyOut(DateTime outTime, DateTime shiftEnd, ShiftPolicyDto policy)
    {
        var threshold = shiftEnd.AddMinutes(-policy.EarlyOutBeforeMinutes);
        if (outTime >= threshold) return 0;
        return (int)(shiftEnd - outTime).TotalMinutes;
    }

    private static int CalcOvertime(DateTime outTime, DateTime shiftEnd, ShiftPolicyDto policy, ShiftEvaluationDto eval)
    {
        if (!policy.AllowOvertime) return 0;

        if (IsGeneralDutyDayShift(eval))
        {
            var otStart = shiftEnd.AddMinutes(Math.Max(0, policy.OutGraceMinutes));
            if (outTime <= otStart) return 0;

            var generalDutyOt = (int)(outTime - otStart).TotalMinutes;
            return generalDutyOt >= policy.MinimumOvertimeMinutes ? generalDutyOt : 0;
        }

        var threshold = shiftEnd.AddMinutes(policy.OvertimeStartAfterMinutes);
        if (outTime <= threshold) return 0;
        var ot = (int)(outTime - shiftEnd).TotalMinutes;
        if (ot < policy.MinimumOvertimeMinutes) return 0;
        if (policy.MaximumOvertimeMinutes > 0)
        {
            ot = Math.Min(ot, policy.MaximumOvertimeMinutes);
        }

        return ot;
    }

    private static void ApplyPunchTimes(
        DailyAttendance record,
        IReadOnlyList<AttendancePunchInput> punches,
        ShiftEvaluationDto eval)
    {
        var orderedPunches = punches.OrderBy(p => p.PunchTime).ToList();
        if (orderedPunches.Count == 0)
        {
            if (!record.IsManualIn)
            {
                record.InPunchId = null;
            }

            if (!record.IsManualOut)
            {
                record.OutPunchId = null;
            }

            return;
        }

        if (orderedPunches.Count == 1)
        {
            if (!record.IsManualIn)
            {
                ApplyInPunch(record, orderedPunches[0]);
            }

            if (!record.IsManualOut)
            {
                record.OutPunchId = null;
            }

            return;
        }

        if (eval.IsCrossDay)
        {
            if (!record.IsManualIn)
            {
                ApplyInPunch(record, orderedPunches[0]);
            }

            if (!record.IsManualOut)
            {
                ApplyOutPunch(record, orderedPunches[^1]);
            }

            return;
        }

        var shiftStart = eval.ShiftStart;
        var shiftEnd = eval.ShiftEnd;

        if (!record.IsManualIn)
        {
            var inPunch = orderedPunches
                .OrderBy(p => Math.Abs((p.PunchTime - shiftStart).TotalMinutes))
                .First();
            ApplyInPunch(record, inPunch);
        }

        if (!record.IsManualOut)
        {
            var inTime = record.InTime ?? orderedPunches[0].PunchTime;
            var afterIn = orderedPunches.Where(p => p.PunchTime > inTime).ToList();
            if (afterIn.Count == 0)
            {
                record.OutPunchId = null;
                return;
            }

            var earlyOutThreshold = shiftEnd.AddMinutes(-eval.Policy.EarlyOutBeforeMinutes);
            var outCandidates = afterIn.Where(p => p.PunchTime >= earlyOutThreshold).ToList();
            ApplyOutPunch(record, outCandidates.Count > 0 ? outCandidates[^1] : afterIn[^1]);
        }
    }

    private static void ApplyInPunch(DailyAttendance record, AttendancePunchInput punch)
    {
        record.InTime = punch.PunchTime;
        record.InPunchId = punch.PunchRecordId;
    }

    private static void ApplyOutPunch(DailyAttendance record, AttendancePunchInput punch)
    {
        record.OutTime = punch.PunchTime;
        record.OutPunchId = punch.PunchRecordId;
    }

    private static bool IsGeneralDutyDayShift(ShiftEvaluationDto eval) =>
        !eval.IsCrossDay
        && string.Equals(eval.ShiftCategory, "GeneralDuty", StringComparison.OrdinalIgnoreCase);
}
