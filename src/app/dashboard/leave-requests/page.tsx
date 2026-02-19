"use client"

import { useMemo } from "react"
import { collection, query, orderBy } from "firebase/firestore"
import { useFirestore, useCollection, useUser } from "@/firebase"
import type { LeaveRequest } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Check, X, Calendar, User, Clock, FileText } from "lucide-react"
import { updateLeaveRequestStatus } from "@/firebase/firestore/leave-requests"
import { logActivity } from "@/firebase/firestore/activity-logs"
import { cn } from "@/lib/utils"

export default function LeaveRequestsPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const leaveQuery = useMemo(() => query(
    collection(firestore, "leave_requests"),
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
        description: `Leave request for ${request.name} has been ${status}.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update the request status. Please try again.",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 border-none px-3">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-50 text-red-600 hover:bg-red-100 border-none px-3">Rejected</Badge>
      default:
        return <Badge className="bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 border-none px-3">Pending Review</Badge>
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Leave Approvals</h1>
        <p className="text-[#6B7280]">Review and manage employee time-off applications.</p>
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
            <Card key={req.id} className="border-none shadow-soft rounded-2xl hover:bg-slate-50/50 transition-all overflow-hidden border-l-4 border-l-transparent group">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-stretch h-full">
                  <div className="flex-1 p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-xl border border-primary/10">
                          {req.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-[#1A1A1A]">{req.name}</h3>
                          <p className="text-xs text-accent font-semibold uppercase tracking-wider">{req.type} Leave</p>
                        </div>
                      </div>
                      <div className="hidden md:block">
                        {getStatusBadge(req.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">Start Date</span>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
                          <Calendar className="h-4 w-4 text-slate-300" />
                          {req.start_date}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">End Date</span>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
                          <Calendar className="h-4 w-4 text-slate-300" />
                          {req.end_date}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">Reason</span>
                        <div className="flex items-center gap-2 text-sm text-[#6B7280] italic">
                          <FileText className="h-4 w-4 text-slate-300 shrink-0" />
                          <span className="truncate">{req.reason}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:w-56 bg-slate-50 border-l p-6 flex flex-col justify-center items-center gap-3">
                    {req.status === 'pending' ? (
                      <div className="flex flex-col w-full gap-2">
                        <Button 
                          className="w-full bg-[#22C55E] hover:bg-[#1ea34d] font-bold rounded-xl shadow-lg shadow-[#22C55E]/20"
                          onClick={() => handleStatusUpdate(req, 'approved')}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold rounded-xl"
                          onClick={() => handleStatusUpdate(req, 'rejected')}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Final Decision</p>
                        <div className="md:hidden mt-2">
                           {getStatusBadge(req.status)}
                        </div>
                        <div className="hidden md:block">
                           {getStatusBadge(req.status)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center bg-white rounded-3xl shadow-soft flex flex-col items-center justify-center gap-4">
            <div className="bg-slate-50 p-8 rounded-full">
              <Calendar className="h-12 w-12 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A]">No Leave Requests</h3>
            <p className="text-slate-400">There are currently no time-off requests to review.</p>
          </div>
        )}
      </div>
    </div>
  )
}