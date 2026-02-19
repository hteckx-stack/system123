"use client"

import { useMemo } from "react"
import { collection, query, orderBy } from "firebase/firestore"
import { useFirestore, useCollection, useUser } from "@/firebase"
import type { CheckIn } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Check, X, MapPin, Clock, ShieldCheck, UserCheck } from "lucide-react"
import { updateCheckInStatus } from "@/firebase/firestore/check-ins"
import { logActivity } from "@/firebase/firestore/activity-logs"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function CheckInsPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const checkInQuery = useMemo(() => query(
    collection(firestore, "check_ins"),
    orderBy("timestamp", "desc")
  ), [firestore])

  const { data: checkIns, loading } = useCollection<CheckIn>(checkInQuery)

  const handleStatusUpdate = async (checkIn: CheckIn, status: 'approved' | 'rejected') => {
    try {
      await updateCheckInStatus(firestore, checkIn.id, status)
      
      if (user) {
        await logActivity(
          firestore, 
          user.uid, 
          user.displayName || "Admin", 
          `Check-in ${status}`, 
          `${status.toUpperCase()} morning check-in for ${checkIn.staff_name}`
        )
      }

      toast({
        title: `Check-in ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        description: `Check-in for ${checkIn.staff_name} has been ${status}.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update the check-in status. Please try again.",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 border-none px-3 font-semibold">Verified</Badge>
      case 'rejected':
        return <Badge className="bg-red-50 text-red-600 hover:bg-red-100 border-none px-3 font-semibold">Rejected</Badge>
      default:
        return <Badge className="bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 border-none px-3 font-semibold">Pending Approval</Badge>
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Daily Arrival Logs</h1>
        <p className="text-[#6B7280]">Real-time monitoring and verification of staff check-ins.</p>
      </div>

      <Card className="border-none shadow-soft rounded-2xl overflow-hidden">
        <CardHeader className="bg-white border-b py-6 px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/5 p-2 rounded-xl border border-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Today's Check-ins</CardTitle>
                <CardDescription>Verify employee location and arrival time.</CardDescription>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-bold text-slate-600">{format(new Date(), "MMMM do, yyyy")}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="px-8 font-bold text-[#1A1A1A] h-14 uppercase text-[11px] tracking-widest">Employee</TableHead>
                <TableHead className="font-bold text-[#1A1A1A] h-14 uppercase text-[11px] tracking-widest">Time In</TableHead>
                <TableHead className="font-bold text-[#1A1A1A] h-14 uppercase text-[11px] tracking-widest">Location</TableHead>
                <TableHead className="font-bold text-[#1A1A1A] h-14 uppercase text-[11px] tracking-widest">Status</TableHead>
                <TableHead className="text-right px-8 font-bold text-[#1A1A1A] h-14 uppercase text-[11px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b last:border-0 h-20">
                    <TableCell className="px-8"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell className="text-right px-8 flex justify-end gap-2 items-center h-20">
                      <Skeleton className="h-9 w-9 rounded-xl" />
                      <Skeleton className="h-9 w-9 rounded-xl" />
                    </TableCell>
                  </TableRow>
                ))
              ) : checkIns && checkIns.length > 0 ? (
                checkIns.map((ci) => (
                  <TableRow key={ci.id} className="hover:bg-slate-50/50 transition-colors border-b last:border-0 group h-20">
                    <TableCell className="px-8">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 group-hover:bg-primary group-hover:text-white transition-all">
                          {ci.staff_name.charAt(0)}
                        </div>
                        <span className="font-bold text-[#1A1A1A]">{ci.staff_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {ci.timestamp ? format(ci.timestamp.toDate(), 'hh:mm a') : '---'}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="h-3.5 w-3.5 text-accent" />
                            <span className="font-medium">{ci.location || "Main Office"}</span>
                        </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(ci.status)}</TableCell>
                    <TableCell className="text-right px-8">
                      {ci.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-10 w-10 border-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E] hover:text-white rounded-xl shadow-sm transition-all"
                            onClick={() => handleStatusUpdate(ci, 'approved')}
                          >
                            <Check className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-10 w-10 border-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-xl shadow-sm transition-all"
                            onClick={() => handleStatusUpdate(ci, 'rejected')}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">Action Completed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-60 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-300">
                      <UserCheck className="h-12 w-12" />
                      <p className="text-lg font-bold text-slate-400">No activity logged for this period.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}