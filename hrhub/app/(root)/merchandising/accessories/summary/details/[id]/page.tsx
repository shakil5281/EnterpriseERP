"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { merchandisingService } from "@/lib/services/merchandising"
import type { MaterialBooking, Order } from "@/lib/types/merchandising"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconArrowLeft, IconLoader2 } from "@tabler/icons-react"
import { toast } from "sonner"

export default function AccessoryOrderSummaryDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const orderId = params.id as string
    const [order, setOrder] = React.useState<Order | null>(null)
    const [bookings, setBookings] = React.useState<MaterialBooking[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        async function load() {
            try {
                setLoading(true)
                const [o, b] = await Promise.all([
                    merchandisingService.getOrderById(orderId),
                    merchandisingService.getMaterialBookings(undefined, orderId),
                ])
                setOrder(o)
                setBookings(b)
            } catch {
                toast.error("Failed to load booking summary")
            } finally {
                setLoading(false)
            }
        }
        if (orderId) load()
    }, [orderId])

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 py-6 px-6">
            <Button variant="ghost" className="w-fit" onClick={() => router.back()}>
                <IconArrowLeft className="mr-2 size-4" /> Back
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>{order?.orderNo ?? "Order"} — Material Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                    {bookings.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No bookings for this order.</p>
                    ) : (
                        <ul className="space-y-2">
                            {bookings.map((b) => (
                                <li key={b.id} className="flex justify-between border-b py-2 text-sm">
                                    <span>{b.bookingNo} ({b.bookingType})</span>
                                    <span>{b.status} — {b.totalQty}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Button className="mt-4" onClick={() => router.push(`/merchandising/bookings?orderId=${orderId}`)}>
                        Open bookings
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
