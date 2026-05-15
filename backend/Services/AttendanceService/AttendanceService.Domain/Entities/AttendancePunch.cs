using AttendanceService.Domain.Enums;

namespace AttendanceService.Domain.Entities;

public sealed class AttendancePunch
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public DateTime AttendanceDate { get; set; }
    public DateTime PunchTime { get; set; }
    public PunchType PunchType { get; set; }
    public SourceType SourceType { get; set; }
    public Guid? RawPunchLogId { get; set; }
    public Guid? DeviceId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
