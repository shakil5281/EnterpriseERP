namespace AttendanceService.Infrastructure.Persistence.PunchData;



public sealed class PunchRecordEntity

{

    public string Id { get; set; } = string.Empty;

    public long CompanyId { get; set; }

    public int PunchNumber { get; set; }

    public string DeviceId { get; set; } = string.Empty;

    public DateTimeOffset PunchTime { get; set; }

}

