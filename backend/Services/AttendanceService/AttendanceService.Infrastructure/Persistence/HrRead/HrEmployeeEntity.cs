namespace AttendanceService.Infrastructure.Persistence.HrRead;



public sealed class HrEmployeeEntity

{

    public Guid Id { get; set; }

    public Guid CompanyId { get; set; }

    public int PunchNumber { get; set; }

    public string EmployeeID { get; set; } = string.Empty;

    public bool IsDeleted { get; set; }

}

