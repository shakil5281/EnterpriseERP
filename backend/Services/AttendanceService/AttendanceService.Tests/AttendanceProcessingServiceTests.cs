using AttendanceService.Application.Common;
using AttendanceService.Application.DTOs;
using AttendanceService.Domain.Entities;
using AttendanceService.Domain.Enums;
using AttendanceService.Infrastructure.Services;
using Xunit;

namespace AttendanceService.Tests;

public class AttendanceProcessingServiceTests
{
    private readonly AttendanceProcessingService _service = new();

    [Fact]
    public void DayShift_AssignsMorningInAndEveningOut()
    {
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var morning = date.AddHours(7).AddMinutes(48);
        var evening = date.AddHours(17).AddMinutes(9);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning), new AttendancePunchInput(evening)],
            eval);

        Assert.Equal(morning, record.InTime);
        Assert.Equal(evening, record.OutTime);
        Assert.True(record.LateMinutes < 120);
    }

    [Fact]
    public void DayShift_SavesSelectedPunchRecordIds()
    {
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var morning = date.AddHours(7).AddMinutes(48);
        var evening = date.AddHours(17).AddMinutes(9);
        var inPunchId = Guid.NewGuid();
        var outPunchId = Guid.NewGuid();
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning, inPunchId), new AttendancePunchInput(evening, outPunchId)],
            eval);

        Assert.Equal(inPunchId, record.InPunchId);
        Assert.Equal(outPunchId, record.OutPunchId);
    }

    [Fact]
    public void DayShift_DoesNotSwapWhenChronologicalOrderWouldBeWrong()
    {
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var morning = date.AddHours(7).AddMinutes(53);
        var evening = date.AddHours(17).AddMinutes(9);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(evening), new AttendancePunchInput(morning)],
            eval);

        Assert.Equal(morning, record.InTime);
        Assert.Equal(evening, record.OutTime);
    }

    [Fact]
    public void GeneralDutyDayShift_UsesNextMorningPunchAsOutAndCalculatesUncappedOt()
    {
        var date = new DateTime(2026, 5, 21);
        var eval = CreateGeneralDayShiftEval(date);
        var morning = date.AddHours(7).AddMinutes(55);
        var nextMorningOut = date.AddDays(1).AddHours(6);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning), new AttendancePunchInput(nextMorningOut)],
            eval);

        Assert.Equal(morning, record.InTime);
        Assert.Equal(nextMorningOut, record.OutTime);
        Assert.Equal(775, record.OvertimeMinutes);
    }

    [Fact]
    public void GeneralDutyDayShift_OtBelowMinimumReturnsZero()
    {
        var date = new DateTime(2026, 5, 21);
        var eval = CreateGeneralDayShiftEval(date);
        var morning = date.AddHours(7).AddMinutes(55);
        var outTime = date.AddHours(17).AddMinutes(20);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning), new AttendancePunchInput(outTime)],
            eval);

        Assert.Equal(0, record.OvertimeMinutes);
    }

    [Fact]
    public void GeneralDutyDayShift_OvertimeDisabledReturnsZero()
    {
        var date = new DateTime(2026, 5, 21);
        var eval = CreateGeneralDayShiftEval(date, allowOvertime: false);
        var morning = date.AddHours(7).AddMinutes(55);
        var nextMorningOut = date.AddDays(1).AddHours(6);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning), new AttendancePunchInput(nextMorningOut)],
            eval);

        Assert.Equal(0, record.OvertimeMinutes);
    }

    [Fact]
    public void EmployeeOtDisabled_ReturnsZeroOvertimeEvenWhenShiftAllows()
    {
        var date = new DateTime(2026, 5, 21);
        var eval = CreateGeneralDayShiftEval(date, allowOvertime: true);
        var morning = date.AddHours(7).AddMinutes(55);
        var nextMorningOut = date.AddDays(1).AddHours(6);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning), new AttendancePunchInput(nextMorningOut)],
            eval,
            isOtEnabled: false);

        Assert.Equal(0, record.OvertimeMinutes);
    }

    [Fact]
    public void EmployeeOtDisabled_WeeklyOffFullOtPolicy_ReturnsZeroOvertime()
    {
        var date = new DateTime(2026, 5, 8);
        var eval = CreateWeeklyOffEval(date, fullOt: true);
        var morning = date.AddHours(5).AddMinutes(46);
        var evening = date.AddHours(13).AddMinutes(5);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning), new AttendancePunchInput(evening)],
            eval,
            isOtEnabled: false);

        Assert.Equal(AttendanceStatus.WeeklyOffPresent, record.Status);
        Assert.Equal(0, record.OvertimeMinutes);
        Assert.True(record.WorkingMinutes > 0);
    }

    [Fact]
    public void CrossDayShift_UsesFirstInLastOut()
    {
        var date = new DateTime(2026, 5, 2);
        var evening = date.AddHours(20).AddMinutes(5);
        var nextMorning = date.AddDays(1).AddHours(7).AddMinutes(50);
        var eval = CreateNightCrossDayEval(date);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(evening), new AttendancePunchInput(nextMorning)],
            eval);

        Assert.Equal(evening, record.InTime);
        Assert.Equal(nextMorning, record.OutTime);
    }

    [Fact]
    public void WeeklyOff_NoPunches_MarksWeeklyOffNotAbsent()
    {
        var date = new DateTime(2026, 5, 1);
        var eval = CreateWeeklyOffEval(date);
        var record = NewRecord(date);

        _service.Process(record, [], eval);

        Assert.Equal(DayType.WeeklyOff, record.DayType);
        Assert.Equal(AttendanceStatus.WeeklyOff, record.Status);
        Assert.Equal(0, record.OvertimeMinutes);
        Assert.Null(record.InTime);
        Assert.Null(record.OutTime);
    }

    [Fact]
    public void WeeklyOff_WithPunchesAndFullOtPolicy_MarksWeeklyOffPresentWithOvertime()
    {
        var date = new DateTime(2026, 5, 8);
        var eval = CreateWeeklyOffEval(date, fullOt: true);
        var morning = date.AddHours(5).AddMinutes(46);
        var evening = date.AddHours(13).AddMinutes(5);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning), new AttendancePunchInput(evening)],
            eval);

        Assert.Equal(DayType.WeeklyOff, record.DayType);
        Assert.Equal(AttendanceStatus.WeeklyOffPresent, record.Status);
        Assert.True(record.OvertimeMinutes > 0);
        Assert.Equal(record.WorkingMinutes, record.OvertimeMinutes);
    }

    // ── Boundary-based punch classification ──────────────────────────────────

    [Fact]
    public void DayShift_MultiplePunchesBeforeShiftStart_ShowsOnlyInTime()
    {
        // Many early taps (e.g. double-swipe at gate before shift) → InTime = first, no OutTime.
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var first  = date.AddHours(7).AddMinutes(40);
        var second = date.AddHours(7).AddMinutes(50);
        var third  = date.AddHours(7).AddMinutes(55);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(first), new AttendancePunchInput(second), new AttendancePunchInput(third)],
            eval);

        Assert.Equal(first, record.InTime);
        Assert.Null(record.OutTime);
    }

    [Fact]
    public void DayShift_MultiplePunchesAfterShiftEnd_ShowsOnlyOutTime()
    {
        // Many late taps (e.g. double-swipe at exit after shift) → OutTime = last, no InTime.
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var first  = date.AddHours(17).AddMinutes(10);
        var second = date.AddHours(17).AddMinutes(20);
        var last   = date.AddHours(17).AddMinutes(30);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(first), new AttendancePunchInput(second), new AttendancePunchInput(last)],
            eval);

        Assert.Null(record.InTime);
        Assert.Equal(last, record.OutTime);
    }

    [Fact]
    public void DayShift_SinglePunchAfterShiftEnd_ShowsOutTimeOnly()
    {
        // A single punch that is after ShiftEnd must be OutTime, not InTime.
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var latePunch = date.AddHours(17).AddMinutes(15);
        var record = NewRecord(date);

        _service.Process(record, [new AttendancePunchInput(latePunch)], eval);

        Assert.Null(record.InTime);
        Assert.Equal(latePunch, record.OutTime);
    }

    [Fact]
    public void DayShift_PunchesOnBothSides_PicksFirstBeforeAndLastAfter()
    {
        // Multiple pre-shift AND post-shift punches → InTime = earliest pre-shift, OutTime = latest post-shift.
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var earlyFirst  = date.AddHours(7).AddMinutes(40);
        var earlySecond = date.AddHours(7).AddMinutes(52);
        var lateFirst   = date.AddHours(17).AddMinutes(15);
        var lateLast    = date.AddHours(17).AddMinutes(40);
        var record = NewRecord(date);

        _service.Process(
            record,
            [
                new AttendancePunchInput(earlyFirst),
                new AttendancePunchInput(earlySecond),
                new AttendancePunchInput(lateFirst),
                new AttendancePunchInput(lateLast),
            ],
            eval);

        Assert.Equal(earlyFirst, record.InTime);
        Assert.Equal(lateLast, record.OutTime);
    }

    [Fact]
    public void WorkingDay_NoPunches_RemainsAbsent()
    {
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var record = NewRecord(date);

        _service.Process(record, [], eval);

        Assert.Equal(DayType.WorkingDay, record.DayType);
        Assert.Equal(AttendanceStatus.Absent, record.Status);
    }

    [Fact]
    public void Holiday_NoPunches_MarksHolidayNotAbsent()
    {
        var date = new DateTime(2026, 5, 3);
        var eval = CreateHolidayEval(date);
        var record = NewRecord(date);

        _service.Process(record, [], eval);

        Assert.Equal(DayType.Holiday, record.DayType);
        Assert.Equal(AttendanceStatus.Holiday, record.Status);
    }

    private static DailyAttendance NewRecord(DateTime date) =>
        new()
        {
            Id = Guid.NewGuid(),
            CompanyId = Guid.NewGuid(),
            EmployeeId = Guid.NewGuid(),
            AttendanceDate = date,
        };

    private static ShiftEvaluationDto CreateGeneralDayShiftEval(DateTime date, bool allowOvertime = true)
    {
        var start = date.AddHours(8);
        var end = date.AddHours(17);
        var policy = new ShiftPolicyDto(
            Guid.Empty, Guid.Empty, 10, 5, 10, 5, 480, 240,
            allowOvertime, 30, 30, 240, 60, true, true, true);
        var windowStart = start.AddHours(-1);

        return new ShiftEvaluationDto(
            Guid.NewGuid(),
            Guid.NewGuid(),
            date,
            Guid.NewGuid(),
            "General",
            "GeneralDuty",
            start,
            end,
            IsCrossDay: false,
            windowStart,
            windowStart.AddDays(1).AddMinutes(-1),
            "WorkingDay",
            false,
            false,
            false,
            policy);
    }

    private static ShiftEvaluationDto CreateHolidayEval(DateTime date)
    {
        var start = date.AddHours(8);
        var end = date.AddHours(17);
        var policy = new ShiftPolicyDto(
            Guid.Empty, Guid.Empty, 10, 5, 10, 5, 480, 240,
            true, 30, 30, 240, 60, true, true, true);

        return new ShiftEvaluationDto(
            Guid.NewGuid(),
            Guid.NewGuid(),
            date,
            Guid.NewGuid(),
            "General",
            "GeneralDuty",
            start,
            end,
            IsCrossDay: false,
            start.AddHours(-1),
            start.AddDays(1).AddMinutes(-1),
            "Holiday",
            IsWeeklyOff: false,
            IsHoliday: true,
            IsOffDayWorkEligibleForFullOt: true,
            policy);
    }

    private static ShiftEvaluationDto CreateWeeklyOffEval(DateTime date, bool fullOt = true)
    {
        var start = date.AddHours(8);
        var end = date.AddHours(17);
        var policy = new ShiftPolicyDto(
            Guid.Empty, Guid.Empty, 10, 5, 10, 5, 480, 240,
            true, 30, 30, 240, 60, true, true, fullOt);

        return new ShiftEvaluationDto(
            Guid.NewGuid(),
            Guid.NewGuid(),
            date,
            Guid.NewGuid(),
            "General",
            "GeneralDuty",
            start,
            end,
            IsCrossDay: false,
            start.AddHours(-1),
            start.AddDays(1).AddMinutes(-1),
            "WeeklyOff",
            IsWeeklyOff: true,
            IsHoliday: false,
            IsOffDayWorkEligibleForFullOt: fullOt,
            policy);
    }

    private static ShiftEvaluationDto CreateNightCrossDayEval(DateTime date)
    {
        var start = date.AddHours(20);
        var end = date.AddDays(1).AddHours(8);
        var policy = new ShiftPolicyDto(
            Guid.Empty, Guid.Empty, 10, 5, 10, 5, 480, 240,
            true, 30, 30, 240, 60, true, true, true);

        return new ShiftEvaluationDto(
            Guid.NewGuid(),
            Guid.NewGuid(),
            date,
            Guid.NewGuid(),
            "Night",
            "Night",
            start,
            end,
            IsCrossDay: true,
            start.AddHours(-1),
            date.AddDays(1).AddHours(19).AddMinutes(59),
            "WorkingDay",
            false,
            false,
            false,
            policy);
    }
}
