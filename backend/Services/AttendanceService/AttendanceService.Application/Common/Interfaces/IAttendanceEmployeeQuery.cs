namespace AttendanceService.Application.Common.Interfaces;

public sealed record AttendanceEmployeeProfile(
    Guid Id,
    int PunchNumber,
    string EmployeeID,
    string FullName,
    Guid? DepartmentId,
    string? DepartmentName,
    Guid? SectionId,
    string? SectionName,
    Guid? DesignationId,
    string? DesignationName);

public sealed record AttendanceEmployeeFilter(
    Guid CompanyId,
    Guid? DepartmentId = null,
    Guid? SectionId = null,
    Guid? DesignationId = null,
    string? SearchTerm = null,
    string? EmployeeID = null);

public interface IAttendanceEmployeeQuery
{
    Task<IReadOnlyDictionary<Guid, AttendanceEmployeeProfile>> GetProfilesAsync(
        AttendanceEmployeeFilter filter,
        CancellationToken cancellationToken = default);

    Task<HashSet<Guid>> GetEmployeeIdsMatchingFilterAsync(
        AttendanceEmployeeFilter filter,
        CancellationToken cancellationToken = default);
}
