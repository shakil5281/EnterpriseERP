namespace CompanyService.Application.Organogram;

public interface IOrganogramService
{
    // Department
    Task<IEnumerable<DepartmentDto>> GetDepartmentsAsync(Guid companyId);
    Task<IEnumerable<DepartmentDto>> GetAllDepartmentsAsync(CancellationToken cancellationToken = default);
    Task<Guid> CreateDepartmentAsync(DepartmentDto dto);
    Task UpdateDepartmentAsync(DepartmentDto dto);
    Task DeleteDepartmentAsync(Guid id);

    // Section
    Task<IEnumerable<SectionDto>> GetSectionsAsync(Guid departmentId);
    Task<IEnumerable<SectionDto>> GetAllSectionsAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<SectionDto>> GetSectionsForCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<Guid> CreateSectionAsync(SectionDto dto);
    Task UpdateSectionAsync(SectionDto dto);
    Task DeleteSectionAsync(Guid id);

    // Designation
    Task<IEnumerable<DesignationDto>> GetDesignationsAsync(Guid sectionId);
    Task<Guid> CreateDesignationAsync(DesignationDto dto);
    Task UpdateDesignationAsync(DesignationDto dto);
    Task DeleteDesignationAsync(Guid id);

    // Line
    Task<IEnumerable<LineDto>> GetLinesAsync(Guid sectionId);
    Task<Guid> CreateLineAsync(LineDto dto);
    Task UpdateLineAsync(LineDto dto);
    Task DeleteLineAsync(Guid id);
}

public record DepartmentDto(Guid? Id, Guid CompanyId, string NameEn, string NameBn, string? Code);
public record SectionDto(Guid? Id, Guid DepartmentId, string NameEn, string NameBn, string? Code);
public record DesignationDto(Guid? Id, Guid SectionId, string NameEn, string NameBn, string? Code);
public record LineDto(Guid? Id, Guid SectionId, string NameEn, string NameBn, string? Code);
