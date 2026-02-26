
"use client"

import { useState, useEffect } from "react"
import { useDatabase, useUser } from "@/firebase"
import { ref, onValue, update } from "firebase/database"
import type { CheckIn } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Check, Clock, ShieldCheck, MapPin, UserCheck } from "lucide-react"
import { format } from "date-fns"

export default function CheckInsPage() {
  const database = useDatabase()
  const { user } = useUser()
  const { toast } = useToast()
  const [pendingCheckIns, setPendingCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkinsRef = ref(database, 'checkins');
    
    // Listening to the whole tree to find pending check-ins
    const unsubscribe = onValue(checkinsRef, (snapshot) => {
      const data = snapshot.val();
      const pending: CheckIn[] = [];
      
      if (data) {
        // Path structure: /checkins/{uid}/{dateStr}
        Object.entries(data).forEach(([uid, dates]: [string, any]) => {
          Object.entries(dates).forEach(([dateStr, details]: [string, any]) => {
            if (details.status === 'pending') {
              pending.push({
                id: uid, // using uid as identifier for the approval path
                staff_id: uid,
                staff_name: details.staff_name || "Unknown",
                timestamp: details.timestamp,
                status: details.status,
                location: details.location,
                dateStr: dateStr
              });
            }
          });
        });
      }
      setPendingCheckIns(pending);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [database]);

  const handleAuthorize = async (checkIn: CheckIn) => {
    try {
      const path = `checkins/${checkIn.staff_id}/${checkIn.dateStr}`;
      await update(ref(database, path), { status: 'approved' });
      
      toast({
        title: "Attendance Authorized",
        description: `${checkIn.staff_name} can now check out in their app.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Authorization Failed",
      });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Real-time Attendance Monitor</h1>
        <p className="text-[#6B7280]">Authorize morning check-ins to enable staff operations.</p>
      </div>

      <Card className="border-none shadow-soft rounded-2xl overflow-hidden">
        <CardHeader className="bg-white border-b py-6 px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/5 p-2 rounded-xl">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Awaiting Authorization</CardTitle>
                <CardDescription>Live feed from Realtime Database.</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="h-14 uppercase text-[11px] tracking-widest font-bold">
                <TableHead className="px-8">Employee</TableHead>
                <TableHead>Arrival Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right px-8">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow><TableCell colSpan={5} className="text-center py-10">Syncing database...</TableCell></TableRow>
              ) : pendingCheckIns.length > 0 ? (
                pendingCheckIns.map((ci) => (
                  <TableRow key={`${ci.staff_id}-${ci.dateStr}`} className="h-20 group border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-8 font-bold text-[#1A1A1A]">{ci.staff_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <Clock className="h-4 w-4 text-slate-300" />
                        {ci.timestamp ? format(new Date(ci.timestamp), 'hh:mm a') : '---'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-accent" />
                        {ci.location || "Office"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-orange-50 text-orange-600 border-none font-bold">Pending Approval</Badge>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <Button 
                        onClick={() => handleAuthorize(ci)}
                        className="bg-[#22C55E] hover:bg-[#1ea34d] font-bold rounded-xl shadow-lg shadow-[#22C55E]/20"
                      >
                        Authorize
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-60 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <UserCheck className="h-12 w-12" />
                      <p className="text-lg font-bold text-slate-400">All arrivals have been authorized.</p>
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
