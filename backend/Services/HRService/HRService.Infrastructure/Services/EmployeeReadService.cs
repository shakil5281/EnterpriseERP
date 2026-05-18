using Erp.BuildingBlocks.Contracts.Pagination;
using HRService.Application.Employees;
using HRService.Domain.Entities;
using HRService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HRService.Infrastructure.Services;

public sealed class EmployeeReadService(HrDbContext db) : IEmployeeReadService
{
    private static IQueryable<Employee> ApplyManpowerFilters(IQueryable<Employee> q, ManpowerListQuery query)
    {
        if (query.CompanyId.HasValue)
            q = q.Where(e => e.CompanyId == query.CompanyId);

        if (query.DepartmentId.HasValue)
            q = q.Where(e => e.JobInfos.Any(j => j.IsCurrent && j.DepartmentId == query.DepartmentId));

        if (query.SectionId.HasValue)
            q = q.Where(e => e.JobInfos.Any(j => j.IsCurrent && j.SectionId == query.SectionId));

        if (query.DesignationId.HasValue)
            q = q.Where(e => e.JobInfos.Any(j => j.IsCurrent && j.DesignationId == query.DesignationId));

        if (!string.IsNullOrWhiteSpace(query.Status) && !string.Equals(query.Status, "all", StringComparison.OrdinalIgnoreCase))
            q = q.Where(e => e.Status == query.Status);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(e => e.FullName.ToLower().Contains(s)
                || e.EmployeeID.ToLower().Contains(s)
                || e.PunchNumber.ToString().Contains(s));
        }

        if (query is ManpowerSummaryQuery summaryQuery)
        {
            if (!string.IsNullOrWhiteSpace(summaryQuery.Gender) &&
                !string.Equals(summaryQuery.Gender, "all", StringComparison.OrdinalIgnoreCase))
            {
                q = q.Where(e => e.Gender == summaryQuery.Gender);
            }

            if (summaryQuery.JoinDateFrom.HasValue)
                q = q.Where(e => e.JoinDate >= summaryQuery.JoinDateFrom.Value.Date);

            if (summaryQuery.JoinDateTo.HasValue)
            {
                var end = summaryQuery.JoinDateTo.Value.Date.AddDays(1);
                q = q.Where(e => e.JoinDate < end);
            }
        }

        return q;
    }

    private static decimal Percentage(int count, int total) =>
        total > 0 ? Math.Round((decimal)count / total * 100m, 1) : 0m;

    private static List<SummaryBucketDto> BuildBuckets<TKey>(
        IEnumerable<IGrouping<TKey, EmployeeSnapshot>> groups,
        int total,
        Func<TKey, string> nameSelector,
        Func<TKey, Guid?> idSelector) where TKey : notnull =>
        groups
            .Select(g => new SummaryBucketDto
            {
                Id = idSelector(g.Key),
                Name = nameSelector(g.Key),
                Count = g.Count(),
                Percentage = Percentage(g.Count(), total),
            })
            .OrderByDescending(x => x.Count)
            .ToList();

    private sealed record EmployeeSnapshot(
        string Status,
        string? Gender,
        Guid? DepartmentId,
        string DepartmentName,
        Guid? DesignationId,
        string DesignationName);
    public async Task<PagedResult<EmployeeListItemDto>> ListAsync(EmployeeListQuery query, CancellationToken cancellationToken = default)
    {
        var q = db.Employees.AsNoTracking().Where(e => !e.IsDeleted);

        if (query.CompanyId.HasValue)
        {
            q = q.Where(e => e.CompanyId == query.CompanyId);
        }

        if (query.DepartmentId.HasValue)
        {
            q = q.Where(e => e.JobInfos.Any(j => j.IsCurrent && j.DepartmentId == query.DepartmentId));
        }

        if (!string.IsNullOrWhiteSpace(query.Status) && !string.Equals(query.Status, "all", StringComparison.OrdinalIgnoreCase))
        {
            q = q.Where(e => e.Status == query.Status);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(e => e.FullName.ToLower().Contains(s)
                || e.EmployeeID.ToLower().Contains(s)
                || e.PunchNumber.ToString().Contains(s)
                || (e.Email != null && e.Email.ToLower().Contains(s)));
        }

        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderBy(e => e.EmployeeID)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(e => new EmployeeListItemDto
            {
                Id = e.Id,
                PunchNumber = e.PunchNumber,
                EmployeeID = e.EmployeeID,
                FullName = e.FullName,
                Email = e.Email,
                CompanyId = e.CompanyId,
                Status = e.Status,
                DepartmentName = e.JobInfos.Where(j => j.IsCurrent).Select(j => j.Department != null ? j.Department.Name : null).FirstOrDefault(),
                DesignationName = e.JobInfos.Where(j => j.IsCurrent).Select(j => j.Designation != null ? j.Designation.Name : null).FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<EmployeeListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<EmployeeDetailsDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await db.Employees.AsNoTracking()
            .Include(e => e.JobInfos.Where(j => j.IsCurrent))
                .ThenInclude(j => j.Department)
            .Include(e => e.JobInfos.Where(j => j.IsCurrent))
                .ThenInclude(j => j.Designation)
            .Include(e => e.JobInfos.Where(j => j.IsCurrent))
                .ThenInclude(j => j.Grade)
            .Include(e => e.SalaryInfos.Where(s => s.IsCurrent))
            .Where(e => e.Id == id && !e.IsDeleted)
            .Select(e => new EmployeeDetailsDto
            {
                Id = e.Id,
                CompanyId = e.CompanyId,
                PunchNumber = e.PunchNumber,
                EmployeeID = e.EmployeeID,
                FullName = e.FullName,
                BanglaName = e.BanglaName,
                Gender = e.Gender,
                DateOfBirth = e.DateOfBirth,
                NationalId = e.NationalId,
                BirthCertificateNo = e.BirthCertificateNo,
                Phone = e.Phone,
                Email = e.Email,
                JoinDate = e.JoinDate,
                EmploymentType = e.EmploymentType,
                Status = e.Status,
                CurrentJobInfo = e.JobInfos.Where(j => j.IsCurrent).Select(j => new EmployeeJobInfoDto(
                    j.DepartmentId, j.Department != null ? j.Department.Name : null,
                    j.SectionId, null, // SectionName not available in this simplified query yet
                    j.DesignationId, j.Designation != null ? j.Designation.Name : null,
                    j.GradeId, j.Grade != null ? j.Grade.Name : null,
                    j.SupervisorId, null,
                    j.WorkLocation, j.EffectiveFrom
                )).FirstOrDefault(),
                CurrentSalaryInfo = e.SalaryInfos.Where(s => s.IsCurrent).Select(s => new EmployeeSalaryInfoDto(
                    s.BasicSalary, s.HouseRent, s.MedicalAllowance, s.ConveyanceAllowance, s.FoodAllowance, s.GrossSalary, s.EffectiveFrom
                )).FirstOrDefault()
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<PagedResult<ManpowerListItemDto>> ManpowerListAsync(ManpowerListQuery query, CancellationToken cancellationToken = default)
    {
        var q = ApplyManpowerFilters(db.Employees.AsNoTracking().Where(e => !e.IsDeleted), query);

        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderBy(e => e.EmployeeID)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(e => new ManpowerListItemDto
            {
                Id = e.Id,
                PunchNumber = e.PunchNumber,
                EmployeeID = e.EmployeeID,
                FullName = e.FullName,
                DesignationName = e.JobInfos.Where(j => j.IsCurrent).Select(j => j.Designation != null ? j.Designation.Name : null).FirstOrDefault(),
                DepartmentName = e.JobInfos.Where(j => j.IsCurrent).Select(j => j.Department != null ? j.Department.Name : null).FirstOrDefault(),
                SectionName = null,
                JoinDate = e.JoinDate,
                Status = e.Status,
                Phone = e.Phone,
                GrossSalary = e.SalaryInfos.Where(s => s.IsCurrent).Select(s => s.GrossSalary).FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<ManpowerListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<ManpowerSummaryDto> ManpowerSummaryAsync(
        ManpowerSummaryQuery query,
        CancellationToken cancellationToken = default)
    {
        var q = ApplyManpowerFilters(db.Employees.AsNoTracking().Where(e => !e.IsDeleted), query);

        var snapshots = await q
            .Select(e => new EmployeeSnapshot(
                e.Status,
                e.Gender,
                e.JobInfos.Where(j => j.IsCurrent).Select(j => j.DepartmentId).FirstOrDefault(),
                e.JobInfos.Where(j => j.IsCurrent).Select(j => j.Department != null ? j.Department.Name : "Unassigned").FirstOrDefault() ?? "Unassigned",
                e.JobInfos.Where(j => j.IsCurrent).Select(j => j.DesignationId).FirstOrDefault(),
                e.JobInfos.Where(j => j.IsCurrent).Select(j => j.Designation != null ? j.Designation.Name : "Unassigned").FirstOrDefault() ?? "Unassigned"))
            .ToListAsync(cancellationToken);

        var total = snapshots.Count;
        var active = snapshots.Count(e => string.Equals(e.Status, "Active", StringComparison.OrdinalIgnoreCase));
        var onLeave = snapshots.Count(e =>
            string.Equals(e.Status, "On Leave", StringComparison.OrdinalIgnoreCase) ||
            e.Status.Contains("Leave", StringComparison.OrdinalIgnoreCase));
        var inactive = total - active - onLeave;

        var departmentSummary = BuildBuckets(
            snapshots.GroupBy(e => e.DepartmentName),
            total,
            key => key,
            key => snapshots.First(s => s.DepartmentName == key).DepartmentId);

        var designationSummary = BuildBuckets(
            snapshots.GroupBy(e => e.DesignationName),
            total,
            key => key,
            key => snapshots.First(s => s.DesignationName == key).DesignationId)
            .Take(10)
            .ToList();

        var genderSummary = BuildBuckets(
            snapshots.GroupBy(e => string.IsNullOrWhiteSpace(e.Gender) ? "Not Specified" : e.Gender!),
            total,
            key => key,
            _ => null);

        var statusSummary = BuildBuckets(
            snapshots.GroupBy(e => string.IsNullOrWhiteSpace(e.Status) ? "Unknown" : e.Status),
            total,
            key => key,
            _ => null);

        return new ManpowerSummaryDto
        {
            TotalEmployees = total,
            ActiveEmployees = active,
            OnLeaveEmployees = onLeave,
            InactiveEmployees = inactive,
            DepartmentSummary = departmentSummary,
            DesignationSummary = designationSummary,
            GenderSummary = genderSummary,
            StatusSummary = statusSummary,
        };
    }
}
