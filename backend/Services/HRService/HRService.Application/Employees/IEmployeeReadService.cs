using Erp.BuildingBlocks.Contracts.Pagination;

namespace HRService.Application.Employees;

public interface IEmployeeReadService
{
    Task<PagedResult<EmployeeListItemDto>> ListAsync(EmployeeListQuery query, CancellationToken cancellationToken = default);
    Task<EmployeeDetailsDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<ManpowerListItemDto>> ManpowerListAsync(ManpowerListQuery query, CancellationToken cancellationToken = default);
    Task<ManpowerSummaryDto> ManpowerSummaryAsync(ManpowerSummaryQuery query, CancellationToken cancellationToken = default);
}

public class EmployeeListQuery : PagedRequest
{
    public Guid? CompanyId { get; set; }
    public Guid? DepartmentId { get; set; }
    public string? Status { get; set; }
}

public class ManpowerListQuery : EmployeeListQuery
{
    public Guid? SectionId { get; set; }
    public Guid? DesignationId { get; set; }
}

public class ManpowerSummaryQuery : ManpowerListQuery
{
    public string? Gender { get; set; }
    public DateTime? JoinDateFrom { get; set; }
    public DateTime? JoinDateTo { get; set; }
}

public sealed class ManpowerSummaryDto
{
    public int TotalEmployees { get; init; }
    public int ActiveEmployees { get; init; }
    public int OnLeaveEmployees { get; init; }
    public int InactiveEmployees { get; init; }
    public IReadOnlyList<SummaryBucketDto> DepartmentSummary { get; init; } = [];
    public IReadOnlyList<SummaryBucketDto> DesignationSummary { get; init; } = [];
    public IReadOnlyList<SummaryBucketDto> GenderSummary { get; init; } = [];
    public IReadOnlyList<SummaryBucketDto> StatusSummary { get; init; } = [];
}

public sealed class SummaryBucketDto
{
    public Guid? Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public int Count { get; init; }
    public decimal Percentage { get; init; }
}

public sealed class EmployeeListItemDto
{
    public Guid Id { get; init; }
    public int PunchNumber { get; init; }
    public string EmployeeID { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? Email { get; init; }
    public Guid CompanyId { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? DesignationName { get; init; }
    public string? DepartmentName { get; init; }
}

public sealed class ManpowerListItemDto
{
    public Guid Id { get; init; }
    public int PunchNumber { get; init; }
    public string EmployeeID { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? DesignationName { get; init; }
    public string? DepartmentName { get; init; }
    public string? SectionName { get; init; }
    public DateTime JoinDate { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public decimal GrossSalary { get; init; }
}

public sealed class EmployeeDetailsDto
{
    public Guid Id { get; init; }
    public Guid CompanyId { get; init; }
    public int PunchNumber { get; init; }
    public string EmployeeID { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? BanglaName { get; init; }
    public string? Gender { get; init; }
    public DateTime? DateOfBirth { get; init; }
    public string? NationalId { get; init; }
    public string? BirthCertificateNo { get; init; }
    public string? Phone { get; init; }
    public string? Email { get; init; }
    public DateTime JoinDate { get; init; }
    public string EmploymentType { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;

    public EmployeeJobInfoDto? CurrentJobInfo { get; init; }
    public EmployeeSalaryInfoDto? CurrentSalaryInfo { get; init; }
}

public record EmployeeJobInfoDto(
    Guid? DepartmentId, string? DepartmentName,
    Guid? SectionId, string? SectionName,
    Guid? DesignationId, string? DesignationName,
    Guid? GradeId, string? GradeName,
    Guid? SupervisorId, string? SupervisorName,
    string? WorkLocation, DateTime EffectiveFrom);

public record EmployeeSalaryInfoDto(
    decimal BasicSalary, decimal HouseRent, decimal MedicalAllowance,
    decimal ConveyanceAllowance, decimal FoodAllowance, decimal GrossSalary,
    DateTime EffectiveFrom);
