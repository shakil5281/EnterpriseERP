using HRService.Application.Employees;
using HRService.Domain.Entities;
using HRService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HRService.Infrastructure.Services;

public sealed class EmployeeService(HrDbContext db) : IEmployeeService
{
    private async Task EnsureDepartmentAndDesignationExistAsync(Guid? departmentId, Guid? designationId, Guid companyId, CancellationToken cancellationToken)
    {
        if (departmentId.HasValue)
        {
            var deptExists = await db.Departments.AnyAsync(d => d.Id == departmentId.Value, cancellationToken);
            if (!deptExists)
            {
                string name = "Sync-Dept";
                string? code = null;
                try
                {
                    var raw = await db.Database
                        .SqlQueryRaw<string>("SELECT CAST(NameEn AS varchar(max)) AS Value FROM CompanyServiceDB.dbo.Departments WHERE Id = {0}", departmentId.Value)
                        .FirstOrDefaultAsync(cancellationToken);
                    if (!string.IsNullOrEmpty(raw)) name = raw;

                    var rawCode = await db.Database
                        .SqlQueryRaw<string>("SELECT CAST(Code AS varchar(max)) AS Value FROM CompanyServiceDB.dbo.Departments WHERE Id = {0}", departmentId.Value)
                        .FirstOrDefaultAsync(cancellationToken);
                    if (!string.IsNullOrEmpty(rawCode)) code = rawCode;
                }
                catch
                {
                    // Fallback
                }

                db.Departments.Add(new Department
                {
                    Id = departmentId.Value,
                    CompanyId = companyId,
                    Name = name,
                    Code = code,
                    CreatedAt = DateTimeOffset.UtcNow
                });
                await db.SaveChangesAsync(cancellationToken);
            }
        }

        if (designationId.HasValue)
        {
            var desigExists = await db.Designations.AnyAsync(d => d.Id == designationId.Value, cancellationToken);
            if (!desigExists)
            {
                string name = "Sync-Desig";
                try
                {
                    var raw = await db.Database
                        .SqlQueryRaw<string>("SELECT CAST(NameEn AS varchar(max)) AS Value FROM CompanyServiceDB.dbo.Designations WHERE Id = {0}", designationId.Value)
                        .FirstOrDefaultAsync(cancellationToken);
                    if (!string.IsNullOrEmpty(raw)) name = raw;
                }
                catch
                {
                    // Fallback
                }

                var defaultGrade = await db.Grades.FirstOrDefaultAsync(cancellationToken);
                if (defaultGrade == null)
                {
                    defaultGrade = new Grade { Id = Guid.NewGuid(), Name = "G1", CreatedAt = DateTimeOffset.UtcNow };
                    db.Grades.Add(defaultGrade);
                    await db.SaveChangesAsync(cancellationToken);
                }

                db.Designations.Add(new Designation
                {
                    Id = designationId.Value,
                    GradeId = defaultGrade.Id,
                    Name = name,
                    CreatedAt = DateTimeOffset.UtcNow
                });
                await db.SaveChangesAsync(cancellationToken);
            }
        }
    }

    public async Task<Guid> CreateAsync(CreateEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        await EnsureDepartmentAndDesignationExistAsync(dto.DepartmentId, dto.DesignationId, dto.CompanyId, cancellationToken);

        EmployeeIdentityRules.ValidatePunchNumber(dto.PunchNumber);

        var punchExists = await db.Employees.AnyAsync(
            e => e.CompanyId == dto.CompanyId && e.PunchNumber == dto.PunchNumber && !e.IsDeleted,
            cancellationToken);
        if (punchExists)
        {
            throw new InvalidOperationException($"PunchNumber {dto.PunchNumber} already exists in this company.");
        }

        var employeeId = string.IsNullOrWhiteSpace(dto.EmployeeID)
            ? await GenerateNextEmployeeIdAsync(dto.CompanyId, cancellationToken)
            : EmployeeIdentityRules.NormalizeEmployeeId(dto.EmployeeID);
        EmployeeIdentityRules.ValidateEmployeeId(employeeId);

        var idExists = await db.Employees.AnyAsync(
            e => e.CompanyId == dto.CompanyId && e.EmployeeID == employeeId && !e.IsDeleted,
            cancellationToken);
        if (idExists)
        {
            throw new InvalidOperationException($"EmployeeID {employeeId} already exists in this company.");
        }

        var employee = new Employee
        {
            Id = Guid.NewGuid(),
            CompanyId = dto.CompanyId,
            PunchNumber = dto.PunchNumber,
            EmployeeID = employeeId,
            FullName = dto.FullName,
            BanglaName = dto.BanglaName,
            Gender = dto.Gender,
            DateOfBirth = dto.DateOfBirth,
            NationalId = dto.NationalId,
            BirthCertificateNo = dto.BirthCertificateNo,
            Phone = dto.Phone,
            Email = dto.Email,
            JoinDate = dto.JoinDate,
            EmploymentType = dto.EmploymentType,
            Status = "Active", // Initial status is Active
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        // Business Rule: Current job info only one record
        employee.JobInfos.Add(new EmployeeJobInfo
        {
            Id = Guid.NewGuid(),
            CompanyId = dto.CompanyId,
            DepartmentId = dto.DepartmentId,
            SectionId = dto.SectionId,
            DesignationId = dto.DesignationId,
            GradeId = dto.GradeId,
            EffectiveFrom = dto.JoinDate,
            IsCurrent = true
        });

        // Business Rule: Current salary only one record
        employee.SalaryInfos.Add(new EmployeeSalaryInfo
        {
            Id = Guid.NewGuid(),
            CompanyId = dto.CompanyId,
            BasicSalary = dto.BasicSalary,
            HouseRent = dto.HouseRent,
            MedicalAllowance = dto.MedicalAllowance,
            ConveyanceAllowance = dto.ConveyanceAllowance,
            FoodAllowance = dto.FoodAllowance,
            GrossSalary = dto.BasicSalary + dto.HouseRent + dto.MedicalAllowance + dto.ConveyanceAllowance + dto.FoodAllowance,
            EffectiveFrom = dto.JoinDate,
            IsCurrent = true
        });

        db.Employees.Add(employee);
        await db.SaveChangesAsync(cancellationToken);
        return employee.Id;
    }

    public async Task UpdateAsync(Guid id, UpdateEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        var employee = await db.Employees.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (employee == null) return;

        employee.FullName = dto.FullName;
        employee.BanglaName = dto.BanglaName;
        employee.Gender = dto.Gender;
        employee.DateOfBirth = dto.DateOfBirth;
        employee.NationalId = dto.NationalId;
        employee.BirthCertificateNo = dto.BirthCertificateNo;
        employee.Phone = dto.Phone;
        employee.Email = dto.Email;
        employee.JoinDate = dto.JoinDate;
        employee.EmploymentType = dto.EmploymentType;
        employee.Status = dto.Status;
        employee.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var employee = await db.Employees.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (employee == null) return;

        employee.IsDeleted = true;
        employee.DeletedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task TransferAsync(Guid id, TransferEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        var employee = await db.Employees.Include(e => e.JobInfos).FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (employee == null) return;

        await EnsureDepartmentAndDesignationExistAsync(dto.DepartmentId, dto.DesignationId, employee.CompanyId, cancellationToken);

        // Business Rule: Current job info only one record
        // Mark all existing job infos as not current
        var existingJobs = employee.JobInfos.Where(j => j.IsCurrent).ToList();
        foreach (var job in existingJobs)
        {
            job.IsCurrent = false;
            job.EffectiveTo = dto.EffectiveFrom.AddDays(-1);
        }

        employee.JobInfos.Add(new EmployeeJobInfo
        {
            Id = Guid.NewGuid(),
            CompanyId = employee.CompanyId,
            EmployeeId = id,
            DepartmentId = dto.DepartmentId,
            SectionId = dto.SectionId,
            DesignationId = dto.DesignationId,
            GradeId = dto.GradeId,
            SupervisorId = dto.SupervisorId,
            WorkLocation = dto.WorkLocation,
            EffectiveFrom = dto.EffectiveFrom,
            IsCurrent = true
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task ChangeStatusAsync(Guid id, ChangeStatusDto dto, CancellationToken cancellationToken = default)
    {
        var employee = await db.Employees.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (employee == null) return;

        // Business Rule: Employee delete করা উচিত না; status change করা উচিত।
        employee.Status = dto.Status;
        employee.UpdatedAt = DateTime.UtcNow;

        db.EmployeeStatusHistories.Add(new EmployeeStatusHistory
        {
            Id = Guid.NewGuid(),
            EmployeeId = id,
            Status = dto.Status,
            EffectiveFrom = dto.EffectiveFrom,
            Remarks = dto.Remarks,
            CreatedAt = DateTimeOffset.UtcNow
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateSalaryAsync(Guid id, UpdateSalaryDto dto, CancellationToken cancellationToken = default)
    {
        var employee = await db.Employees.Include(e => e.SalaryInfos).FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (employee == null) return;

        // Business Rule: Current salary only one record
        // Business Rule: Salary change হলে old salary close হবে, new salary effective হবে।
        var existingSalaries = employee.SalaryInfos.Where(s => s.IsCurrent).ToList();
        foreach (var salary in existingSalaries)
        {
            salary.IsCurrent = false;
            salary.EffectiveTo = dto.EffectiveFrom.AddDays(-1);
        }

        employee.SalaryInfos.Add(new EmployeeSalaryInfo
        {
            Id = Guid.NewGuid(),
            CompanyId = employee.CompanyId,
            EmployeeId = id,
            BasicSalary = dto.BasicSalary,
            HouseRent = dto.HouseRent,
            MedicalAllowance = dto.MedicalAllowance,
            ConveyanceAllowance = dto.ConveyanceAllowance,
            FoodAllowance = dto.FoodAllowance,
            GrossSalary = dto.BasicSalary + dto.HouseRent + dto.MedicalAllowance + dto.ConveyanceAllowance + dto.FoodAllowance,
            EffectiveFrom = dto.EffectiveFrom,
            IsCurrent = true
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task AddAddressAsync(Guid employeeId, EmployeeAddressDto dto, CancellationToken cancellationToken = default)
    {
        db.EmployeeAddresses.Add(new EmployeeAddress
        {
            Id = Guid.NewGuid(),
            EmployeeId = employeeId,
            AddressType = dto.AddressType,
            Country = dto.Country,
            Division = dto.Division,
            District = dto.District,
            Upazila = dto.Upazila,
            PostOffice = dto.PostOffice,
            PostalCode = dto.PostalCode,
            AddressLine = dto.AddressLine
        });
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAddressAsync(Guid addressId, EmployeeAddressDto dto, CancellationToken cancellationToken = default)
    {
        var address = await db.EmployeeAddresses.FindAsync(addressId);
        if (address == null) return;

        address.AddressType = dto.AddressType;
        address.Country = dto.Country;
        address.Division = dto.Division;
        address.District = dto.District;
        address.Upazila = dto.Upazila;
        address.PostOffice = dto.PostOffice;
        address.PostalCode = dto.PostalCode;
        address.AddressLine = dto.AddressLine;

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAddressAsync(Guid addressId, CancellationToken cancellationToken = default)
    {
        var address = await db.EmployeeAddresses.FindAsync(addressId);
        if (address != null)
        {
            db.EmployeeAddresses.Remove(address);
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task AddBankAccountAsync(Guid employeeId, EmployeeBankAccountDto dto, CancellationToken cancellationToken = default)
    {
        db.EmployeeBankAccounts.Add(new EmployeeBankAccount
        {
            Id = Guid.NewGuid(),
            EmployeeId = employeeId,
            BankName = dto.BankName,
            BranchName = dto.BranchName,
            AccountNo = dto.AccountNo,
            RoutingNo = dto.RoutingNo,
            MobileBankingType = dto.MobileBankingType,
            MobileBankingNo = dto.MobileBankingNo,
            IsPrimary = dto.IsPrimary
        });
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateBankAccountAsync(Guid bankAccountId, EmployeeBankAccountDto dto, CancellationToken cancellationToken = default)
    {
        var account = await db.EmployeeBankAccounts.FindAsync(bankAccountId);
        if (account == null) return;

        account.BankName = dto.BankName;
        account.BranchName = dto.BranchName;
        account.AccountNo = dto.AccountNo;
        account.RoutingNo = dto.RoutingNo;
        account.MobileBankingType = dto.MobileBankingType;
        account.MobileBankingNo = dto.MobileBankingNo;
        account.IsPrimary = dto.IsPrimary;

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteBankAccountAsync(Guid bankAccountId, CancellationToken cancellationToken = default)
    {
        var account = await db.EmployeeBankAccounts.FindAsync(bankAccountId);
        if (account != null)
        {
            db.EmployeeBankAccounts.Remove(account);
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task AddEmergencyContactAsync(Guid employeeId, EmergencyContactDto dto, CancellationToken cancellationToken = default)
    {
        db.EmployeeEmergencyContacts.Add(new EmployeeEmergencyContact
        {
            Id = Guid.NewGuid(),
            EmployeeId = employeeId,
            ContactName = dto.ContactName,
            Relation = dto.Relation,
            Phone = dto.Phone,
            Address = dto.Address
        });
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateEmergencyContactAsync(Guid contactId, EmergencyContactDto dto, CancellationToken cancellationToken = default)
    {
        var contact = await db.EmployeeEmergencyContacts.FindAsync(contactId);
        if (contact == null) return;

        contact.ContactName = dto.ContactName;
        contact.Relation = dto.Relation;
        contact.Phone = dto.Phone;
        contact.Address = dto.Address;

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteEmergencyContactAsync(Guid contactId, CancellationToken cancellationToken = default)
    {
        var contact = await db.EmployeeEmergencyContacts.FindAsync(contactId);
        if (contact != null)
        {
            db.EmployeeEmergencyContacts.Remove(contact);
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task AddDocumentAsync(Guid employeeId, EmployeeDocumentDto dto, CancellationToken cancellationToken = default)
    {
        db.EmployeeDocuments.Add(new EmployeeDocument
        {
            Id = Guid.NewGuid(),
            EmployeeId = employeeId,
            DocumentType = dto.DocumentType,
            FileUrl = dto.FileUrl,
            UploadedAt = DateTime.Now
        });
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteDocumentAsync(Guid documentId, CancellationToken cancellationToken = default)
    {
        var doc = await db.EmployeeDocuments.FindAsync(documentId);
        if (doc != null)
        {
            db.EmployeeDocuments.Remove(doc);
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task<string> GenerateNextEmployeeIdAsync(Guid companyId, CancellationToken cancellationToken)
    {
        var existing = await db.Employees.AsNoTracking()
            .Where(e => e.CompanyId == companyId && !e.IsDeleted)
            .Select(e => e.EmployeeID)
            .ToListAsync(cancellationToken);

        var max = 0;
        foreach (var id in existing)
        {
            if (id.Length >= 5 && id.StartsWith("EMP-", StringComparison.OrdinalIgnoreCase)
                && int.TryParse(id[4..], out var n) && n > max)
            {
                max = n;
            }
        }

        return EmployeeIdentityRules.FormatEmployeeId(max + 1);
    }
}
