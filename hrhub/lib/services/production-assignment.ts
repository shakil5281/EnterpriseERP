import api from '../api';

export interface ProductionAssignment {
    id: number;
    productionId: number;
    styleNo: string;
    buyer: string;
    lineId: number;
    lineName: string;
    totalTarget: number;
    assignDate: string;
    status: string;
}

export interface CreateProductionAssignment {
    productionId: number;
    lineId: number;
    totalTarget: number;
    status: string;
}

export interface DailyProductionRecord {
    id?: number;
    assignmentId: number;
    date: string;
    dailyTarget: number;
    hourlyTarget: number;
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
    h7: number;
    h8: number;
    h9: number;
    h10: number;
    h11: number;
    h12: number;
    h13: number;
    h14: number;
    h15: number;
    h16: number;
    h17: number;
    h18: number;
    h19: number;
    totalCompleted: number;
}

export interface SaveDailyProduction {
    assignmentId: number;
    date: string;
    dailyTarget: number;
    hourlyTarget: number;
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
    h7: number;
    h8: number;
    h9: number;
    h10: number;
    h11: number;
    h12: number;
    h13: number;
    h14: number;
    h15: number;
    h16: number;
    h17: number;
    h18: number;
    h19: number;
}

export interface DailyReportItem {
    id: string;
    assignmentId: number;
    lineName: string;
    styleNo: string;
    buyer: string;
    dailyTarget: number;
    hourlyTarget: number;
    completed: number;
    achievement: number;
}

export interface MonthlyReportItem {
    id: string;
    month: string;
    year: number;
    lineName: string;
    totalTarget: number;
    totalCompleted: number;
    avgAchievement: number;
    workingDays: number;
    topStyle: string;
}

export const productionAssignmentService = {
    getAll: async () => {
        const response = await api.get<ProductionAssignment[]>('/productionassignment');
        return response.data;
    },
    create: async (data: CreateProductionAssignment) => {
        const response = await api.post<ProductionAssignment>('/productionassignment', data);
        return response.data;
    },
    update: async (id: number, data: CreateProductionAssignment) => {
        const response = await api.put(`/productionassignment/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/productionassignment/${id}`);
        return response.data;
    },
    getDailyRecord: async (assignmentId: number, date: string) => {
        const response = await api.get<DailyProductionRecord>('/productionassignment/daily-record', {
            params: { assignmentId, date }
        });
        return response.data;
    },
    saveDailyRecord: async (data: SaveDailyProduction) => {
        const response = await api.post<DailyProductionRecord>('/productionassignment/daily-record', data);
        return response.data;
    },
    deleteDailyRecord: async (assignmentId: number, date: string) => {
        const response = await api.delete('/productionassignment/daily-record', {
            params: { assignmentId, date }
        });
        return response.data;
    },
    getDailyReport: async (params: any) => {
        const response = await api.get<DailyReportItem[]>('/productionassignment/report/daily', {
            params
        });
        return response.data.map((item, index) => ({
            ...item,
            id: `${item.lineName}-${item.styleNo}-${index}`
        }));
    },
    exportExcel: async (params: any) => {
        const response = await api.get('/productionassignment/report/daily/export/excel', {
            params,
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `DailyProductionReport_${params.date || new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },
    exportHourlyExcel: async (params: any) => {
        const response = await api.get('/productionassignment/record/hourly/export/excel', {
            params,
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `HourlyBreakdown_${params.date || new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },
    exportPdf: async (params: any) => {
        const response = await api.get('/productionassignment/report/daily/export/pdf', {
            params,
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `DailyProductionReport_${params.date || new Date().toISOString().split('T')[0]}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },
    getMonthlyReport: async (params: any) => {
        const response = await api.get<MonthlyReportItem[]>('/productionassignment/report/monthly', {
            params
        });
        return response.data.map((item, index) => ({
            ...item,
            id: `${item.year}-${item.month}-${item.lineName}-${index}`
        }));
    }
};
