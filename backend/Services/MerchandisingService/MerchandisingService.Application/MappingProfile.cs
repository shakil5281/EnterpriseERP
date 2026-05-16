using AutoMapper;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;

namespace MerchandisingService.Application;

public sealed class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Buyer, BuyerDto>();
        CreateMap<Season, SeasonDto>();
        CreateMap<GarmentItem, GarmentItemDto>();
        CreateMap<Style, StyleDto>();
        CreateMap<Order, OrderDto>();
        CreateMap<BuyerPurchaseOrder, BuyerPurchaseOrderDto>();
        CreateMap<OrderColorSizeBreakdown, ColorSizeBreakdownDto>();
        CreateMap<BomItem, BomItemDto>();
        CreateMap<OrderCosting, OrderCostingDto>();
        CreateMap<Sample, SampleDto>();
        CreateMap<ShipmentPlan, ShipmentPlanDto>();
    }
}
