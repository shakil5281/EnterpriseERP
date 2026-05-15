namespace AttendanceService.Domain.Entities;

public sealed class DeviceLog
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid? EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public DateTime PunchTime { get; set; }
    public string? DeviceSerial { get; set; }
    public bool IsProcessed { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
