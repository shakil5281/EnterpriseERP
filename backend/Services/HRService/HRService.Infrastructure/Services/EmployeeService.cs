using HRService.Application.Employees;
using HRService.Domain.Entities;
using HRService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HRService.Infrastructure.Services;

public sealed class EmployeeService(HrDbContext db) : IEmployeeService
{
    public async Task<Guid> CreateAsync(CreateEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        // Business Rule: EmployeeCode unique within same company
        var exists = await db.Employees.AnyAsync(e => e.CompanyId == dto.CompanyId && e.EmployeeCode == dto.EmployeeCode && !e.IsDeleted, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException($"Employee code {dto.EmployeeCode} already exists in this company.");
        }

        var employee = new Employee
        {
            Id = Guid.NewGuid(),
            CompanyId = dto.CompanyId,
            EmployeeCode = dto.EmployeeCode,
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
}
