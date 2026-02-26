"use client"

import { useState, useMemo } from "react"
import { useFirestore, useCollection, useUser } from "@/firebase"
import { collection, addDoc, serverTimestamp, query, orderBy, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { CalendarDays, ClipboardList, User, CheckCircle2 } from "lucide-react"
import type { Staff, Task } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function TasksPage() {
  const firestore = useFirestore()
  const { user: currentUser } = useUser()
  const { toast } = useToast()
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedStaffId, setSelectedStaffId] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Fetch only active staff members for task assignment
  const staffQuery = useMemo(() => query(
    collection(firestore, "users"), 
    where("status", "==", "active"), 
    where("role", "==", "staff")
  ), [firestore]);
  const { data: staffList } = useCollection<Staff>(staffQuery);

  const tasksQuery = useMemo(() => query(
    collection(firestore, "tasks"), 
    orderBy("createdAt", "desc")
  ), [firestore]);
  const { data: tasks, loading } = useCollection<Task>(tasksQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !selectedStaffId || !currentUser) return

    setIsSaving(true)
    try {
      const staffMember = staffList?.find(s => s.id === selectedStaffId);
      
      // Prompt 4: Add new document to 'tasks' collection
      await addDoc(collection(firestore, "tasks"), {
        title,
        description,
        staff_id: selectedStaffId,
        staff_name: staffMember?.name || "Unknown",
        status: "pending",
        createdAt: serverTimestamp()
      });

      toast({
        title: "Task Assigned",
        description: `Duty "${title}" has been synced to ${staffMember?.name}'s device.`,
      });
      setTitle("");
      setDescription("");
      setSelectedStaffId("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Assignment Failed",
        description: "Verify your Firestore permissions."
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Duty Creator</h1>
        <p className="text-[#6B7280]">Assign real-time tasks to staff members.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <Card className="lg:col-span-5 border-none shadow-soft rounded-3xl bg-white overflow-hidden">
          <CardHeader className="bg-[#0D47A1] text-white py-6">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6" />
              <CardTitle className="text-xl">Assign New Task</CardTitle>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 pt-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Task Title</Label>
                <Input placeholder="e.g. Conduct Daily Perimeter Check" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl h-11" required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assign To Staff</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId} required>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Choose a team member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList?.map(staff => (
                      <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Task Instructions</Label>
                <Textarea placeholder="Details will reflect in the staff task view..." value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[140px] rounded-xl" />
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button type="submit" disabled={isSaving} className="w-full bg-[#0D47A1] rounded-xl font-bold h-12 shadow-lg shadow-[#0D47A1]/20">
                {isSaving ? "Syncing..." : "Publish Task"}
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
            {loading ? (
              <>
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
              </>
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
                      <User className="h-3.5 w-3.5 text-slate-300" />
                      <span className="text-[11px] font-bold text-[#0D47A1]">{task.staff_name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-slate-300">
                <ClipboardList className="h-10 w-10 mx-auto opacity-20 mb-2" />
                <p>No active tasks assigned.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}