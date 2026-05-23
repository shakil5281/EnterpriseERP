"use client";

import Link from "next/link";
import { IconChevronLeft, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaveCompanyBar } from "@/components/leave/leave-company-bar";
import { LeaveTypeForm } from "@/components/leave/leave-type-form";
import { LeavePermissionGate } from "@/components/leave/leave-permission-gate";

export default function CreateLeaveTypePage() {
  return (
    <div className="flex flex-col gap-6 py-6 px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/management/leave/leave-type">
            <IconChevronLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <IconPlus className="size-6" /> Create leave type
          </h1>
          <p className="text-muted-foreground text-sm">
            Add a new leave type and entitlement policy for the active company.
          </p>
        </div>
      </div>
      <LeaveCompanyBar showYear={false} />
      <LeavePermissionGate permission="LEAVE_TYPE_MANAGE">
        <Card>
          <CardHeader>
            <CardTitle>Leave type details</CardTitle>
          </CardHeader>
          <CardContent>
            <LeaveTypeForm />
          </CardContent>
        </Card>
      </LeavePermissionGate>
    </div>
  );
}
