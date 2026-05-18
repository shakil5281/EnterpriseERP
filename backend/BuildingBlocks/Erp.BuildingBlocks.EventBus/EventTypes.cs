namespace Erp.BuildingBlocks.EventBus;

/// <summary>
/// Stable routing keys / event type names for RabbitMQ (payload schemas version separately).
/// </summary>
public static class EventTypes
{
    public const string CompanyUpserted = "erp.company.upserted.v1";

    public const string EmployeeUpserted = "erp.hr.employee.upserted.v1";

    public const string EmployeeTransferred = "erp.hr.employee.transferred.v1";

    public const string ShiftPublished = "erp.shift.roster.published.v1";

    public const string AttendanceDayFinalized = "erp.attendance.day.finalized.v1";

    public const string LeaveBalanceAdjusted = "erp.leave.balance.adjusted.v1";

    public const string LeaveApplied = "erp.leave.applied.v1";

    public const string LeaveApproved = "erp.leave.approved.v1";

    public const string LeaveRejected = "erp.leave.rejected.v1";

    public const string LeaveCancelled = "erp.leave.cancelled.v1";

    public const string LeaveBalanceUpdated = "erp.leave.balance.updated.v1";

    public const string HolidayCreated = "erp.leave.holiday.created.v1";

    public const string WeeklyOffCreated = "erp.leave.weeklyoff.created.v1";

    public const string EarnLeaveGenerated = "erp.leave.earn.generated.v1";

    public const string LeaveEncashmentApproved = "erp.leave.encashment.approved.v1";

    public const string EmployeeCreated = "erp.hr.employee.created.v1";

    public const string EmployeeResigned = "erp.hr.employee.resigned.v1";

    public const string PayrollLocked = "erp.payroll.locked.v1";

    public const string PayrollUnlocked = "erp.payroll.unlocked.v1";

    public const string MonthlyAttendanceSummaryGenerated = "erp.attendance.monthly.summary.v1";

    public const string PayrollRunPosted = "erp.payroll.run.posted.v1";

    public const string PunchLogCollected = "erp.punch.log.collected.v1";
}
