namespace Erp.BuildingBlocks.Contracts.Pagination;

public class PagedRequest
{
    private int _page = 1;
    private int _pageSize = 20;

    public int Page
    {
        get => _page;
        set => _page = value < 1 ? 1 : value;
    }

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value switch
        {
            < 1 => 20,
            > 200 => 200,
            _ => value,
        };
    }

    public string? SortBy { get; set; }

    public bool SortDescending { get; set; }

    public string? Search { get; set; }
}
