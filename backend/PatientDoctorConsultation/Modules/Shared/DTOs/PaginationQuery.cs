namespace PatientDoctorConsultation.Modules.Shared.DTOs;

public sealed record PaginationQuery(int Page = 1, int PageSize = 10, string? Search = null)
{
    public int Skip => (Page - 1) * PageSize;
}

public sealed record DateRangeQuery(DateTime? From, DateTime? To);
