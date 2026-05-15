using ShiftService.Domain.Entities;

namespace ShiftService.Application.Common.Interfaces;

public interface IShiftSelectionService
{
    Task<Shift?> GetApplicableShiftAsync(Guid companyId, Guid employeeId, DateTime attendanceDate);
    (DateTime Start, DateTime End) CalculateShiftDateTime(Shift shift, DateTime attendanceDate);
}
