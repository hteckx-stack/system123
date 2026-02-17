"use client"

import { useState, useMemo } from "react"
import { AddStaffDialog } from "./components/add-staff-dialog"
import { EditStaffDialog } from "./components/edit-staff-dialog"
import type { Staff } from "@/lib/types"
import { StaffCard } from "./components/staff-card"
import { useCollection, useFirestore } from "@/firebase"
import { collection } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function StaffPage() {
  const firestore = useFirestore()
  const staffQuery = useMemo(() => collection(firestore, "users"), [firestore])
  const { data: staffList, loading } = useCollection<Staff>(staffQuery)

  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff)
  }

  const handleUpdateStaff = (updatedStaff: Staff) => {
    // onSnapshot will handle the update
    setEditingStaff(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Staff Management
          </h1>
          <p className="text-muted-foreground">
            Manage all staff members in your organization.
          </p>
        </div>
        <AddStaffDialog />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-6 w-16" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {staffList &&
            staffList.map((staff) => (
              <StaffCard key={staff.id} staff={staff} onEdit={handleEdit} />
            ))}
          {(!staffList || staffList.length === 0) && (
            <div className="col-span-full rounded-lg border-2 border-dashed border-muted-foreground/30 py-12 text-center">
              <h3 className="text-lg font-medium text-muted-foreground">
                No staff members found
              </h3>
              <p className="text-sm text-muted-foreground">
                Add a new staff member to get started.
              </p>
            </div>
          )}
        </div>
      )}

      <EditStaffDialog
        staff={editingStaff}
        onUpdateStaff={handleUpdateStaff}
        open={!!editingStaff}
        onOpenChange={(open) => {
          if (!open) {
            setEditingStaff(null)
          }
        }}
      />
    </div>
  )
}
