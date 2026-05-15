using AttendanceService.Domain.Entities;
using AttendanceService.Domain.Enums;
using AttendanceService.Application.DTOs;

namespace AttendanceService.Application.Common.Interfaces;

public interface IAttendanceProcessingService
{
    DailyAttendance Process(DailyAttendance record, List<DeviceLog> punches, ShiftDto shift);
}
