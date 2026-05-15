"use client"

import MasterGrid from "@/components/merchandising/MasterGrid"
import { merchandisingService } from "@/lib/services/merchandising"
import { getPublicApiBaseUrl } from "@/lib/api-base"

export default function KnitMachinesPage() {
    return (
        <div className="py-8 px-6 bg-background min-h-screen space-y-8">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Knit Machine List</h1>
                <p className="text-sm text-foreground/60 font-bold uppercase tracking-widest text-orange-600 dark:text-orange-500">Production / Machine Assets</p>
            </div>

            <MasterGrid
                title="Knitting Units"
                description="Manage circular and flat knit machine inventory"
                fetchData={() => merchandisingService.getKnitMachines(1)}
                createData={(data) => {
                    return fetch(`${getPublicApiBaseUrl()}/MerchandisingMaster/knit-machines`, {
                        method: 'POST',
                        body: JSON.stringify(data),
                        headers: { 'Content-Type': 'application/json' }
                    }).then(res => res.json());
                }}
            />
        </div>
    )
}
