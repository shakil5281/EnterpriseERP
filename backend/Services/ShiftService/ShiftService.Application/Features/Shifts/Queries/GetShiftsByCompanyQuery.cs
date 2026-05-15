using MediatR;
using Microsoft.EntityFrameworkCore;
using ShiftService.Application.Common.Interfaces;
using ShiftService.Application.DTOs;

namespace ShiftService.Application.Features.Shifts.Queries;

public record GetShiftsByCompanyQuery(Guid CompanyId) : IRequest<IEnumerable<ShiftDto>>;

public class GetShiftsByCompanyQueryHandler(IShiftDbContext db) : IRequestHandler<GetShiftsByCompanyQuery, IEnumerable<ShiftDto>>
{
    public async Task<IEnumerable<ShiftDto>> Handle(GetShiftsByCompanyQuery request, CancellationToken cancellationToken)
    {
        return await db.Shifts
            .AsNoTracking()
            .Where(s => s.CompanyId == request.CompanyId)
            .Select(s => new ShiftDto(
                s.Id, s.CompanyId, s.ShiftCode, s.ShiftName, s.ShiftType,
                s.StartTime, s.EndTime, s.IsCrossDay, s.IsGeneralDuty,
                s.IsDefault, s.IsActive))
            .ToListAsync(cancellationToken);
    }
}
