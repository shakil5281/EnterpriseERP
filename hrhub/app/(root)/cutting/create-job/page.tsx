"use client"

import * as React from "react"
import { IconCheck, IconChevronRight, IconCircleNumber1, IconCircleNumber2, IconCircleNumber3, IconCircleNumber4 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function CreateJobPage() {
    const [step, setStep] = React.useState(1)

    const nextStep = () => setStep((p) => Math.min(p + 1, 4))
    const prevStep = () => setStep((p) => Math.max(p - 1, 1))

    return (
        <div className="flex flex-col gap-6 py-8 px-4 lg:px-6 max-w-4xl mx-auto min-h-screen">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Create New Cutting Job</h1>
                <p className="text-muted-foreground">Follow the steps to configure a new production cut.</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-center gap-4 py-4">
                {[
                    { s: 1, label: "Job Details" },
                    { s: 2, label: "Cut Plan" },
                    { s: 3, label: "Marker & Fabric" },
                    { s: 4, label: "Review" }
                ].map((item, i) => (
                    <React.Fragment key={item.s}>
                        {i > 0 && <div className={`h-1 w-12 rounded-full ${step >= item.s ? 'bg-primary' : 'bg-muted'}`} />}
                        <div className={`flex flex-col items-center gap-2 ${step === item.s ? 'text-primary' : step > item.s ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${step === item.s ? 'border-primary bg-primary text-primary-foreground' : step > item.s ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background'
                                }`}>
                                {step > item.s ? <IconCheck className="size-4" /> : item.s}
                            </div>
                            <span className="text-xs font-medium">{item.label}</span>
                        </div>
                    </React.Fragment>
                ))}
            </div>

            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle>
                        {step === 1 && "Job Details"}
                        {step === 2 && "Cutting Plan Configuration"}
                        {step === 3 && "Marker & Fabric Assignment"}
                        {step === 4 && "Review & Confirm"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && "Select the order and style information."}
                        {step === 2 && "Define size ratios and cutting quantities."}
                        {step === 3 && "Link marker and allocate fabric rolls."}
                        {step === 4 && "Verify all details before finalizing."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {step === 1 && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Order Number</Label>
                                <Select>
                                    <SelectTrigger><SelectValue placeholder="Select PO" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="po1">PO-9988</SelectItem>
                                        <SelectItem value="po2">PO-9989</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Style Number</Label>
                                <Select>
                                    <SelectTrigger><SelectValue placeholder="Select Style" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="st1">ST-5050 (Cotton Tee)</SelectItem>
                                        <SelectItem value="st2">ST-5051 (Denim Jacket)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Buyer</Label>
                                <Input disabled value="H&M" />
                            </div>
                            <div className="space-y-2">
                                <Label>Target Date</Label>
                                <Input type="date" />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-5 gap-2 text-center text-sm font-medium text-muted-foreground pb-2 border-b">
                                <div>Size</div>
                                <div>Ratio</div>
                                <div>Ply Qty</div>
                                <div>Total</div>
                            </div>
                            {["S", "M", "L", "XL"].map((size) => (
                                <div key={size} className="grid grid-cols-5 gap-2 items-center">
                                    <div className="font-bold text-center bg-muted/20 py-2 rounded">{size}</div>
                                    <Input className="text-center h-9" placeholder="1" />
                                    <Input className="text-center h-9" placeholder="0" />
                                    <div className="text-center font-bold text-primary">0</div>
                                </div>
                            ))}
                            <Separator />
                            <div className="flex justify-between items-center pt-2">
                                <span className="font-bold text-muted-foreground">Total Plan Qty</span>
                                <span className="text-2xl font-black">0 pcs</span>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Assign Marker</Label>
                                <Select>
                                    <SelectTrigger><SelectValue placeholder="Select Marker ID" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="m1">MK-5001 (Eff: 85%)</SelectItem>
                                        <SelectItem value="m2">MK-5002 (Eff: 88%)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Fabric Source</Label>
                                <Select>
                                    <SelectTrigger><SelectValue placeholder="Select Fabric Type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="f1">Cotton Jersey - White</SelectItem>
                                        <SelectItem value="f2">Denim 12oz - Indigo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 border rounded-lg p-4 bg-muted/10">
                                <h4 className="font-semibold mb-2 text-sm">Allocated Rolls</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between p-2 bg-background rounded border">
                                        <span>RL-1001 (120 yds)</span>
                                        <span className="text-emerald-600 font-bold">Allocated</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-background rounded border">
                                        <span>RL-1005 (80 yds)</span>
                                        <span className="text-emerald-600 font-bold">Allocated</span>
                                    </div>
                                </div>
                                <Button variant="secondary" size="sm" className="w-full mt-3">+ Add Roll</Button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="bg-muted/30 p-6 rounded-lg space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Job Ref</span>
                                <span className="font-bold">New-Job-001</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Style</span>
                                <span className="font-bold">ST-5050 / PO-9988</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Total Cut Plan</span>
                                <span className="font-bold">1,200 pcs</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Marker</span>
                                <span className="font-bold">MK-5001</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Est. Fabric Req</span>
                                <span className="font-bold">450 yds</span>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={prevStep} disabled={step === 1}>Previous</Button>
                    {step < 4 ? (
                        <Button onClick={nextStep}>Next <IconChevronRight className="ml-2 size-4" /></Button>
                    ) : (
                        <Button onClick={() => toast.success("Cutting Job Created Successfully!")} className="bg-emerald-600 hover:bg-emerald-700">
                            Create Job
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
