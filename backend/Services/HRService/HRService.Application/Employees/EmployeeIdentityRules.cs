using System.Text.RegularExpressions;

namespace HRService.Application.Employees;

public static partial class EmployeeIdentityRules
{
    public const int EmployeeIdMaxLength = 32;

    [GeneratedRegex(@"^EMP-\d{4,}$", RegexOptions.Compiled | RegexOptions.CultureInvariant)]
    private static partial Regex EmployeeIdRegex();

    public static void ValidatePunchNumber(int punchNumber)
    {
        if (punchNumber <= 0)
        {
            throw new InvalidOperationException("PunchNumber must be a positive integer.");
        }
    }

    public static void ValidateEmployeeId(string employeeId)
    {
        var trimmed = employeeId.Trim();
        if (trimmed.Length == 0)
        {
            throw new InvalidOperationException("EmployeeID is required.");
        }

        if (trimmed.Length > EmployeeIdMaxLength)
        {
            throw new InvalidOperationException($"EmployeeID cannot exceed {EmployeeIdMaxLength} characters.");
        }

        if (!EmployeeIdRegex().IsMatch(trimmed))
        {
            throw new InvalidOperationException("EmployeeID must match pattern EMP-#### (e.g. EMP-0001).");
        }
    }

    public static string NormalizeEmployeeId(string employeeId) => employeeId.Trim();

    public static string FormatEmployeeId(int sequence) => $"EMP-{sequence:D4}";
}
