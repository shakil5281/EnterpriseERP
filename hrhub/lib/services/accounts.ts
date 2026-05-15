import api from "@/lib/api"

export interface Branch {
    id?: number
    branchName: string
    branchCode?: string
    address?: string
    phone?: string
    initialBalance: number
    currentBalance?: number
    isActive: boolean
}

export interface AccountTransaction {
    id?: number
    transactionNumber?: string
    transactionDate: string
    type: string
    fundSource: string
    branchId?: number
    branchName?: string
    amount: number
    category?: string
    referenceNumber?: string
    description?: string
    preparedBy?: string
    createdAt?: string
}

export interface AdvancePayment {
    id?: number
    employeeOrContractorName: string
    date: string
    totalAmount: number
    paidAmount: number
    dueAmount?: number
    paymentType?: string
    status?: string
}

export interface AccountSummary {
    totalCashBalance: number
    totalBankBalance: number
    totalHandCash: number
    todaysReceive: number
    todaysPayment: number
    activeAdvances: number
}

export const accountService = {
    // Branches
    getBranches: () => api.get<Branch[]>("/Account/branches"),
    createBranch: (branch: Branch) => api.post<Branch>("/Account/branches", branch),
    updateBranch: (branch: Branch) => api.put("/Account/branches", branch),
    deleteBranch: (id: number) => api.delete(`/Account/branches/${id}`),

    // Transactions
    getTransactions: (type?: string, fundSource?: string) =>
        api.get<AccountTransaction[]>(`/Account/transactions`, { params: { type, fundSource } }),
    getTransaction: (id: number) => api.get<AccountTransaction>(`/Account/transactions/${id}`),
    createTransaction: (tx: AccountTransaction) => api.post<AccountTransaction>("/Account/transactions", tx),

    // Advances
    getAdvances: () => api.get<AdvancePayment[]>("/Account/advances"),
    createAdvance: (advance: AdvancePayment) => api.post<AdvancePayment>("/Account/advances", advance),

    getSummary: () => api.get<AccountSummary>("/Account/summary"),
    getLedgerReport: (branchId?: number, fundSource?: string) =>
        api.get("/Account/reports/ledger", { params: { branchId, fundSource } }),

    exportVoucherExcel: (id: number) =>
        api.get(`/Account/transactions/${id}/export/excel`, { responseType: 'blob' }),
    exportVoucherPdf: (id: number) =>
        api.get(`/Account/transactions/${id}/export/pdf`, { responseType: 'blob' }),
    exportReportExcel: (type: "Receive" | "Payment") =>
        api.get("/Account/reports/export/excel", {
            params: { type },
            responseType: "blob",
        }),
    exportReportPdf: (type: "Receive" | "Payment") =>
        api.get("/Account/reports/export/pdf", {
            params: { type },
            responseType: "blob",
        }),
}
