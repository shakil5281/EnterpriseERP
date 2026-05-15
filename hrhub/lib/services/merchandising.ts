import api from '@/lib/api';

export interface Buyer {
    id: number;
    companyId: number;
    branchId: number;
    name: string;
    country: string;
    contactPerson: string;
    email: string;
    phone: string;
    paymentTerms: string;
    currency: string;
    leadTime?: number;
    isActive?: boolean;
}

export interface Brand {
    id: number;
    buyerId: number;
    name: string;
}

export interface Style {
    id: number;
    companyId: number;
    branchId: number;
    buyerId: number;
    brandId?: number;
    styleNumber: string;
    productType: string;
    season: string;
    fabricType: string;
    gsm: string;
}

export interface FabricColorPantone {
    id: number;
    companyId?: number;
    branchId?: number;
    colorName: string;
    pantoneCode?: string;
    isActive?: boolean;
}

export interface ProgramOrder {
    id: number;
    companyId: number;
    branchId: number;
    programNumber: string;
    buyerName: string;
    customerName: string;
    fabricDescription: string;
    programName: string;
    orderDate: string;
    factoryName: string;
    factoryAddress: string;
    articles: ProgramArticle[];
    items?: ProgramArticle[]; // alias used by some pages
    buyerId?: number;
}

export interface ProgramArticle {
    id?: number;
    styleId?: number;
    oldArticleNo: string;
    newArticleNo: string;
    packType: number;
    itemName: string;
    totalQty: number;
    colors: ProgramColor[];
}

export interface ProgramColor {
    id?: number;
    colorId?: number;
    colorName: string;
    sizeBreakdowns: ProgramSizeBreakdown[];
}

export interface ProgramSizeBreakdown {
    id?: number;
    sizeM: number;
    sizeL: number;
    sizeXL: number;
    sizeXXL: number;
    sizeXXXL: number;
    size3XL: number;
    size4XL: number;
    size5XL: number;
    size6XL: number;
    rowTotal: number;
    buyerPackingNumber: string;
    buttonColor?: string;
    buttonColorId?: number;
    buttonQty?: number;
    buttonType?: string;
    buttonSize?: string;
    unit?: string;
    status?: string;
}

// Accessory Interfaces
export interface BaseBooking {
    id: number;
    programOrderId: number;
    orderReference?: string;
    unit: string;
    status: string;
    supplier: string;
    deliveryDate: string;
    requiredQuantity: number;
    programOrder?: ProgramOrder;
}

export interface ButtonBooking extends BaseBooking {
    itemName?: string;
    articleNo?: string;
    buttonType: string;
    buttonSize: string;
    buttonColor: string;
}

export interface ZipperBooking extends BaseBooking {
    zipperType: string;
    zipperSize: string;
    color: string;
    length: string;
}

export interface MainLabelBooking extends BaseBooking {
    material: string;
    printDetails: string;
}

export interface CareLabelBooking extends BaseBooking {
    material: string;
    printDetails: string;
}

export interface PolyBooking extends BaseBooking {
    polyType: string;
    size: string;
    printDetails: string;
}

export interface ThreadBooking extends BaseBooking {
    threadType: string;
    colorCode: string;
    brand: string;
}

export interface StyleOrder {
    id: number;
    poNumber: string;
    orderQuantity: number;
    style?: Style;
    buyer?: Buyer;
}

export interface FabricBooking {
    id: number;
    orderId: number;
    fabricType: string;
    requiredQuantity: number;
    issuedQuantity: number;
    unit: string;
    status: string;
    supplier: string;
    deliveryDate: string;
    styleOrder?: StyleOrder;
}

export interface TechPack {
    id: number;
    styleId: number;
    version: string;
    fileUrl: string;
    uploadDate: string;
    style?: Style;
}

export type OrderSizeBreakdown = ProgramSizeBreakdown;

export interface AccessoriesBooking {
    id: number;
    orderId: number;
    itemName: string;
    quantity: number;
    unit: string;
    status: string;
    supplier: string;
    deliveryDate: string;
    styleOrder?: StyleOrder;
}

export interface SnapButtonBooking extends BaseBooking {
    snapType: string;
    snapSize: string;
    color: string;
}

export interface AccessoryRequirement {
    id?: number;
    programSizeBreakdownId: number;
    accessoryType: string;
    masterColorId?: number;
    masterColorName?: string;
    requiredQuantity?: number;
    specification?: string;
}

export interface AccessoryOrderSummary {
    orderId: number;
    programNumber: string;
    accessories: {
        accessoryType: string;
        totalRequiredQuantity: number;
        mappedColors: number;
        totalSizeBreakdowns: number;
    }[];
}

export const merchandisingService = {
    // Buyers
    async getBuyers(companyId: number) {
        const response = await api.get<Buyer[]>(`/Merchandising/buyers/${companyId}`);
        return response.data;
    },
    async createBuyer(buyer: Partial<Buyer>) {
        const response = await api.post<Buyer>(`/Merchandising/buyers`, buyer);
        return response.data;
    },
    async updateBuyer(id: number, buyer: Partial<Buyer>) {
        const response = await api.put(`/Merchandising/buyers/${id}`, buyer);
        return response.data;
    },
    async deleteBuyer(id: number) {
        const response = await api.delete(`/Merchandising/buyers/${id}`);
        return response.data;
    },

    // Styles
    async getStyles(buyerId: number) {
        const response = await api.get<Style[]>(`/Merchandising/styles/buyer/${buyerId}`);
        return response.data;
    },
    async createStyle(style: Partial<Style>) {
        const response = await api.post<Style>(`/Merchandising/styles`, style);
        return response.data;
    },
    async updateStyle(id: number, style: Partial<Style>) {
        const response = await api.put(`/Merchandising/styles/${id}`, style);
        return response.data;
    },
    async deleteStyle(id: number) {
        const response = await api.delete(`/Merchandising/styles/${id}`);
        return response.data;
    },

    // Brands
    async getBrandsByCompany(companyId: number) {
        const response = await api.get<Brand[]>(`/Merchandising/brands/${companyId}`);
        return response.data;
    },
    async getBrands(buyerId: number) {
        const response = await api.get<Brand[]>(`/Merchandising/brands/buyer/${buyerId}`);
        return response.data;
    },
    async createBrand(brand: Partial<Brand>) {
        const response = await api.post<Brand>(`/Merchandising/brands`, brand);
        return response.data;
    },
    async updateBrand(id: number, brand: Partial<Brand>) {
        const response = await api.put(`/Merchandising/brands/${id}`, brand);
        return response.data;
    },
    async deleteBrand(id: number) {
        const response = await api.delete(`/Merchandising/brands/${id}`);
        return response.data;
    },

    // Master Data (MerchandisingMaster)
    async getColors(companyId: number) {
        const response = await api.get<FabricColorPantone[]>(`/MerchandisingMaster/colors/${companyId}`);
        return response.data;
    },
    async createColor(color: Partial<FabricColorPantone>) {
        const response = await api.post<FabricColorPantone>(`/MerchandisingMaster/colors`, color);
        return response.data;
    },
    async updateColor(color: Partial<FabricColorPantone>) {
        const response = await api.put(`/MerchandisingMaster/colors`, color);
        return response.data;
    },
    async deleteColor(id: number) {
        const response = await api.delete(`/MerchandisingMaster/colors/${id}`);
        return response.data;
    },
    async importColors(file: File, companyId: number, branchId: number) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('companyId', companyId.toString());
        formData.append('branchId', branchId.toString());
        const response = await api.post<any>(`/MerchandisingMaster/colors/import`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    async downloadColorTemplate() {
        const response = await api.get(`/MerchandisingMaster/colors/template`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Color_Template.xlsx`);
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
    },
    async getSeasons(companyId: number) {
        const response = await api.get<any[]>(`/MerchandisingMaster/seasons/${companyId}`);
        return response.data;
    },
    async getFabricGsms(companyId: number) {
        const response = await api.get<any[]>(`/MerchandisingMaster/fabric-gsms/${companyId}`);
        return response.data;
    },
    async getSuppliers(companyId: number) {
        const response = await api.get<any[]>(`/MerchandisingMaster/suppliers/${companyId}`);
        return response.data;
    },

    // Costing
    async getCosting(styleId: number) {
        const response = await api.get<any>(`/Merchandising/costing/${styleId}`);
        return response.data;
    },
    async saveCosting(data: any) {
        const response = await api.post<any>(`/Merchandising/costing`, data);
        return response.data;
    },

    // Fabric Bookings
    async getAllFabricBookings(companyId: number) {
        const response = await api.get<FabricBooking[]>(`/Merchandising/fabric-bookings/${companyId}`);
        return response.data;
    },
    async createFabricBooking(data: Partial<FabricBooking>) {
        const response = await api.post<FabricBooking>(`/Merchandising/fabric-bookings`, data);
        return response.data;
    },
    async updateFabricBooking(id: number, data: Partial<FabricBooking>) {
        const response = await api.put(`/Merchandising/fabric-bookings/${id}`, data);
        return response.data;
    },
    async deleteFabricBooking(id: number) {
        const response = await api.delete(`/Merchandising/fabric-bookings/${id}`);
        return response.data;
    },

    // Tech Packs
    async getAllTechPacks(companyId: number) {
        const response = await api.get<TechPack[]>(`/Merchandising/tech-packs/${companyId}`);
        return response.data;
    },
    async createTechPack(data: Partial<TechPack>) {
        const response = await api.post<TechPack>(`/Merchandising/tech-packs`, data);
        return response.data;
    },
    async deleteTechPack(id: number) {
        const response = await api.delete(`/Merchandising/tech-packs/${id}`);
        return response.data;
    },

    // Knit Machines
    async getKnitMachines(companyId: number) {
        const response = await api.get<any[]>(`/MerchandisingMaster/knit-machines/${companyId}`);
        return response.data;
    },

    // Global Order Summary
    async getGlobalOrderSummary(companyId: number) {
        const response = await api.get<any>(`/OrderSheet/${companyId}/global-summary`);
        return response.data;
    },

    // Program Orders
    async getProgramOrders(companyId: number) {
        return this.getAllProgramOrders(companyId);
    },

    // Program Orders
    async getProgramOrder(id: number) {
        const response = await api.get<ProgramOrder>(`/OrderSheet/detail/${id}`);
        return response.data;
    },

    async getAllProgramOrders(companyId: number) {
        const response = await api.get<ProgramOrder[]>(`/OrderSheet/${companyId}`);
        return response.data;
    },

    async createProgramOrder(order: Partial<ProgramOrder>) {
        const response = await api.post<ProgramOrder>(`/OrderSheet`, order);
        return response.data;
    },

    async updateProgramOrder(id: number, order: ProgramOrder) {
        const response = await api.put(`/OrderSheet/${id}`, order);
        return response.data;
    },

    async deleteProgramOrder(id: number) {
        const response = await api.delete(`/OrderSheet/${id}`);
        return response.data;
    },

    async exportOrder(id: number) {
        const response = await api.get(`/OrderSheet/export/${id}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Order_Sheet_${id}.xlsx`);
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
    },

    async downloadOrderTemplate() {
        const response = await api.get(`/OrderSheet/template`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Order_Sheet_Template.xlsx`);
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
    },

    async previewProgramOrder(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<any>(`/OrderSheet/preview`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    async importProgramOrders(data: any, companyId: number, branchId: number) {
        const response = await api.post(`/OrderSheet/import`, data);
        return response.data;
    },

    // Modular Accessory Bookings - Buttons
    async getButtonBookingsByProgram(programId: number) {
        const response = await api.get<ButtonBooking[]>(`/Merchandising/button-bookings/program/${programId}`);
        return response.data;
    },
    async getAllButtonBookings(companyId: number) {
        const response = await api.get<ButtonBooking[]>(`/Merchandising/button-bookings/${companyId}`);
        return response.data;
    },
    async createButtonBooking(data: Partial<ButtonBooking>) {
        const response = await api.post(`/Merchandising/button-bookings`, data);
        return response.data;
    },
    async updateButtonBooking(id: number, data: Partial<ButtonBooking>) {
        const response = await api.put(`/Merchandising/button-bookings/${id}`, data);
        return response.data;
    },
    async deleteButtonBooking(id: number) {
        const response = await api.delete(`/Merchandising/button-bookings/${id}`);
        return response.data;
    },

    // Modular Accessory Bookings - Zippers
    async getAllZipperBookings(companyId: number) {
        const response = await api.get<ZipperBooking[]>(`/Merchandising/zipper-bookings/${companyId}`);
        return response.data;
    },
    async createZipperBooking(data: Partial<ZipperBooking>) {
        const response = await api.post(`/Merchandising/zipper-bookings`, data);
        return response.data;
    },

    // Modular Accessory Bookings - Main Labels
    async getAllMainLabelBookings(companyId: number) {
        const response = await api.get<MainLabelBooking[]>(`/Merchandising/main-label-bookings/${companyId}`);
        return response.data;
    },
    async createMainLabelBooking(data: Partial<MainLabelBooking>) {
        const response = await api.post(`/Merchandising/main-label-bookings`, data);
        return response.data;
    },
    async updateMainLabelBooking(id: number, data: Partial<MainLabelBooking>) {
        const response = await api.put(`/Merchandising/main-label-bookings/${id}`, data);
        return response.data;
    },
    async deleteMainLabelBooking(id: number) {
        const response = await api.delete(`/Merchandising/main-label-bookings/${id}`);
        return response.data;
    },

    // Modular Accessory Bookings - Care Labels
    async getAllCareLabelBookings(companyId: number) {
        const response = await api.get<CareLabelBooking[]>(`/Merchandising/care-label-bookings/${companyId}`);
        return response.data;
    },
    async createCareLabelBooking(data: Partial<CareLabelBooking>) {
        const response = await api.post(`/Merchandising/care-label-bookings`, data);
        return response.data;
    },

    // Modular Accessory Bookings - Poly
    async getAllPolyBookings(companyId: number) {
        const response = await api.get<PolyBooking[]>(`/Merchandising/poly-bookings/${companyId}`);
        return response.data;
    },
    async createPolyBooking(data: Partial<PolyBooking>) {
        const response = await api.post(`/Merchandising/poly-bookings`, data);
        return response.data;
    },

    // Aggregated Accessories Bookings (Fixes 404 on Summary Page)
    async getAllAccessoriesBookings(companyId: number): Promise<AccessoriesBooking[]> {
        const [buttons, zippers, mainLabels, careLabels, polys, threads, snaps] = await Promise.all([
            this.getAllButtonBookings(companyId),
            this.getAllZipperBookings(companyId),
            this.getAllMainLabelBookings(companyId),
            this.getAllCareLabelBookings(companyId),
            this.getAllPolyBookings(companyId),
            this.getAllThreadBookings(companyId),
            this.getAllSnapButtonBookings(companyId)
        ]);

        const mapBase = (bookings: BaseBooking[], name: string): AccessoriesBooking[] => 
            bookings.map(b => ({
                id: b.id,
                orderId: b.programOrderId,
                itemName: name,
                quantity: b.requiredQuantity,
                unit: b.unit,
                status: b.status,
                supplier: b.supplier,
                deliveryDate: b.deliveryDate
            }));

        return [
            ...buttons.map(b => ({
                id: b.id,
                orderId: b.programOrderId,
                itemName: b.itemName || "Button",
                quantity: b.requiredQuantity,
                unit: b.unit,
                status: b.status,
                supplier: b.supplier,
                deliveryDate: b.deliveryDate
            })),
            ...mapBase(zippers, "Zipper"),
            ...mapBase(mainLabels, "Main Label"),
            ...mapBase(careLabels, "Care Label"),
            ...mapBase(polys, "Poly Booking"),
            ...mapBase(threads, "Sewing Thread"),
            ...mapBase(snaps, "Snap Button")
        ];
    },
    async getOrders(companyId: number): Promise<StyleOrder[]> {
        const response = await api.get<any[]>(`/OrderSheet/${companyId}`);
        return response.data.map(p => ({
            id: p.id,
            poNumber: p.programNumber,
            orderQuantity: p.totalQty,
            style: { styleNumber: p.programNumber } as any
        }));
    },
    async createAccessoriesBooking(data: Partial<AccessoriesBooking>) {
        const itemName = data.itemName?.toLowerCase() || "";
        const payload = {
            programOrderId: data.orderId,
            unit: data.unit,
            status: data.status,
            supplier: data.supplier,
            deliveryDate: data.deliveryDate,
            requiredQuantity: data.quantity,
            itemName: data.itemName // for buttons
        };

        if (itemName.includes("button")) return this.createButtonBooking(payload);
        if (itemName.includes("zipper")) return this.createZipperBooking(payload);
        if (itemName.includes("main label")) return this.createMainLabelBooking(payload);
        if (itemName.includes("care label")) return this.createCareLabelBooking(payload);
        if (itemName.includes("poly")) return this.createPolyBooking(payload);
        if (itemName.includes("thread")) return this.createThreadBooking(payload);

        // Fallback for others (will likely 404 until modularized)
        const response = await api.post(`/Merchandising/accessories-bookings`, data);
        return response.data;
    },
    async updateAccessoriesBooking(id: number, data: Partial<AccessoriesBooking>) {
        const response = await api.put(`/Merchandising/accessories-bookings/${id}`, data);
        return response.data;
    },
    async deleteAccessoriesBooking(id: number) {
        const response = await api.delete(`/Merchandising/accessories-bookings/${id}`);
        return response.data;
    },

    // Modular Accessory Bookings - Thread
    async getAllThreadBookings(companyId: number) {
        const response = await api.get<ThreadBooking[]>(`/Merchandising/thread-bookings/${companyId}`);
        return response.data;
    },
    async createThreadBooking(data: Partial<ThreadBooking>) {
        const response = await api.post(`/Merchandising/thread-bookings`, data);
        return response.data;
    },

    // Snap Button Bookings
    async getAllSnapButtonBookings(companyId: number) {
        const response = await api.get<SnapButtonBooking[]>(`/Merchandising/snap-button-bookings/${companyId}`);
        return response.data;
    },
    async createSnapButtonBooking(data: Partial<SnapButtonBooking>) {
        const response = await api.post(`/Merchandising/snap-button-bookings`, data);
        return response.data;
    },
    async updateSnapButtonBooking(id: number, data: Partial<SnapButtonBooking>) {
        const response = await api.put(`/Merchandising/snap-button-bookings/${id}`, data);
        return response.data;
    },
    async deleteSnapButtonBooking(id: number) {
        const response = await api.delete(`/Merchandising/snap-button-bookings/${id}`);
        return response.data;
    },

    // Generic Accessory Matrix
    async getAccessoryRequirements(orderId: number, type: string) {
        const response = await api.get<AccessoryRequirement[]>(`/AccessoriesMatrix/${orderId}/${type}`);
        return response.data;
    },
    async saveAccessoryRequirements(orderId: number, type: string, data: AccessoryRequirement[]) {
        const response = await api.post(`/AccessoriesMatrix/${orderId}/${type}`, data);
        return response.data;
    },
    async getAccessoryOrderSummary(orderId: number) {
        const response = await api.get<AccessoryOrderSummary>(`/AccessoriesMatrix/order-summary/${orderId}`);
        return response.data;
    }
};

export default merchandisingService;
