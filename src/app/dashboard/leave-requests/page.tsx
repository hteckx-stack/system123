
"use client"

import { useMemo } from "react"
import { collection, query, orderBy, where } from "firebase/firestore"
import { useFirestore, useCollection, useUser } from "@/firebase"
import type { LeaveRequest } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Check, X, Calendar, FileText, User } from "lucide-react"
import { updateLeaveRequestStatus } from "@/firebase/firestore/leave-requests"
import { logActivity } from "@/firebase/firestore/activity-logs"
import { cn } from "@/lib/utils"

export default function LeaveRequestsPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  // Leave Management: Filter for requests with status == 'pending'
  const leaveQuery = useMemo(() => query(
    collection(firestore, "leave_requests"),
    where("status", "==", "pending"),
    orderBy("created_at", "desc")
  ), [firestore])

  const { data: requests, loading } = useCollection<LeaveRequest>(leaveQuery)

  const handleStatusUpdate = async (request: LeaveRequest, status: 'approved' | 'rejected') => {
    try {
      await updateLeaveRequestStatus(firestore, request.id, status)
      
      if (user) {
        await logActivity(
          firestore, 
          user.uid, 
          user.displayName || "Admin", 
          `Leave ${status}`, 
          `${status.toUpperCase()} leave request for ${request.name}`
        )
      }

      toast({
        title: `Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        description: `This update will reflect instantly in the Staff App.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: "Could not update the request status. Please try again.",
      })
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Leave Management</h1>
        <p className="text-[#6B7280]">Review and approve employee time-off requests in real-time.</p>
      </div>

      <div className="grid gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-none shadow-soft rounded-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-40 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : requests && requests.length > 0 ? (
          requests.map((req) => (
            <Card key={req.id} className="border-none shadow-soft rounded-2xl hover:bg-slate-50 transition-all overflow-hidden border-l-4 border-l-transparent hover:border-l-[#0D47A1] bg-white group">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-stretch">
                  <div className="flex-1 p-6 space-y-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-[#0D47A1] font-bold text-2xl border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                          {req.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-[#1A1A1A]">{req.name}</h3>
                          <Badge className="bg-blue-50 text-[#0D47A1] border-none font-bold text-[10px] tracking-widest px-2.5 py-0.5 h-6">
                             {req.type.toUpperCase()} LEAVE
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-2">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">Start Date</span>
                        <div className="flex items-center gap-2 text-sm font-bold text-[#1A1A1A]">
                          <Calendar className="h-4 w-4 text-[#F59E0B]" />
                          {req.start_date}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">End Date</span>
                        <div className="flex items-center gap-2 text-sm font-bold text-[#1A1A1A]">
                          <Calendar className="h-4 w-4 text-[#F59E0B]" />
                          {req.end_date}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">Request Reason</span>
                        <div className="flex items-center gap-2 text-sm text-[#6B7280] italic">
                          <FileText className="h-4 w-4 text-slate-300 shrink-0" />
                          <span className="truncate">{req.reason}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:w-64 bg-slate-50/80 border-l p-8 flex flex-col justify-center gap-3">
                    <Button 
                      className="w-full bg-[#22C55E] hover:bg-[#1ea34d] font-bold rounded-xl h-11 shadow-lg shadow-[#22C55E]/10"
                      onClick={() => handleStatusUpdate(req, 'approved')}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 font-bold rounded-xl h-11"
                      onClick={() => handleStatusUpdate(req, 'rejected')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-32 text-center bg-white rounded-3xl shadow-soft flex flex-col items-center justify-center gap-5">
            <div className="bg-slate-50 p-10 rounded-full">
              <User className="h-16 w-16 text-slate-200" />
            </div>
            <div className="space-y-1">
               <h3 className="text-2xl font-bold text-[#1A1A1A]">No Pending Requests</h3>
               <p className="text-slate-400">All leave applications have been reviewed and finalized.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
