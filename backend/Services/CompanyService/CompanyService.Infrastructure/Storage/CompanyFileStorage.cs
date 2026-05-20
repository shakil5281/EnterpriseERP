using CompanyService.Application.Companies;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace CompanyService.Infrastructure.Storage;

public sealed class CompanyFileStorage(IHostEnvironment environment, IConfiguration configuration) : ICompanyFileStorage
{
    private const long MaxFileBytes = 2 * 1024 * 1024;
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
    };

    public async Task<string> SaveLogoAsync(Guid companyId, CompanyFilePayload file, CancellationToken cancellationToken = default)
    {
        Validate(file);
        var ext = GetExtension(file);
        var relativePath = $"/uploads/companies/{companyId}/logo{ext}";
        await SaveToDiskAsync(companyId, $"logo{ext}", file, cancellationToken);
        return relativePath;
    }

    public async Task<string> SaveSignatureAsync(Guid companyId, CompanyFilePayload file, CancellationToken cancellationToken = default)
    {
        Validate(file);
        var ext = GetExtension(file);
        var relativePath = $"/uploads/companies/{companyId}/signature{ext}";
        await SaveToDiskAsync(companyId, $"signature{ext}", file, cancellationToken);
        return relativePath;
    }

    public Task DeleteCompanyFilesAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var dir = GetCompanyDirectory(companyId);
        if (Directory.Exists(dir))
        {
            Directory.Delete(dir, recursive: true);
        }

        return Task.CompletedTask;
    }

    private async Task SaveToDiskAsync(Guid companyId, string fileName, CompanyFilePayload file, CancellationToken cancellationToken)
    {
        var dir = GetCompanyDirectory(companyId);
        Directory.CreateDirectory(dir);
        var fullPath = Path.Combine(dir, fileName);
        await using var fs = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None);
        await file.Content.CopyToAsync(fs, cancellationToken);
    }

    private string GetCompanyDirectory(Guid companyId)
    {
        var uploadRoot = configuration["CompanyFiles:UploadRoot"] ?? "uploads";
        var root = Path.IsPathRooted(uploadRoot)
            ? uploadRoot
            : Path.Combine(environment.ContentRootPath, uploadRoot);
        return Path.Combine(root, "companies", companyId.ToString("D"));
    }

    private static void Validate(CompanyFilePayload file)
    {
        if (file.Content.CanSeek && file.Content.Length > MaxFileBytes)
        {
            throw new InvalidOperationException("File size must not exceed 2 MB.");
        }

        if (!AllowedContentTypes.Contains(file.ContentType))
        {
            throw new InvalidOperationException("Only JPEG, PNG, and WebP images are allowed.");
        }
    }

    private static string GetExtension(CompanyFilePayload file)
    {
        var ext = Path.GetExtension(file.FileName);
        if (!string.IsNullOrEmpty(ext))
        {
            return ext.ToLowerInvariant();
        }

        return file.ContentType.ToLowerInvariant() switch
        {
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => ".jpg",
        };
    }
}
