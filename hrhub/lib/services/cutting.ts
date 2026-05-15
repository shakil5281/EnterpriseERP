import axios from 'axios';
import { getPublicApiBaseUrl } from '@/lib/api-base';

const API_URL = getPublicApiBaseUrl();

export interface CuttingPlan {
    id?: number;
    planNumber: string;
    styleName: string;
    orderNumber: string;
    targetDate: string;
    plannedQuantity: number;
    priority: string;
    status: string;
}

export interface FabricBooking {
    id?: number;
    orderReference: string;
    fabricType: string;
    requiredQuantity: number;
    issuedQuantity: number;
    unit: string;
    status: string;
}

export interface MarkerLayout {
    id?: number;
    markerId: string;
    styleName: string;
    width: string;
    length: string;
    efficiency: number;
    cadFilePath?: string;
    status: string;
}

export interface CuttingBatchItem {
    id?: number;
    size: string;
    quantity: number;
    wastage: number;
}

export interface CuttingBatch {
    id?: number;
    batchNumber: string;
    planId?: number;
    markerId?: number;
    cuttingDate: string;
    cutterName: string;
    tableNumber: string;
    items: CuttingBatchItem[];
    totalQuantity: number;
    totalWastage: number;
}

export interface Bundle {
    id?: number;
    bundleTag: string;
    cuttingBatchId: number;
    styleName: string;
    size: string;
    pieceCount: number;
    serialRange: string;
    weight: string;
    currentLocation: string;
    status: string;
}

export interface WastageRecord {
    id?: number;
    date: string;
    category: string;
    reason: string;
    amount: number;
    unit: string;
}

export const cuttingService = {
    getSummary: async () => {
        const response = await axios.get(`${API_URL}/cutting/summary`);
        return response.data;
    },

    // Plans
    getPlans: async () => {
        const response = await axios.get(`${API_URL}/cutting/plans`);
        return response.data;
    },
    createPlan: async (plan: CuttingPlan) => {
        const response = await axios.post(`${API_URL}/cutting/plans`, plan);
        return response.data;
    },

    // Fabric Bookings
    getFabricBookings: async () => {
        const response = await axios.get(`${API_URL}/cutting/fabric-bookings`);
        return response.data;
    },
    createFabricBooking: async (booking: FabricBooking) => {
        const response = await axios.post(`${API_URL}/cutting/fabric-bookings`, booking);
        return response.data;
    },

    // Markers
    getMarkers: async () => {
        const response = await axios.get(`${API_URL}/cutting/markers`);
        return response.data;
    },
    createMarker: async (marker: MarkerLayout) => {
        const response = await axios.post(`${API_URL}/cutting/markers`, marker);
        return response.data;
    },

    // Batches
    getBatches: async () => {
        const response = await axios.get(`${API_URL}/cutting/batches`);
        return response.data;
    },
    createBatch: async (batch: CuttingBatch) => {
        const response = await axios.post(`${API_URL}/cutting/batches`, batch);
        return response.data;
    },

    // Bundles
    getBundles: async () => {
        const response = await axios.get(`${API_URL}/cutting/bundles`);
        return response.data;
    },
    createBundle: async (bundle: Bundle) => {
        const response = await axios.post(`${API_URL}/cutting/bundles`, bundle);
        return response.data;
    },
    updateBundleStatus: async (id: number, status: string, location: string) => {
        const response = await axios.patch(`${API_URL}/cutting/bundles/${id}/status`, null, {
            params: { status, location }
        });
        return response.data;
    },

    // Wastage
    getWastage: async () => {
        const response = await axios.get(`${API_URL}/cutting/wastage`);
        return response.data;
    },
    createWastage: async (record: WastageRecord) => {
        const response = await axios.post(`${API_URL}/cutting/wastage`, record);
        return response.data;
    }
};
