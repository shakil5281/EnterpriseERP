using CompanyService.Application.Companies;
using CompanyService.Domain.Entities;
using CompanyService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CompanyService.Infrastructure.Services;

public sealed class CompanyService(CompanyDbContext db) : ICompanyService
{
    public async Task<CompanyDetailsDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await db.Companies
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new CompanyDetailsDto
            {
                Id = c.Id,
                CompanyCode = c.CompanyCode,
                CompanyNameEn = c.CompanyNameEn,
                CompanyNameBn = c.CompanyNameBn,
                AddressEn = c.AddressEn,
                AddressBn = c.AddressBn,
                Email = c.Email,
                Phone = c.Phone,
                Website = c.Website,
                TradeLicenseNo = c.TradeLicenseNo,
                BIN = c.BIN,
                TIN = c.TIN,
                LogoUrl = c.LogoUrl,
                Status = c.Status,
                CreatedAt = c.CreatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Guid> CreateAsync(CreateCompanyDto dto, CancellationToken cancellationToken = default)
    {
        var company = new Company
        {
            Id = Guid.NewGuid(),
            CompanyCode = dto.CompanyCode,
            CompanyNameEn = dto.CompanyNameEn,
            CompanyNameBn = dto.CompanyNameBn,
            AddressEn = dto.AddressEn,
            AddressBn = dto.AddressBn,
            Email = dto.Email,
            Phone = dto.Phone,
            Website = dto.Website,
            TradeLicenseNo = dto.TradeLicenseNo,
            BIN = dto.BIN,
            TIN = dto.TIN,
            LogoUrl = dto.LogoUrl,
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        db.Companies.Add(company);
        await db.SaveChangesAsync(cancellationToken);

        return company.Id;
    }

    public async Task UpdateAsync(Guid id, UpdateCompanyDto dto, CancellationToken cancellationToken = default)
    {
        var company = await db.Companies
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (company == null) return;

        company.CompanyNameEn = dto.CompanyNameEn;
        company.CompanyNameBn = dto.CompanyNameBn;
        company.AddressEn = dto.AddressEn;
        company.AddressBn = dto.AddressBn;
        company.Email = dto.Email;
        company.Phone = dto.Phone;
        company.Website = dto.Website;
        company.TradeLicenseNo = dto.TradeLicenseNo;
        company.BIN = dto.BIN;
        company.TIN = dto.TIN;
        company.LogoUrl = dto.LogoUrl;
        company.Status = dto.Status;
        company.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var company = await db.Companies
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (company == null) return;

        db.Companies.Remove(company);
        await db.SaveChangesAsync(cancellationToken);
    }
}
