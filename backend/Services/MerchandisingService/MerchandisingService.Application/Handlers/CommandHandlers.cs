using AutoMapper;
using MediatR;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.EntityFrameworkCore;

namespace MerchandisingService.Application.Handlers;

public sealed class CatalogCommandHandlers(
    IUnitOfWork uow,
    IMapper mapper,
    IRedisCacheService cache,
    IIntegrationEventPublisher publisher) :
    IRequestHandler<CreateBuyerCommand, BuyerDto>,
    IRequestHandler<UpdateBuyerCommand, BuyerDto>,
    IRequestHandler<ActivateBuyerCommand, BuyerDto>,
    IRequestHandler<CreateSeasonCommand, SeasonDto>,
    IRequestHandler<CreateGarmentItemCommand, GarmentItemDto>,
    IRequestHandler<CreateStyleCommand, StyleDto>,
    IRequestHandler<UpdateStyleCommand, StyleDto>
{
    public async Task<BuyerDto> Handle(CreateBuyerCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var exists = await uow.Buyers.Query().AnyAsync(x => x.CompanyId == request.CompanyId && x.BuyerCode == request.BuyerCode, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Buyer code already exists for this company.");
        }

        var buyer = new Buyer
        {
            CompanyId = request.CompanyId,
            BuyerCode = request.BuyerCode.Trim(),
            BuyerName = request.BuyerName.Trim(),
            Country = request.Country,
            ContactPerson = request.ContactPerson,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address,
        };

        await uow.Buyers.AddAsync(buyer, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.Buyers(request.CompanyId), cancellationToken);
        await publisher.PublishAsync(new BuyerCreated(buyer.CompanyId, buyer.Id, buyer.BuyerCode, buyer.BuyerName), cancellationToken);
        return mapper.Map<BuyerDto>(buyer);
    }

    public async Task<BuyerDto> Handle(UpdateBuyerCommand command, CancellationToken cancellationToken)
    {
        var buyer = await uow.Buyers.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Buyer not found.");
        buyer.BuyerName = command.Request.BuyerName.Trim();
        buyer.Country = command.Request.Country;
        buyer.ContactPerson = command.Request.ContactPerson;
        buyer.Email = command.Request.Email;
        buyer.Phone = command.Request.Phone;
        buyer.Address = command.Request.Address;
        buyer.IsActive = command.Request.IsActive;
        buyer.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.Buyers(buyer.CompanyId), cancellationToken);
        return mapper.Map<BuyerDto>(buyer);
    }

    public async Task<BuyerDto> Handle(ActivateBuyerCommand command, CancellationToken cancellationToken)
    {
        var buyer = await uow.Buyers.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Buyer not found.");
        buyer.IsActive = command.IsActive;
        buyer.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.Buyers(buyer.CompanyId), cancellationToken);
        return mapper.Map<BuyerDto>(buyer);
    }

    public async Task<SeasonDto> Handle(CreateSeasonCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var exists = await uow.Seasons.Query().AnyAsync(x => x.CompanyId == request.CompanyId && x.SeasonCode == request.SeasonCode, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Season code already exists for this company.");
        }

        var season = new Season { CompanyId = request.CompanyId, SeasonCode = request.SeasonCode.Trim(), SeasonName = request.SeasonName.Trim(), YearNo = request.YearNo };
        await uow.Seasons.AddAsync(season, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<SeasonDto>(season);
    }

    public async Task<GarmentItemDto> Handle(CreateGarmentItemCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var exists = await uow.GarmentItems.Query().AnyAsync(x => x.CompanyId == request.CompanyId && x.ItemCode == request.ItemCode, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Garment item code already exists for this company.");
        }

        var item = new GarmentItem { CompanyId = request.CompanyId, ItemCode = request.ItemCode.Trim(), ItemName = request.ItemName.Trim(), Category = request.Category };
        await uow.GarmentItems.AddAsync(item, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<GarmentItemDto>(item);
    }

    public async Task<StyleDto> Handle(CreateStyleCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var buyerExists = await uow.Buyers.Query().AnyAsync(x => x.Id == request.BuyerId && x.CompanyId == request.CompanyId, cancellationToken);
        if (!buyerExists)
        {
            throw new InvalidOperationException("Buyer does not exist for this company.");
        }

        var exists = await uow.Styles.Query().AnyAsync(x => x.BuyerId == request.BuyerId && x.StyleNo == request.StyleNo, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Style number already exists for this buyer.");
        }

        var style = new Style
        {
            CompanyId = request.CompanyId,
            BuyerId = request.BuyerId,
            SeasonId = request.SeasonId,
            GarmentItemId = request.GarmentItemId,
            StyleNo = request.StyleNo.Trim(),
            StyleName = request.StyleName,
            Description = request.Description,
            FabricDescription = request.FabricDescription,
        };

        await uow.Styles.AddAsync(style, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.Styles(request.CompanyId, request.BuyerId), cancellationToken);
        await publisher.PublishAsync(new StyleCreated(style.CompanyId, style.Id, style.BuyerId, style.StyleNo), cancellationToken);
        return mapper.Map<StyleDto>(style);
    }

    public async Task<StyleDto> Handle(UpdateStyleCommand command, CancellationToken cancellationToken)
    {
        var style = await uow.Styles.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Style not found.");
        style.SeasonId = command.Request.SeasonId;
        style.GarmentItemId = command.Request.GarmentItemId;
        style.StyleName = command.Request.StyleName;
        style.Description = command.Request.Description;
        style.FabricDescription = command.Request.FabricDescription;
        style.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.Styles(style.CompanyId, style.BuyerId), cancellationToken);
        return mapper.Map<StyleDto>(style);
    }
}

public sealed class OrderCommandHandlers(
    IUnitOfWork uow,
    IMerchandisingDbContext db,
    IMapper mapper,
    IBomCalculationService bomCalculator,
    ICostingCalculationService costingCalculator,
    IRedisCacheService cache,
    IIntegrationEventPublisher publisher) :
    IRequestHandler<CreateOrderCommand, OrderDto>,
    IRequestHandler<UpdateOrderCommand, OrderDto>,
    IRequestHandler<ConfirmOrderCommand, OrderDto>,
    IRequestHandler<CancelOrderCommand, OrderDto>,
    IRequestHandler<CreateBuyerPoCommand, BuyerPurchaseOrderDto>,
    IRequestHandler<UpdateBuyerPoCommand, BuyerPurchaseOrderDto>,
    IRequestHandler<CreateColorSizeBreakdownCommand, ColorSizeBreakdownDto>,
    IRequestHandler<UpdateColorSizeBreakdownCommand, ColorSizeBreakdownDto>,
    IRequestHandler<DeleteColorSizeBreakdownCommand, Unit>,
    IRequestHandler<CreateBomItemCommand, BomItemDto>,
    IRequestHandler<UpdateBomItemCommand, BomItemDto>,
    IRequestHandler<DeleteBomItemCommand, Unit>,
    IRequestHandler<CalculateBomCommand, BomCalculationResultDto>,
    IRequestHandler<CreateOrderCostingCommand, OrderCostingDto>,
    IRequestHandler<UpdateOrderCostingCommand, OrderCostingDto>
{
    public async Task<OrderDto> Handle(CreateOrderCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var exists = await uow.Orders.Query().AnyAsync(x => x.CompanyId == request.CompanyId && x.OrderNo == request.OrderNo, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Order number already exists for this company.");
        }

        var buyerExists = await uow.Buyers.Query().AnyAsync(x => x.Id == request.BuyerId && x.CompanyId == request.CompanyId, cancellationToken);
        var styleExists = await uow.Styles.Query().AnyAsync(x => x.Id == request.StyleId && x.CompanyId == request.CompanyId && x.BuyerId == request.BuyerId, cancellationToken);
        if (!buyerExists || !styleExists)
        {
            throw new InvalidOperationException("Buyer/style relationship is invalid for this company.");
        }

        var order = new Order
        {
            CompanyId = request.CompanyId,
            BuyerId = request.BuyerId,
            StyleId = request.StyleId,
            OrderNo = request.OrderNo.Trim(),
            OrderDate = request.OrderDate,
            ShipmentDate = request.ShipmentDate,
            TotalOrderQty = request.TotalOrderQty,
            UnitPrice = request.UnitPrice,
            TotalValue = request.TotalOrderQty * request.UnitPrice,
            CurrencyCode = request.CurrencyCode,
        };

        await uow.Orders.AddAsync(order, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<OrderDto>(order);
    }

    public async Task<OrderDto> Handle(UpdateOrderCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        if (order.OrderStatus is OrderStatuses.Cancelled or OrderStatuses.Shipped)
        {
            throw new InvalidOperationException("Closed orders cannot be updated.");
        }

        order.ShipmentDate = command.Request.ShipmentDate;
        order.TotalOrderQty = command.Request.TotalOrderQty;
        order.UnitPrice = command.Request.UnitPrice;
        order.TotalValue = command.Request.TotalOrderQty * command.Request.UnitPrice;
        order.CurrencyCode = command.Request.CurrencyCode;
        order.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        return mapper.Map<OrderDto>(order);
    }

    public async Task<OrderDto> Handle(ConfirmOrderCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        if (order.OrderStatus == OrderStatuses.Cancelled)
        {
            throw new InvalidOperationException("Cancelled order cannot be confirmed.");
        }

        var breakdownTotal = await uow.Breakdowns.Query().Where(x => x.OrderId == order.Id).SumAsync(x => x.Quantity, cancellationToken);
        if (breakdownTotal == 0)
        {
            throw new InvalidOperationException("Order cannot be confirmed without color-size breakdown.");
        }

        if (breakdownTotal != order.TotalOrderQty)
        {
            throw new InvalidOperationException("Color-size breakdown total must equal order quantity.");
        }

        var previous = order.OrderStatus;
        order.OrderStatus = OrderStatuses.Confirmed;
        order.UpdatedAt = DateTime.UtcNow;
        db.Add(new OrderStatusHistory { CompanyId = order.CompanyId, OrderId = order.Id, FromStatus = previous, ToStatus = order.OrderStatus, Reason = "Order confirmed." });
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        await publisher.PublishAsync(new OrderConfirmed(order.CompanyId, order.Id, order.BuyerId, order.StyleId, order.OrderNo, order.TotalOrderQty, order.ShipmentDate), cancellationToken);
        return mapper.Map<OrderDto>(order);
    }

    public async Task<OrderDto> Handle(CancelOrderCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        if (order.OrderStatus == OrderStatuses.InProduction)
        {
            throw new InvalidOperationException("Order in production cannot be cancelled by merchandising.");
        }

        var previous = order.OrderStatus;
        order.OrderStatus = OrderStatuses.Cancelled;
        order.UpdatedAt = DateTime.UtcNow;
        db.Add(new OrderStatusHistory { CompanyId = order.CompanyId, OrderId = order.Id, FromStatus = previous, ToStatus = order.OrderStatus, Reason = "Order cancelled." });
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        await publisher.PublishAsync(new OrderCancelled(order.CompanyId, order.Id, order.OrderNo), cancellationToken);
        return mapper.Map<OrderDto>(order);
    }

    public async Task<BuyerPurchaseOrderDto> Handle(CreateBuyerPoCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var request = command.Request;
        var exists = await uow.BuyerPurchaseOrders.Query().AnyAsync(x => x.OrderId == order.Id && x.PONo == request.PONo, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Buyer PO number already exists for this order.");
        }

        var po = new BuyerPurchaseOrder
        {
            CompanyId = request.CompanyId,
            OrderId = order.Id,
            PONo = request.PONo.Trim(),
            PODate = request.PODate,
            ShipmentDate = request.ShipmentDate,
            OrderQty = request.OrderQty,
            UnitPrice = request.UnitPrice,
            TotalValue = request.OrderQty * request.UnitPrice,
        };

        await uow.BuyerPurchaseOrders.AddAsync(po, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        return mapper.Map<BuyerPurchaseOrderDto>(po);
    }

    public async Task<BuyerPurchaseOrderDto> Handle(UpdateBuyerPoCommand command, CancellationToken cancellationToken)
    {
        var po = await uow.BuyerPurchaseOrders.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Buyer PO not found.");
        po.PODate = command.Request.PODate;
        po.ShipmentDate = command.Request.ShipmentDate;
        po.OrderQty = command.Request.OrderQty;
        po.UnitPrice = command.Request.UnitPrice;
        po.TotalValue = po.OrderQty * po.UnitPrice;
        po.Status = command.Request.Status;
        po.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(po.OrderId), cancellationToken);
        return mapper.Map<BuyerPurchaseOrderDto>(po);
    }

    public async Task<ColorSizeBreakdownDto> Handle(CreateColorSizeBreakdownCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        EnsureDraft(order, "Color-size breakdown can only be changed while order is draft.");
        var request = command.Request;
        var currentQty = await uow.Breakdowns.Query().Where(x => x.OrderId == order.Id).SumAsync(x => x.Quantity, cancellationToken);
        if (currentQty + request.Quantity > order.TotalOrderQty)
        {
            throw new InvalidOperationException("Color-size breakdown quantity cannot exceed order quantity.");
        }

        var breakdown = new OrderColorSizeBreakdown
        {
            CompanyId = request.CompanyId,
            OrderId = order.Id,
            BuyerPurchaseOrderId = request.BuyerPurchaseOrderId,
            ColorName = request.ColorName.Trim(),
            SizeName = request.SizeName.Trim(),
            Quantity = request.Quantity,
        };
        await uow.Breakdowns.AddAsync(breakdown, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        return mapper.Map<ColorSizeBreakdownDto>(breakdown);
    }

    public async Task<ColorSizeBreakdownDto> Handle(UpdateColorSizeBreakdownCommand command, CancellationToken cancellationToken)
    {
        var breakdown = await uow.Breakdowns.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Color-size breakdown not found.");
        var order = await uow.Orders.GetByIdAsync(breakdown.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        EnsureDraft(order, "Color-size breakdown can only be changed while order is draft.");
        var otherQty = await uow.Breakdowns.Query().Where(x => x.OrderId == order.Id && x.Id != breakdown.Id).SumAsync(x => x.Quantity, cancellationToken);
        if (otherQty + command.Request.Quantity > order.TotalOrderQty)
        {
            throw new InvalidOperationException("Color-size breakdown quantity cannot exceed order quantity.");
        }

        breakdown.BuyerPurchaseOrderId = command.Request.BuyerPurchaseOrderId;
        breakdown.ColorName = command.Request.ColorName.Trim();
        breakdown.SizeName = command.Request.SizeName.Trim();
        breakdown.Quantity = command.Request.Quantity;
        breakdown.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        return mapper.Map<ColorSizeBreakdownDto>(breakdown);
    }

    public async Task<Unit> Handle(DeleteColorSizeBreakdownCommand command, CancellationToken cancellationToken)
    {
        var breakdown = await uow.Breakdowns.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Color-size breakdown not found.");
        var order = await uow.Orders.GetByIdAsync(breakdown.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        EnsureDraft(order, "Color-size breakdown cannot be deleted after confirmation.");
        uow.Breakdowns.Remove(breakdown);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        return Unit.Value;
    }

    public async Task<BomItemDto> Handle(CreateBomItemCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var request = command.Request;
        var item = new BomItem
        {
            CompanyId = request.CompanyId,
            OrderId = order.Id,
            ItemType = request.ItemType,
            ItemCode = request.ItemCode,
            ItemName = request.ItemName.Trim(),
            UnitName = request.UnitName.Trim(),
            Consumption = request.Consumption,
            WastagePercent = request.WastagePercent,
            UnitPrice = request.UnitPrice,
        };
        bomCalculator.Calculate(item, order.TotalOrderQty);
        await uow.BomItems.AddAsync(item, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.BomItems(order.Id), cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        await publisher.PublishAsync(new BomCreated(order.CompanyId, order.Id, await uow.BomItems.Query().CountAsync(x => x.OrderId == order.Id, cancellationToken)), cancellationToken);
        return mapper.Map<BomItemDto>(item);
    }

    public async Task<BomItemDto> Handle(UpdateBomItemCommand command, CancellationToken cancellationToken)
    {
        var item = await uow.BomItems.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("BOM item not found.");
        var order = await uow.Orders.GetByIdAsync(item.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        item.ItemType = command.Request.ItemType;
        item.ItemCode = command.Request.ItemCode;
        item.ItemName = command.Request.ItemName.Trim();
        item.UnitName = command.Request.UnitName.Trim();
        item.Consumption = command.Request.Consumption;
        item.WastagePercent = command.Request.WastagePercent;
        item.UnitPrice = command.Request.UnitPrice;
        item.UpdatedAt = DateTime.UtcNow;
        bomCalculator.Calculate(item, order.TotalOrderQty);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.BomItems(order.Id), cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        return mapper.Map<BomItemDto>(item);
    }

    public async Task<Unit> Handle(DeleteBomItemCommand command, CancellationToken cancellationToken)
    {
        var item = await uow.BomItems.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("BOM item not found.");
        uow.BomItems.Remove(item);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.BomItems(item.OrderId), cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(item.OrderId), cancellationToken);
        return Unit.Value;
    }

    public async Task<BomCalculationResultDto> Handle(CalculateBomCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var items = await uow.BomItems.Query().Where(x => x.OrderId == order.Id).ToListAsync(cancellationToken);
        foreach (var item in items)
        {
            bomCalculator.Calculate(item, order.TotalOrderQty);
        }

        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.BomItems(order.Id), cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        return bomCalculator.Summarize(order.Id, items);
    }

    public async Task<OrderCostingDto> Handle(CreateOrderCostingCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var exists = await uow.Costings.Query().AnyAsync(x => x.OrderId == order.Id, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Costing already exists for this order. Use PUT to update it.");
        }

        var costing = BuildCosting(order.Id, command.Request);
        costingCalculator.Calculate(costing);
        await uow.Costings.AddAsync(costing, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.Costing(order.Id), cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        await publisher.PublishAsync(new CostingCreated(order.CompanyId, order.Id, costing.Id, costing.TotalCost, costing.SellingPrice), cancellationToken);
        return mapper.Map<OrderCostingDto>(costing);
    }

    public async Task<OrderCostingDto> Handle(UpdateOrderCostingCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var costing = await uow.Costings.Query().FirstOrDefaultAsync(x => x.OrderId == order.Id, cancellationToken) ?? throw new KeyNotFoundException("Costing not found.");
        ApplyCosting(costing, command.Request);
        costing.UpdatedAt = DateTime.UtcNow;
        costingCalculator.Calculate(costing);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.Costing(order.Id), cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        return mapper.Map<OrderCostingDto>(costing);
    }

    private static void EnsureDraft(Order order, string message)
    {
        if (order.OrderStatus != OrderStatuses.Draft)
        {
            throw new InvalidOperationException(message);
        }
    }

    private static OrderCosting BuildCosting(Guid orderId, CreateOrderCostingRequest request)
    {
        var costing = new OrderCosting { CompanyId = request.CompanyId, OrderId = orderId };
        ApplyCosting(costing, request);
        return costing;
    }

    private static void ApplyCosting(OrderCosting costing, CreateOrderCostingRequest request)
    {
        costing.FabricCost = request.FabricCost;
        costing.AccessoriesCost = request.AccessoriesCost;
        costing.CM = request.CM;
        costing.WashingCost = request.WashingCost;
        costing.EmbroideryCost = request.EmbroideryCost;
        costing.PrintingCost = request.PrintingCost;
        costing.OtherCost = request.OtherCost;
        costing.SellingPrice = request.SellingPrice;
    }
}

public sealed class SampleShipmentCommandHandlers(
    IUnitOfWork uow,
    IMapper mapper,
    IIntegrationEventPublisher publisher) :
    IRequestHandler<CreateSampleCommand, SampleDto>,
    IRequestHandler<ApproveSampleCommand, SampleDto>,
    IRequestHandler<RejectSampleCommand, SampleDto>,
    IRequestHandler<CreateShipmentPlanCommand, ShipmentPlanDto>,
    IRequestHandler<UpdateShipmentPlanCommand, ShipmentPlanDto>
{
    public async Task<SampleDto> Handle(CreateSampleCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var sample = new Sample
        {
            CompanyId = request.CompanyId,
            BuyerId = request.BuyerId,
            StyleId = request.StyleId,
            SampleType = request.SampleType,
            RequestDate = request.RequestDate,
            SubmitDate = request.SubmitDate,
            Remarks = request.Remarks,
        };
        await uow.Samples.AddAsync(sample, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<SampleDto>(sample);
    }

    public async Task<SampleDto> Handle(ApproveSampleCommand command, CancellationToken cancellationToken)
    {
        var sample = await uow.Samples.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Sample not found.");
        sample.Status = SampleStatuses.Approved;
        sample.ApprovalDate = DateOnly.FromDateTime(DateTime.UtcNow);
        sample.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new SampleApproved(sample.CompanyId, sample.Id, sample.StyleId), cancellationToken);
        return mapper.Map<SampleDto>(sample);
    }

    public async Task<SampleDto> Handle(RejectSampleCommand command, CancellationToken cancellationToken)
    {
        var sample = await uow.Samples.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Sample not found.");
        sample.Status = SampleStatuses.Rejected;
        sample.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<SampleDto>(sample);
    }

    public async Task<ShipmentPlanDto> Handle(CreateShipmentPlanCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var order = await uow.Orders.GetByIdAsync(request.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        await EnsureShipmentBalanceAsync(order, request.PlannedQty, null, cancellationToken);

        var plan = new ShipmentPlan
        {
            CompanyId = request.CompanyId,
            OrderId = request.OrderId,
            BuyerPurchaseOrderId = request.BuyerPurchaseOrderId,
            PlannedShipmentDate = request.PlannedShipmentDate,
            PlannedQty = request.PlannedQty,
            ShipmentMode = request.ShipmentMode,
            Destination = request.Destination,
        };
        await uow.ShipmentPlans.AddAsync(plan, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new ShipmentPlanCreated(plan.CompanyId, plan.Id, plan.OrderId, plan.PlannedQty), cancellationToken);
        return mapper.Map<ShipmentPlanDto>(plan);
    }

    public async Task<ShipmentPlanDto> Handle(UpdateShipmentPlanCommand command, CancellationToken cancellationToken)
    {
        var plan = await uow.ShipmentPlans.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Shipment plan not found.");
        var order = await uow.Orders.GetByIdAsync(plan.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        await EnsureShipmentBalanceAsync(order, command.Request.PlannedQty, plan.Id, cancellationToken);
        plan.BuyerPurchaseOrderId = command.Request.BuyerPurchaseOrderId;
        plan.PlannedShipmentDate = command.Request.PlannedShipmentDate;
        plan.PlannedQty = command.Request.PlannedQty;
        plan.ShipmentMode = command.Request.ShipmentMode;
        plan.Destination = command.Request.Destination;
        plan.Status = command.Request.Status;
        plan.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<ShipmentPlanDto>(plan);
    }

    private async Task EnsureShipmentBalanceAsync(Order order, int plannedQty, Guid? excludingPlanId, CancellationToken cancellationToken)
    {
        if (order.OrderStatus == OrderStatuses.Cancelled)
        {
            throw new InvalidOperationException("Cancelled order cannot be shipped.");
        }

        var alreadyPlanned = await uow.ShipmentPlans.Query()
            .Where(x => x.OrderId == order.Id && x.Status != ShipmentPlanStatuses.Cancelled && (!excludingPlanId.HasValue || x.Id != excludingPlanId.Value))
            .SumAsync(x => x.PlannedQty, cancellationToken);

        if (alreadyPlanned + plannedQty > order.TotalOrderQty)
        {
            throw new InvalidOperationException("Shipment plan quantity cannot exceed order balance quantity.");
        }
    }
}

internal static class CacheKeys
{
    public static string Buyers(Guid companyId) => $"merch:buyers:{companyId}";
    public static string Styles(Guid companyId, Guid? buyerId) => $"merch:styles:{companyId}:{buyerId?.ToString() ?? "all"}";
    public static string OrderDetails(Guid orderId) => $"merch:order-details:{orderId}";
    public static string BomItems(Guid orderId) => $"merch:bom:{orderId}";
    public static string Costing(Guid orderId) => $"merch:costing:{orderId}";
}
