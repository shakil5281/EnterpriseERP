"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    DataTable
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { IconBuilding, IconCircleCheckFilled, IconLoader } from "@tabler/icons-react"
import { type ColumnDef } from "@tanstack/react-table"
import { companyService, Company } from "@/lib/services/company"
import { toast } from "sonner"
import { getPublicApiOrigin } from "@/lib/api-base"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

const companyColumns: ColumnDef<Company>[] = [
    {
        id: "sl",
        header: "SL",
        cell: ({ row }) => <div className="text-center font-medium">{row.index + 1}</div>,
        size: 40,
    },
    {
        accessorKey: "logoPath",
        header: "Logo",
        cell: ({ row }) => row.original.logoPath ? (
            <img
                src={
                    row.original.logoPath.startsWith("http")
                        ? row.original.logoPath
                        : `${getPublicApiOrigin()}${row.original.logoPath}`
                }
                alt="Logo"
                className="size-10 object-contain rounded border"
            />
        ) : (
            <div className="size-10 bg-muted flex items-center justify-center rounded border">
                <IconBuilding className="size-5 text-muted-foreground" />
            </div>
        ),
    },
    {
        accessorKey: "companyNameEn",
        header: "Company Name",
        cell: ({ row }) => <span className="font-medium">{row.original.companyNameEn}</span>,
    },
    {
        accessorKey: "branch",
        header: "Branch Type",
        cell: ({ row }) => (
            <Badge variant={row.original.branch === 1 ? "default" : "secondary"}>
                {row.original.branch === 1 ? "Primary" : "Secondary"}
            </Badge>
        ),
    },
    {
        accessorKey: "industry",
        header: "Industry",
        cell: ({ row }) => (
            <Badge variant="outline" className="text-muted-foreground px-1.5 font-normal">
                {row.original.industry}
            </Badge>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <Badge variant="outline" className="flex items-center gap-1.5 w-fit font-normal capitalize">
                {row.original.status === "Active" ? (
                    <IconCircleCheckFilled className="size-3.5 text-green-500" />
                ) : (
                    <IconLoader className="size-3.5 text-muted-foreground animate-spin-slow" />
                )}
                {row.original.status}
            </Badge>
        ),
    },
]

export default function CompanyInformationPage() {
    const router = useRouter()
    const [companies, setCompanies] = React.useState<Company[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [deleteId, setDeleteId] = React.useState<number | null>(null)

    const fetchCompanies = React.useCallback(async () => {
        try {
            setIsLoading(true)
            const data = await companyService.getAll()
            setCompanies(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch companies")
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchCompanies()
    }, [fetchCompanies])

    const handleEdit = (company: Company) => {
        router.push(`/management/information/company-information/edit/${company.entityId}`)
    }

    const handleDelete = async (company: Company) => {
        try {
            await companyService.delete(company.entityId)
            toast.success("Company deleted successfully")
            fetchCompanies()
        } catch (error: any) {
            console.error(error)
            const data = error.response?.data
            const errorMessage = data?.message || "Failed to delete company"
            toast.error(errorMessage, {
                description: data?.details
            })
        }
    }

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center gap-2 px-4 lg:px-6">
                <IconBuilding className="size-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">Company Information</h1>
            </div>

            <DataTable
                data={companies}
                columns={companyColumns}
                showTabs={false}
                showColumnCustomizer={false}
                isLoading={isLoading}
                enableSelection={true}
                enableDrag={true}
                addLabel="Add New"
                onAddClick={() => router.push("/management/information/company-information/create")}
                onEditClick={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    )
}
