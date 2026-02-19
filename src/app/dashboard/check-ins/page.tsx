
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
import { Check, X, MapPin, Clock } from "lucide-react"
import { updateCheckInStatus } from "@/firebase/firestore/check-ins"
import { logActivity } from "@/firebase/firestore/activity-logs"
import { format } from "date-fns"

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
          <h1 className="text-3xl font-bold tracking-tight text-primary">Morning Check-ins</h1>
          <p className="text-muted-foreground">
            Monitor and approve staff arrivals in real-time.
          </p>
        </div>
      </div>

      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Arrival Log
          </CardTitle>
          <CardDescription>
            Live feed of today's check-ins.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Staff Name</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
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
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : checkIns && checkIns.length > 0 ? (
                checkIns.map((ci) => (
                  <TableRow key={ci.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{ci.staff_name}</TableCell>
                    <TableCell>
                        {ci.timestamp ? format(ci.timestamp.toDate(), 'hh:mm a') : '---'}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {ci.location || "Office"}
                        </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(ci.status)}</TableCell>
                    <TableCell className="text-right">
                      {ci.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleStatusUpdate(ci, 'approved')}
                          >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Approve</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleStatusUpdate(ci, 'rejected')}
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
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                    No check-ins found for today.
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
