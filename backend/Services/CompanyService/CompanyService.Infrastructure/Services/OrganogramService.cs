using CompanyService.Application.Organogram;
using CompanyService.Domain.Entities;
using CompanyService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CompanyService.Infrastructure.Services;

public sealed class OrganogramService(CompanyDbContext db) : IOrganogramService
{
    // Department
    public async Task<IEnumerable<DepartmentDto>> GetDepartmentsAsync(Guid companyId) =>
        await db.Departments.AsNoTracking().Where(x => x.CompanyId == companyId)
            .Select(x => new DepartmentDto(x.Id, x.CompanyId, x.NameEn, x.NameBn, x.Code))
            .ToListAsync();

    public async Task<IEnumerable<DepartmentDto>> GetAllDepartmentsAsync(CancellationToken cancellationToken = default) =>
        await db.Departments.AsNoTracking()
            .Select(x => new DepartmentDto(x.Id, x.CompanyId, x.NameEn, x.NameBn, x.Code))
            .ToListAsync(cancellationToken);

    public async Task<Guid> CreateDepartmentAsync(DepartmentDto dto)
    {
        var dept = new Department { Id = Guid.NewGuid(), CompanyId = dto.CompanyId, NameEn = dto.NameEn, NameBn = dto.NameBn, Code = dto.Code, CreatedAt = DateTime.UtcNow };
        db.Departments.Add(dept);
        await db.SaveChangesAsync();
        return dept.Id;
    }

    public async Task UpdateDepartmentAsync(DepartmentDto dto)
    {
        var dept = await db.Departments.FindAsync(dto.Id);
        if (dept == null) return;

        dept.NameEn = dto.NameEn;
        dept.NameBn = dto.NameBn;
        dept.Code = dto.Code;
        dept.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
    }

    public async Task DeleteDepartmentAsync(Guid id)
    {
        var dept = await db.Departments.FindAsync(id);
        if (dept == null) return;

        db.Departments.Remove(dept);
        await db.SaveChangesAsync();
    }

    // Section
    public async Task<IEnumerable<SectionDto>> GetSectionsAsync(Guid departmentId) =>
        await db.Sections.AsNoTracking().Where(x => x.DepartmentId == departmentId)
            .Select(x => new SectionDto(x.Id, x.DepartmentId, x.NameEn, x.NameBn, x.Code))
            .ToListAsync();

    public async Task<IEnumerable<SectionDto>> GetAllSectionsAsync(CancellationToken cancellationToken = default) =>
        await db.Sections.AsNoTracking()
            .Select(x => new SectionDto(x.Id, x.DepartmentId, x.NameEn, x.NameBn, x.Code))
            .ToListAsync(cancellationToken);

    public async Task<IEnumerable<SectionDto>> GetSectionsForCompanyAsync(Guid companyId, CancellationToken cancellationToken = default) =>
        await db.Sections.AsNoTracking()
            .Join(
                db.Departments.AsNoTracking(),
                s => s.DepartmentId,
                d => d.Id,
                (s, d) => new { s, d })
            .Where(x => x.d.CompanyId == companyId)
            .Select(x => new SectionDto(x.s.Id, x.s.DepartmentId, x.s.NameEn, x.s.NameBn, x.s.Code))
            .ToListAsync(cancellationToken);

    public async Task<Guid> CreateSectionAsync(SectionDto dto)
    {
        var sec = new Section { Id = Guid.NewGuid(), DepartmentId = dto.DepartmentId, NameEn = dto.NameEn, NameBn = dto.NameBn, Code = dto.Code, CreatedAt = DateTime.UtcNow };
        db.Sections.Add(sec);
        await db.SaveChangesAsync();
        return sec.Id;
    }

    public async Task UpdateSectionAsync(SectionDto dto)
    {
        var sec = await db.Sections.FindAsync(dto.Id);
        if (sec == null) return;

        sec.NameEn = dto.NameEn;
        sec.NameBn = dto.NameBn;
        sec.Code = dto.Code;
        sec.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
    }

    public async Task DeleteSectionAsync(Guid id)
    {
        var sec = await db.Sections.FindAsync(id);
        if (sec == null) return;

        db.Sections.Remove(sec);
        await db.SaveChangesAsync();
    }

    // Designation
    public async Task<IEnumerable<DesignationDto>> GetDesignationsAsync(Guid sectionId) =>
        await db.Designations.AsNoTracking().Where(x => x.SectionId == sectionId)
            .Select(x => new DesignationDto(x.Id, x.SectionId, x.NameEn, x.NameBn, x.Code))
            .ToListAsync();

    public async Task<Guid> CreateDesignationAsync(DesignationDto dto)
    {
        var des = new Designation { Id = Guid.NewGuid(), SectionId = dto.SectionId, NameEn = dto.NameEn, NameBn = dto.NameBn, Code = dto.Code, CreatedAt = DateTime.UtcNow };
        db.Designations.Add(des);
        await db.SaveChangesAsync();
        return des.Id;
    }

    public async Task UpdateDesignationAsync(DesignationDto dto)
    {
        var des = await db.Designations.FindAsync(dto.Id);
        if (des == null) return;

        des.NameEn = dto.NameEn;
        des.NameBn = dto.NameBn;
        des.Code = dto.Code;
        des.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
    }

    public async Task DeleteDesignationAsync(Guid id)
    {
        var des = await db.Designations.FindAsync(id);
        if (des == null) return;

        db.Designations.Remove(des);
        await db.SaveChangesAsync();
    }

    // Line
    public async Task<IEnumerable<LineDto>> GetLinesAsync(Guid sectionId) =>
        await db.Lines.AsNoTracking().Where(x => x.SectionId == sectionId)
            .Select(x => new LineDto(x.Id, x.SectionId, x.NameEn, x.NameBn, x.Code))
            .ToListAsync();

    public async Task<Guid> CreateLineAsync(LineDto dto)
    {
        var line = new Line { Id = Guid.NewGuid(), SectionId = dto.SectionId, NameEn = dto.NameEn, NameBn = dto.NameBn, Code = dto.Code, CreatedAt = DateTime.UtcNow };
        db.Lines.Add(line);
        await db.SaveChangesAsync();
        return line.Id;
    }

    public async Task UpdateLineAsync(LineDto dto)
    {
        var line = await db.Lines.FindAsync(dto.Id);
        if (line == null) return;

        line.NameEn = dto.NameEn;
        line.NameBn = dto.NameBn;
        line.Code = dto.Code;
        line.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
    }

    public async Task DeleteLineAsync(Guid id)
    {
        var line = await db.Lines.FindAsync(id);
        if (line == null) return;

        db.Lines.Remove(line);
        await db.SaveChangesAsync();
    }
}
