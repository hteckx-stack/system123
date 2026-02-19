
"use client"

import { useMemo } from "react"
import { collection, query, orderBy } from "firebase/firestore"
import { useFirestore, useCollection, useUser } from "@/firebase"
import type { LeaveRequest } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Check, X, Calendar } from "lucide-react"
import { updateLeaveRequestStatus } from "@/firebase/firestore/leave-requests"
import { logActivity } from "@/firebase/firestore/activity-logs"

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
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Leave Requests</h1>
          <p className="text-muted-foreground">
            Manage and review staff leave applications in real time.
          </p>
        </div>
      </div>

      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Active Requests
          </CardTitle>
          <CardDescription>
            Real-time feed of all submitted leave requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Staff Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : requests && requests.length > 0 ? (
                requests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{req.name}</TableCell>
                    <TableCell>{req.type}</TableCell>
                    <TableCell>{req.start_date}</TableCell>
                    <TableCell>{req.end_date}</TableCell>
                    <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-right">
                      {req.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleStatusUpdate(req, 'approved')}
                          >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Approve</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleStatusUpdate(req, 'rejected')}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Reject</span>
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                    No leave requests found.
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
