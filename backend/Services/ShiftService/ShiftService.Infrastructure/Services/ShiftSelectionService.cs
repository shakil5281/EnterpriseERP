using Microsoft.EntityFrameworkCore;
using ShiftService.Domain.Entities;
using ShiftService.Infrastructure.Persistence;
using ShiftService.Application.Common.Interfaces;

namespace ShiftService.Infrastructure.Services;

public class ShiftSelectionService(ShiftDbContext db) : IShiftSelectionService
{
    public async Task<Shift?> GetApplicableShiftAsync(Guid companyId, Guid employeeId, DateTime attendanceDate)
    {
        // 1. Check TemporaryShiftAssignments
        var temp = await db.TemporaryShiftAssignments
            .AsNoTracking()
            .Include(t => t.Shift)
            .ThenInclude(s => s!.Rule)
            .FirstOrDefaultAsync(t => t.CompanyId == companyId
                && t.EmployeeId == employeeId
                && t.ShiftDate.Date == attendanceDate.Date);

        if (temp?.Shift != null) return temp.Shift;

        // 2. Check current EmployeeShiftAssignments
        var regular = await db.EmployeeShiftAssignments
            .AsNoTracking()
            .Include(a => a.Shift)
            .ThenInclude(s => s!.Rule)
            .FirstOrDefaultAsync(a => a.CompanyId == companyId
                && a.EmployeeId == employeeId
                && a.IsCurrent
                && a.EffectiveFrom <= attendanceDate
                && (a.EffectiveTo == null || a.EffectiveTo >= attendanceDate));

        if (regular?.Shift != null) return regular.Shift;

        // 3. Check company default shift
        var def = await db.Shifts
            .AsNoTracking()
            .Include(s => s.Rule)
            .FirstOrDefaultAsync(s => s.CompanyId == companyId && s.IsDefault && s.IsActive);

        return def;
    }

    public (DateTime Start, DateTime End) CalculateShiftDateTime(Shift shift, DateTime attendanceDate)
    {
        var start = attendanceDate.Date.Add(shift.StartTime);
        var end = shift.IsCrossDay 
            ? attendanceDate.Date.AddDays(1).Add(shift.EndTime) 
            : attendanceDate.Date.Add(shift.EndTime);

        return (start, end);
    }
}
