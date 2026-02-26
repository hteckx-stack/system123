
"use client"

import { useState, useEffect } from "react"
import { useDatabase } from "@/firebase"
import { ref, onValue, update } from "firebase/database"
import type { CheckIn } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { ShieldCheck, Clock, MapPin, UserCheck, AlertCircle } from "lucide-react"
import { format } from "date-fns"

export default function CheckInsPage() {
  const database = useDatabase()
  const { toast } = useToast()
  const [pendingCheckIns, setPendingCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Attendance Monitor: Listen to path /checkins/{uid}/{date}
    const checkinsRef = ref(database, 'checkins');
    
    const unsubscribe = onValue(checkinsRef, (snapshot) => {
      const data = snapshot.val();
      const pending: CheckIn[] = [];
      
      if (data) {
        Object.entries(data).forEach(([uid, dates]: [string, any]) => {
          Object.entries(dates).forEach(([dateStr, details]: [string, any]) => {
            if (details.status === 'pending') {
              pending.push({
                id: uid,
                staff_id: uid,
                staff_name: details.staff_name || "Unknown Staff",
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
      // Update status to 'approved' to unlock 'Check Out' in Staff App
      await update(ref(database, path), { status: 'approved' });
      
      toast({
        title: "Check-In Authorized",
        description: `${checkIn.staff_name} can now perform operations.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Authorization Failed",
        description: "Check your connection to Realtime Database."
      });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Attendance Monitor</h1>
        <p className="text-[#6B7280]">Authorize real-time arrivals to enable staff app functionality.</p>
      </div>

      <Card className="border-none shadow-soft rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-[#0D47A1] text-white py-6 px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6" />
              <div>
                <CardTitle className="text-xl">Awaiting Authorization</CardTitle>
                <CardDescription className="text-white/70">Source of Truth: Realtime Database /checkins</CardDescription>
              </div>
            </div>
            {pendingCheckIns.length > 0 && (
               <Badge className="bg-white text-[#0D47A1] font-bold border-none h-6 px-3">
                  {pendingCheckIns.length} Pending
               </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="h-14 uppercase text-[10px] tracking-widest font-bold">
                <TableHead className="px-8 text-[#0D47A1]">Staff Member</TableHead>
                <TableHead>Arrival Timestamp</TableHead>
                <TableHead>GPS Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right px-8">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-20 text-slate-400">
                      <div className="animate-spin h-5 w-5 border-2 border-[#0D47A1] border-t-transparent rounded-full mx-auto mb-2" />
                      Syncing Realtime Database...
                   </TableCell>
                 </TableRow>
              ) : pendingCheckIns.length > 0 ? (
                pendingCheckIns.map((ci) => (
                  <TableRow key={`${ci.staff_id}-${ci.dateStr}`} className="h-20 group border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <TableCell className="px-8">
                      <div className="font-bold text-[#1A1A1A]">{ci.staff_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{ci.staff_id.substring(0,10)}...</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <Clock className="h-4 w-4 text-[#F59E0B]" />
                        {ci.timestamp ? format(new Date(ci.timestamp), 'hh:mm:ss a') : '---'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="h-4 w-4 text-[#1976D2]" />
                        <span className="text-sm">{ci.location || "Office Location"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-orange-50 text-orange-600 border-none font-bold text-[10px] tracking-wide px-3 h-6">
                        AWAITING ADMIN
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <Button 
                        onClick={() => handleAuthorize(ci)}
                        className="bg-[#22C55E] hover:bg-[#1ea34d] font-bold rounded-xl h-10 shadow-lg shadow-[#22C55E]/20 gap-2"
                      >
                        <UserCheck className="h-4 w-4" />
                        Authorize
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-80 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300 py-10">
                      <div className="bg-slate-50 p-6 rounded-full">
                        <ShieldCheck className="h-12 w-12 text-slate-200" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-bold text-slate-400">All Arrivals Authorized</p>
                        <p className="text-sm">No pending check-ins detected in the Realtime Database.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-[#0D47A1] shrink-0 mt-0.5" />
        <p className="text-sm text-[#0D47A1]/80 leading-relaxed">
          <strong>Pro-tip:</strong> Authorizing a check-in allows staff members to see the "Check Out" button in their mobile app instantly. This page listens to <code>/checkins</code> in your Realtime Database.
        </p>
      </div>
    </div>
  )
}
