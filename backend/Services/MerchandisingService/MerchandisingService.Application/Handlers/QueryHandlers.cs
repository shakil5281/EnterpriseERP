using AutoMapper;
using MediatR;
using MerchandisingService.Contracts;
using Microsoft.EntityFrameworkCore;

namespace MerchandisingService.Application.Handlers;

public sealed class QueryHandlers(IUnitOfWork uow, IMapper mapper, IRedisCacheService cache) :
    IRequestHandler<GetBuyersQuery, IReadOnlyList<BuyerDto>>,
    IRequestHandler<GetBuyerByIdQuery, BuyerDto>,
    IRequestHandler<GetSeasonsQuery, IReadOnlyList<SeasonDto>>,
    IRequestHandler<GetGarmentItemsQuery, IReadOnlyList<GarmentItemDto>>,
    IRequestHandler<GetStylesQuery, IReadOnlyList<StyleDto>>,
    IRequestHandler<GetStyleByIdQuery, StyleDto>,
    IRequestHandler<GetOrdersQuery, IReadOnlyList<OrderDto>>,
    IRequestHandler<GetOrderByIdQuery, OrderDto>,
    IRequestHandler<GetOrderDetailsQuery, OrderDetailsDto>,
    IRequestHandler<GetBuyerPosQuery, IReadOnlyList<BuyerPurchaseOrderDto>>,
    IRequestHandler<GetColorSizeBreakdownQuery, IReadOnlyList<ColorSizeBreakdownDto>>,
    IRequestHandler<GetBomItemsQuery, IReadOnlyList<BomItemDto>>,
    IRequestHandler<GetOrderCostingQuery, OrderCostingDto?>,
    IRequestHandler<GetSamplesQuery, IReadOnlyList<SampleDto>>,
    IRequestHandler<GetShipmentPlansQuery, IReadOnlyList<ShipmentPlanDto>>
{
    public async Task<IReadOnlyList<BuyerDto>> Handle(GetBuyersQuery query, CancellationToken cancellationToken)
    {
        var key = CacheKeys.Buyers(query.CompanyId);
        var cached = await cache.GetAsync<IReadOnlyList<BuyerDto>>(key, cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        var buyers = await uow.Buyers.Query().Where(x => x.CompanyId == query.CompanyId).OrderBy(x => x.BuyerName).ToListAsync(cancellationToken);
        var result = mapper.Map<IReadOnlyList<BuyerDto>>(buyers);
        await cache.SetAsync(key, result, TimeSpan.FromHours(6), cancellationToken);
        return result;
    }

    public async Task<BuyerDto> Handle(GetBuyerByIdQuery query, CancellationToken cancellationToken)
    {
        var buyer = await uow.Buyers.GetByIdAsync(query.Id, cancellationToken) ?? throw new KeyNotFoundException("Buyer not found.");
        return mapper.Map<BuyerDto>(buyer);
    }

    public async Task<IReadOnlyList<SeasonDto>> Handle(GetSeasonsQuery query, CancellationToken cancellationToken)
    {
        var seasons = await uow.Seasons.Query().Where(x => x.CompanyId == query.CompanyId).OrderByDescending(x => x.YearNo).ThenBy(x => x.SeasonName).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<SeasonDto>>(seasons);
    }

    public async Task<IReadOnlyList<GarmentItemDto>> Handle(GetGarmentItemsQuery query, CancellationToken cancellationToken)
    {
        var items = await uow.GarmentItems.Query().Where(x => x.CompanyId == query.CompanyId).OrderBy(x => x.ItemName).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<GarmentItemDto>>(items);
    }

    public async Task<IReadOnlyList<StyleDto>> Handle(GetStylesQuery query, CancellationToken cancellationToken)
    {
        var key = CacheKeys.Styles(query.CompanyId, query.BuyerId);
        var cached = await cache.GetAsync<IReadOnlyList<StyleDto>>(key, cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        var stylesQuery = uow.Styles.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.BuyerId.HasValue)
        {
            stylesQuery = stylesQuery.Where(x => x.BuyerId == query.BuyerId.Value);
        }

        var styles = await stylesQuery.OrderBy(x => x.StyleNo).ToListAsync(cancellationToken);
        var result = mapper.Map<IReadOnlyList<StyleDto>>(styles);
        await cache.SetAsync(key, result, TimeSpan.FromHours(6), cancellationToken);
        return result;
    }

    public async Task<StyleDto> Handle(GetStyleByIdQuery query, CancellationToken cancellationToken)
    {
        var style = await uow.Styles.GetByIdAsync(query.Id, cancellationToken) ?? throw new KeyNotFoundException("Style not found.");
        return mapper.Map<StyleDto>(style);
    }

    public async Task<IReadOnlyList<OrderDto>> Handle(GetOrdersQuery query, CancellationToken cancellationToken)
    {
        var ordersQuery = uow.Orders.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.BuyerId.HasValue)
        {
            ordersQuery = ordersQuery.Where(x => x.BuyerId == query.BuyerId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            ordersQuery = ordersQuery.Where(x => x.OrderStatus == query.Status);
        }

        var orders = await ordersQuery.OrderByDescending(x => x.OrderDate).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<OrderDto>>(orders);
    }

    public async Task<OrderDto> Handle(GetOrderByIdQuery query, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(query.Id, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        return mapper.Map<OrderDto>(order);
    }

    public async Task<OrderDetailsDto> Handle(GetOrderDetailsQuery query, CancellationToken cancellationToken)
    {
        var key = CacheKeys.OrderDetails(query.Id);
        var cached = await cache.GetAsync<OrderDetailsDto>(key, cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        var order = await uow.Orders.GetByIdAsync(query.Id, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var pos = await uow.BuyerPurchaseOrders.Query().Where(x => x.OrderId == query.Id).ToListAsync(cancellationToken);
        var breakdowns = await uow.Breakdowns.Query().Where(x => x.OrderId == query.Id).ToListAsync(cancellationToken);
        var bom = await uow.BomItems.Query().Where(x => x.OrderId == query.Id).ToListAsync(cancellationToken);
        var costing = await uow.Costings.Query().FirstOrDefaultAsync(x => x.OrderId == query.Id, cancellationToken);
        var shipments = await uow.ShipmentPlans.Query().Where(x => x.OrderId == query.Id).ToListAsync(cancellationToken);

        var result = new OrderDetailsDto(
            mapper.Map<OrderDto>(order),
            mapper.Map<IReadOnlyList<BuyerPurchaseOrderDto>>(pos),
            mapper.Map<IReadOnlyList<ColorSizeBreakdownDto>>(breakdowns),
            mapper.Map<IReadOnlyList<BomItemDto>>(bom),
            costing is null ? null : mapper.Map<OrderCostingDto>(costing),
            mapper.Map<IReadOnlyList<ShipmentPlanDto>>(shipments));

        await cache.SetAsync(key, result, TimeSpan.FromMinutes(30), cancellationToken);
        return result;
    }

    public async Task<IReadOnlyList<BuyerPurchaseOrderDto>> Handle(GetBuyerPosQuery query, CancellationToken cancellationToken)
    {
        var pos = await uow.BuyerPurchaseOrders.Query().Where(x => x.OrderId == query.OrderId).OrderBy(x => x.PONo).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<BuyerPurchaseOrderDto>>(pos);
    }

    public async Task<IReadOnlyList<ColorSizeBreakdownDto>> Handle(GetColorSizeBreakdownQuery query, CancellationToken cancellationToken)
    {
        var rows = await uow.Breakdowns.Query().Where(x => x.OrderId == query.OrderId).OrderBy(x => x.ColorName).ThenBy(x => x.SizeName).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<ColorSizeBreakdownDto>>(rows);
    }

    public async Task<IReadOnlyList<BomItemDto>> Handle(GetBomItemsQuery query, CancellationToken cancellationToken)
    {
        var key = CacheKeys.BomItems(query.OrderId);
        var cached = await cache.GetAsync<IReadOnlyList<BomItemDto>>(key, cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        var rows = await uow.BomItems.Query().Where(x => x.OrderId == query.OrderId).OrderBy(x => x.ItemType).ThenBy(x => x.ItemName).ToListAsync(cancellationToken);
        var result = mapper.Map<IReadOnlyList<BomItemDto>>(rows);
        await cache.SetAsync(key, result, TimeSpan.FromHours(1), cancellationToken);
        return result;
    }

    public async Task<OrderCostingDto?> Handle(GetOrderCostingQuery query, CancellationToken cancellationToken)
    {
        var key = CacheKeys.Costing(query.OrderId);
        var cached = await cache.GetAsync<OrderCostingDto>(key, cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        var costing = await uow.Costings.Query().FirstOrDefaultAsync(x => x.OrderId == query.OrderId, cancellationToken);
        if (costing is null)
        {
            return null;
        }

        var result = mapper.Map<OrderCostingDto>(costing);
        await cache.SetAsync(key, result, TimeSpan.FromHours(1), cancellationToken);
        return result;
    }

    public async Task<IReadOnlyList<SampleDto>> Handle(GetSamplesQuery query, CancellationToken cancellationToken)
    {
        var samplesQuery = uow.Samples.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.StyleId.HasValue)
        {
            samplesQuery = samplesQuery.Where(x => x.StyleId == query.StyleId.Value);
        }

        var samples = await samplesQuery.OrderByDescending(x => x.RequestDate).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<SampleDto>>(samples);
    }

    public async Task<IReadOnlyList<ShipmentPlanDto>> Handle(GetShipmentPlansQuery query, CancellationToken cancellationToken)
    {
        var plansQuery = uow.ShipmentPlans.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.OrderId.HasValue)
        {
            plansQuery = plansQuery.Where(x => x.OrderId == query.OrderId.Value);
        }

        var plans = await plansQuery.OrderBy(x => x.PlannedShipmentDate).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<ShipmentPlanDto>>(plans);
    }
}
