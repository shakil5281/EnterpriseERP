import api from "@/lib/api"

export interface BillDto {
  id: number
  employeeCard: number
  employeeId: string
  employeeName: string
  department: string
  designation: string
  date: string
  amount: number
  status: string
  createdAt: string
  shiftName: string
  companyName: string
  inTime?: string
  outTime?: string
}

export interface BillSummaryDto {
  totalAmount: number
  totalEmployees: number
  totalRecords: number
}

export interface BillResponseDto {
  summary: BillSummaryDto
  records: BillDto[]
}

const createBillService = (endpoint: string) => ({
  getAll: async (params: any): Promise<BillResponseDto> => {
    const response = await api.get(`/${endpoint}`, { params })
    return response.data
  },
  process: async (data: any) => {
    const response = await api.post(`/${endpoint}/process`, data)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/${endpoint}/${id}`)
    return response.data
  },
  deleteMultiple: async (ids: number[]) => {
    const response = await api.post(`/${endpoint}/delete-multiple`, ids)
    return response.data
  },
  export: async (params: any) => {
    const response = await api.get(`/${endpoint}/export`, {
      params,
      responseType: "blob",
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `${endpoint}_reports_${new Date().toISOString().split("T")[0]}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  },
})

export const nightBillService = createBillService("NightBill")
export const tiffinBillService = createBillService("TiffinBill")
export const ifterBillService = createBillService("IfterBill")
export const holidayBillService = createBillService("HolidayBill")
