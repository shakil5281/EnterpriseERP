using Erp.BuildingBlocks.Contracts.Pagination;
using HRService.Application.Employees;
using HRService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HRService.Infrastructure.Services;

public sealed class EmployeeReadService(HrDbContext db) : IEmployeeReadService
{
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
            q = q.Where(e => e.FullName.ToLower().Contains(s) || e.EmployeeCode.ToLower().Contains(s) || (e.Email != null && e.Email.ToLower().Contains(s)));
        }

        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderBy(e => e.EmployeeCode)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(e => new EmployeeListItemDto
            {
                Id = e.Id,
                EmployeeCode = e.EmployeeCode,
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
                EmployeeCode = e.EmployeeCode,
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
        var q = db.Employees.AsNoTracking().Where(e => !e.IsDeleted);

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
            q = q.Where(e => e.FullName.ToLower().Contains(s) || e.EmployeeCode.ToLower().Contains(s));
        }

        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderBy(e => e.EmployeeCode)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(e => new ManpowerListItemDto
            {
                Id = e.Id,
                EmployeeCode = e.EmployeeCode,
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
}
