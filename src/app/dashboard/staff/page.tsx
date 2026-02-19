"use client"

import { useState, useMemo } from "react"
import { EditStaffDialog } from "./components/edit-staff-dialog"
import { AddStaffDialog } from "./components/add-staff-dialog"
import type { Staff } from "@/lib/types"
import { StaffCard } from "./components/staff-card"
import { useCollection, useFirestore } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { UserPlus, Search, Users, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export default function StaffPage() {
  const firestore = useFirestore()
  
  const staffQuery = useMemo(() => query(
    collection(firestore, "users"), 
    where("role", "==", "staff")
  ), [firestore])
  
  const { data: staffList, loading } = useCollection<Staff>(staffQuery)

  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false)
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredStaffList = useMemo(() => {
    if (!staffList) return []
    let result = [...staffList]
    
    if (filter !== "all") {
      result = result.filter((staff) => staff.status === filter)
    }

    if (searchQuery) {
      result = result.filter((staff) => 
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.department.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return result
  }, [staffList, filter, searchQuery])

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Staff Directory</h1>
          <p className="text-[#6B7280]">Centralized management of employee profiles and access permissions.</p>
        </div>
        <Button onClick={() => setIsAddStaffDialogOpen(true)} className="rounded-xl h-11 px-6 font-bold shadow-lg shadow-primary/20 gap-2">
          <UserPlus className="h-5 w-5" />
          Add Staff Member
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl shadow-soft border border-slate-50">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Search by name, role, or department..." 
            className="pl-12 h-12 rounded-xl border-none bg-slate-50/50 focus-visible:ring-accent/10 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="h-10 w-px bg-slate-100 hidden md:block"></div>
        <div className="flex items-center gap-2 pr-2">
           <Tabs value={filter} onValueChange={setFilter} className="w-auto">
            <TabsList className="bg-transparent h-auto p-0 gap-1">
              {[
                { val: "all", label: "All Members" },
                { val: "active", label: "Active" },
                { val: "pending", label: "Pending" },
                { val: "inactive", label: "Inactive" },
              ].map((t) => (
                <TabsTrigger 
                  key={t.val} 
                  value={t.val}
                  className={cn(
                    "rounded-xl h-10 px-6 font-bold text-sm transition-all border border-transparent",
                    filter === t.val 
                      ? "bg-primary text-white shadow-md shadow-primary/20" 
                      : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-none shadow-soft rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-col items-center gap-4 text-center">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 mx-auto" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-10">
          {filteredStaffList.length > 0 ? (
            filteredStaffList.map((staff) => (
              <StaffCard key={staff.id} staff={staff} onEdit={(s) => setEditingStaff(s)} />
            ))
          ) : (
            <div className="col-span-full py-32 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 shadow-soft flex flex-col items-center justify-center gap-4">
              <Users className="h-16 w-16 text-slate-100" />
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[#1A1A1A]">No Results Found</h3>
                <p className="text-slate-400">Try adjusting your filters or search terms.</p>
              </div>
              <Button variant="outline" onClick={() => {setFilter("all"); setSearchQuery("");}} className="rounded-xl px-6 mt-4">
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}

      <AddStaffDialog
        open={isAddStaffDialogOpen}
        onOpenChange={setIsAddStaffDialogOpen}
      />

      <EditStaffDialog
        staff={editingStaff}
        onUpdateStaff={() => setEditingStaff(null)}
        open={!!editingStaff}
        onOpenChange={(open) => !open && setEditingStaff(null)}
      />
    </div>
  )
}