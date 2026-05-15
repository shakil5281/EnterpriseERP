namespace CompanyService.Application.Companies;

public interface ICompanyService
{
    Task<CompanyDetailsDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Guid> CreateAsync(CreateCompanyDto dto, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdateCompanyDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

public sealed class CompanyDetailsDto
{
    public Guid Id { get; init; }
    public string CompanyCode { get; init; } = string.Empty;
    public string CompanyNameEn { get; init; } = string.Empty;
    public string? CompanyNameBn { get; init; }
    public string? AddressEn { get; init; }
    public string? AddressBn { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Website { get; init; }
    public string? TradeLicenseNo { get; init; }
    public string? BIN { get; init; }
    public string? TIN { get; init; }
    public string? LogoUrl { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}

public sealed class CreateCompanyDto
{
    public string CompanyCode { get; init; } = string.Empty;
    public string CompanyNameEn { get; init; } = string.Empty;
    public string? CompanyNameBn { get; init; }
    public string? AddressEn { get; init; }
    public string? AddressBn { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Website { get; init; }
    public string? TradeLicenseNo { get; init; }
    public string? BIN { get; init; }
    public string? TIN { get; init; }
    public string? LogoUrl { get; init; }
}

public sealed class UpdateCompanyDto
{
    public string CompanyNameEn { get; init; } = string.Empty;
    public string? CompanyNameBn { get; init; }
    public string? AddressEn { get; init; }
    public string? AddressBn { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Website { get; init; }
    public string? TradeLicenseNo { get; init; }
    public string? BIN { get; init; }
    public string? TIN { get; init; }
    public string? LogoUrl { get; init; }
    public string Status { get; init; } = "Active";
}
