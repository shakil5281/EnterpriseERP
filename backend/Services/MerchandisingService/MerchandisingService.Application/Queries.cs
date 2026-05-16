using MediatR;
using MerchandisingService.Contracts;

namespace MerchandisingService.Application;

public sealed record GetBuyersQuery(Guid CompanyId) : IRequest<IReadOnlyList<BuyerDto>>;
public sealed record GetBuyerByIdQuery(Guid Id) : IRequest<BuyerDto>;
public sealed record GetSeasonsQuery(Guid CompanyId) : IRequest<IReadOnlyList<SeasonDto>>;
public sealed record GetGarmentItemsQuery(Guid CompanyId) : IRequest<IReadOnlyList<GarmentItemDto>>;
public sealed record GetStylesQuery(Guid CompanyId, Guid? BuyerId) : IRequest<IReadOnlyList<StyleDto>>;
public sealed record GetStyleByIdQuery(Guid Id) : IRequest<StyleDto>;
public sealed record GetOrdersQuery(Guid CompanyId, Guid? BuyerId, string? Status) : IRequest<IReadOnlyList<OrderDto>>;
public sealed record GetOrderByIdQuery(Guid Id) : IRequest<OrderDto>;
public sealed record GetOrderDetailsQuery(Guid Id) : IRequest<OrderDetailsDto>;
public sealed record GetBuyerPosQuery(Guid OrderId) : IRequest<IReadOnlyList<BuyerPurchaseOrderDto>>;
public sealed record GetColorSizeBreakdownQuery(Guid OrderId) : IRequest<IReadOnlyList<ColorSizeBreakdownDto>>;
public sealed record GetBomItemsQuery(Guid OrderId) : IRequest<IReadOnlyList<BomItemDto>>;
public sealed record GetOrderCostingQuery(Guid OrderId) : IRequest<OrderCostingDto?>;
public sealed record GetSamplesQuery(Guid CompanyId, Guid? StyleId) : IRequest<IReadOnlyList<SampleDto>>;
public sealed record GetShipmentPlansQuery(Guid CompanyId, Guid? OrderId) : IRequest<IReadOnlyList<ShipmentPlanDto>>;
