namespace MerchandisingService.Domain;

public static class OrderStatuses
{
    public const string Draft = "Draft";
    public const string Confirmed = "Confirmed";
    public const string InProduction = "InProduction";
    public const string PartiallyShipped = "PartiallyShipped";
    public const string Shipped = "Shipped";
    public const string Cancelled = "Cancelled";
}

public static class BuyerPoStatuses
{
    public const string Open = "Open";
    public const string Closed = "Closed";
    public const string Cancelled = "Cancelled";
}

public static class BomItemTypes
{
    public static readonly string[] Values =
    [
        "Fabric", "Accessories", "Thread", "Button", "Zipper", "Label", "Carton", "Poly", "Chemical"
    ];
}

public static class SampleTypes
{
    public static readonly string[] Values = ["Development", "Fit", "PP", "SizeSet", "Shipment"];
}

public static class SampleStatuses
{
    public const string Pending = "Pending";
    public const string Submitted = "Submitted";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string Revised = "Revised";
}

public static class ShipmentModes
{
    public static readonly string[] Values = ["Sea", "Air", "Road"];
}

public static class ShipmentPlanStatuses
{
    public const string Planned = "Planned";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
}

public static class MerchandisingRoles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string GroupAdmin = "GroupAdmin";
    public const string CompanyAdmin = "CompanyAdmin";
    public const string MerchandisingManager = "MerchandisingManager";
    public const string Merchandiser = "Merchandiser";
    public const string CostingOfficer = "CostingOfficer";
    public const string ProductionManager = "ProductionManager";
    public const string StoreManager = "StoreManager";
    public const string Auditor = "Auditor";
    public const string Viewer = "Viewer";
}

public static class MerchandisingPermissions
{
    public const string BuyerManage = "BUYER_MANAGE";
    public const string StyleManage = "STYLE_MANAGE";
    public const string OrderCreate = "ORDER_CREATE";
    public const string OrderUpdate = "ORDER_UPDATE";
    public const string OrderConfirm = "ORDER_CONFIRM";
    public const string OrderCancel = "ORDER_CANCEL";
    public const string BomManage = "BOM_MANAGE";
    public const string CostingManage = "COSTING_MANAGE";
    public const string SampleManage = "SAMPLE_MANAGE";
    public const string ShipmentPlanManage = "SHIPMENT_PLAN_MANAGE";
    public const string ReportView = "MERCHANDISING_REPORT_VIEW";
}
