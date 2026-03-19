
"use client"

import { useState, useMemo } from "react"
import { EditStaffDialog } from "./components/edit-staff-dialog"
import { AddStaffDialog } from "./components/add-staff-dialog"
import type { Staff, Task } from "@/lib/types"
import { StaffCard } from "./components/staff-card"
import { useCollection, useFirestore, useUser } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, orderBy } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { UserPlus, Search, Users, ClipboardList, CalendarDays, CheckCircle2, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function StaffPage() {
  const firestore = useFirestore()
  const { user: currentUser } = useUser()
  const { toast } = useToast()
  
  // Data Fetching: Staff
  const staffQuery = useMemo(() => query(
    collection(firestore, "users"), 
    where("role", "==", "staff")
  ), [firestore])
  const { data: staffList, loading: staffLoading } = useCollection<Staff>(staffQuery)

  // Data Fetching: Tasks
  const tasksQuery = useMemo(() => query(
    collection(firestore, "tasks"), 
    orderBy("createdAt", "desc")
  ), [firestore])
  const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksQuery)

  // State
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false)
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Task Assignment Form State
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [selectedStaffId, setSelectedStaffId] = useState("")
  const [isSavingTask, setIsSavingTask] = useState(false)

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

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle || !selectedStaffId || !currentUser) return

    setIsSavingTask(true)
    try {
      const staffMember = staffList?.find(s => s.id === selectedStaffId);
      
      await addDoc(collection(firestore, "tasks"), {
        title: taskTitle,
        description: taskDescription,
        staff_id: selectedStaffId,
        staff_name: staffMember?.name || "Unknown",
        status: "pending",
        createdAt: serverTimestamp()
      });

      toast({
        title: "Task Assigned",
        description: `Duty "${taskTitle}" has been synced to ${staffMember?.name}'s device.`,
      });
      setTaskTitle("");
      setTaskDescription("");
      setSelectedStaffId("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Assignment Failed",
        description: "Verify your Firestore permissions."
      });
    } finally {
      setIsSavingTask(false);
    }
  }

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Staff Management</h1>
        <p className="text-[#6B7280]">Manage personnel profiles and assign real-time duties.</p>
      </div>

      <Tabs defaultValue="directory" className="w-full">
        <TabsList className="bg-white p-1 rounded-xl shadow-soft border border-slate-100 mb-8 inline-flex">
          <TabsTrigger value="directory" className="rounded-lg font-bold px-8 py-2.5">Staff Directory</TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-lg font-bold px-8 py-2.5">Task Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-8 m-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row gap-4 items-center flex-1">
              <div className="w-full md:max-w-md relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input 
                  placeholder="Search staff members..." 
                  className="pl-12 h-12 rounded-xl border-none bg-white shadow-soft font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px] h-12 rounded-xl border-none bg-white shadow-soft font-bold">
                  <SelectValue placeholder="All Members" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Members</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setIsAddStaffDialogOpen(true)} className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20 gap-2">
              <UserPlus className="h-5 w-5" />
              Add Member
            </Button>
          </div>

          {staffLoading ? (
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        </TabsContent>

        <TabsContent value="tasks" className="m-0">
          <div className="grid gap-8 lg:grid-cols-12">
            <Card className="lg:col-span-5 border-none shadow-soft rounded-3xl bg-white overflow-hidden">
              <CardHeader className="bg-[#0D47A1] text-white py-6 px-8">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-6 w-6" />
                  <CardTitle className="text-xl">Assign New Task</CardTitle>
                </div>
              </CardHeader>
              <form onSubmit={handleTaskSubmit}>
                <CardContent className="space-y-5 pt-8 px-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Task Title</Label>
                    <Input placeholder="e.g. Conduct Daily Perimeter Check" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="rounded-xl h-12 bg-slate-50 border-none font-semibold" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assign To Staff</Label>
                    <Select value={selectedStaffId} onValueChange={setSelectedStaffId} required>
                      <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-semibold">
                        <SelectValue placeholder="Choose a team member..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {staffList?.filter(s => s.status === 'active').map(staff => (
                          <SelectItem key={staff.id} value={staff.id} className="rounded-lg">{staff.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Task Instructions</Label>
                    <Textarea placeholder="Details will reflect in the staff task view..." value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} className="min-h-[140px] rounded-2xl bg-slate-50 border-none p-4" />
                  </div>
                </CardContent>
                <CardFooter className="p-8 pt-4">
                  <Button type="submit" disabled={isSavingTask} className="w-full bg-[#0D47A1] rounded-xl font-bold h-12 shadow-lg shadow-[#0D47A1]/20 text-lg">
                    {isSavingTask ? "Syncing..." : "Publish Task"}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-slate-400" />
                Duty Logs
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {tasksLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                  ))
                ) : tasks && tasks.length > 0 ? (
                  tasks.map(task => (
                    <Card key={task.id} className="border-none shadow-soft rounded-2xl bg-white group hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-[#0D47A1]">
                      <CardHeader className="p-5 pb-2">
                        <div className="flex justify-between items-start mb-2">
                            <Badge className={cn("text-[10px] uppercase font-bold px-2 py-0 border-none", task.status === 'completed' ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600")}>
                              {task.status}
                            </Badge>
                            {task.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        </div>
                        <CardTitle className="text-base font-bold text-[#1A1A1A] line-clamp-1">{task.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 pt-0 pb-4">
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8">{task.description}</p>
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                          <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-primary">
                            {task.staff_name.charAt(0)}
                          </div>
                          <span className="text-[11px] font-bold text-[#0D47A1]">{task.staff_name}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center text-slate-300">
                    <ClipboardList className="h-10 w-10 mx-auto opacity-20 mb-2" />
                    <p className="text-sm font-bold uppercase tracking-widest">No active tasks assigned.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
