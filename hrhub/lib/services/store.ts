import api from '../api';

export interface ItemCategory {
    id: number;
    categoryName: string;
    description?: string;
    isActive: boolean;
}

export interface StoreUnit {
    id: number;
    unitName: string;
    shortName: string;
    unitType?: string;
}

export interface StoreItem {
    id: number;
    itemCode: string;
    itemName: string;
    categoryId: number;
    categoryName?: string;
    unitId: number;
    unitName?: string;
    openingStock: number;
    currentStock: number;
    minimumStockLevel: number;
    unitPrice: number;
    description?: string;
    isActive: boolean;
}

export interface Buyer {
    id: number;
    buyerName: string;
    country?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    isActive: boolean;
}

export interface StoreOrderItem {
    id?: number;
    itemId: number;
    itemName?: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
}

export interface StoreOrder {
    id?: number;
    orderNumber: string;
    buyerId: number;
    buyerName: string;
    orderDate: string;
    status: string;
    remarks?: string;
    orderItemsCount: number;
    orderItems: StoreOrderItem[];
}

export interface StoreBooking {
    id?: number;
    bookingNumber: string;
    orderId: number;
    orderNumber: string;
    itemId: number;
    itemName: string;
    itemCode: string;
    unitName: string;
    bookedQuantity: number;
    issuedQty?: number;
    bookingDate: string;
    bookingType: string;
    status: string;
    remarks?: string;
}

export interface StockTransaction {
    id?: number;
    transactionNumber: string;
    itemId: number;
    itemName?: string;
    type: string;
    quantity: number;
    referenceNumber?: string;
    departmentOrLine?: string;
    locationOrBin?: string;
    supplierName?: string;
    transactionDate: string;
}

export interface StockDashboardSummary {
    totalStockValue: number;
    activeSKUs: number;
    lowStockItems: number;
    totalOrders: number;
    pendingBookings: number;
}

const storeService = {
    // Categories
    getCategories: async () => {
        const response = await api.get<ItemCategory[]>('/store/categories');
        return response.data;
    },
    addCategory: async (category: Partial<ItemCategory>) => {
        const response = await api.post<ItemCategory>('/store/categories', category);
        return response.data;
    },

    // Units
    getUnits: async () => {
        const response = await api.get<StoreUnit[]>('/store/units');
        return response.data;
    },
    addUnit: async (unit: Partial<StoreUnit>) => {
        const response = await api.post<StoreUnit>('/store/units', unit);
        return response.data;
    },

    // Items
    getItems: async () => {
        const response = await api.get<StoreItem[]>('/store/items');
        return response.data;
    },
    addItem: async (item: Partial<StoreItem>) => {
        const response = await api.post<StoreItem>('/store/items', item);
        return response.data;
    },

    // Buyers
    getBuyers: async () => {
        const response = await api.get<Buyer[]>('/store/buyers');
        return response.data;
    },
    addBuyer: async (buyer: Partial<Buyer>) => {
        const response = await api.post<Buyer>('/store/buyers', buyer);
        return response.data;
    },

    // Orders
    getOrders: async () => {
        const response = await api.get<StoreOrder[]>('/store/orders');
        return response.data;
    },
    addOrder: async (order: Partial<StoreOrder>) => {
        const response = await api.post<StoreOrder>('/store/orders', order);
        return response.data;
    },

    // Bookings
    getBookings: async (type?: string) => {
        const response = await api.get<StoreBooking[]>(`/store/bookings${type ? `?type=${type}` : ''}`);
        return response.data;
    },
    addBooking: async (booking: Partial<StoreBooking>) => {
        const response = await api.post<StoreBooking>('/store/bookings', booking);
        return response.data;
    },

    // Transactions
    stockIn: async (data: Partial<StockTransaction>) => {
        const response = await api.post<StockTransaction>('/store/stock-in', data);
        return response.data;
    },
    stockOut: async (data: Partial<StockTransaction>) => {
        const response = await api.post<StockTransaction>('/store/stock-out', data);
        return response.data;
    },
    getTransactions: async () => {
        const response = await api.get<StockTransaction[]>('/store/transactions');
        return response.data;
    },

    // Dashboard & Reports
    getDashboardSummary: async () => {
        const response = await api.get<StockDashboardSummary>('/store/dashboard-summary');
        return response.data;
    },
    getLowStock: async () => {
        const response = await api.get<StoreItem[]>('/store/low-stock');
        return response.data;
    },
    getShortageReport: async () => {
        const response = await api.get<StoreBooking[]>('/store/shortage-report');
        return response.data;
    }
};

export default storeService;
