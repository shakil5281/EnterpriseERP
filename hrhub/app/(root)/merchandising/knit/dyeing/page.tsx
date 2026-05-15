"use client"

import MasterGrid from "@/components/merchandising/MasterGrid"

export default function DyeingMachinesPage() {
    return (
        <div className="py-8 px-6 bg-slate-50 min-h-screen space-y-8">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Dyeing Machine List</h1>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Production / Processing Assets</p>
            </div>

            <MasterGrid
                title="Dyeing Units"
                description="Manage fabric and yarn dyeing machine inventory"
                fetchData={() => Promise.resolve([])}
                createData={(data) => Promise.resolve(data)}
            />
        </div>
    )
}
