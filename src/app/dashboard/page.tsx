
"use client";

import { useMemo, useState, useEffect } from "react";
import { collection, query, doc, writeBatch, orderBy, limit, where, onSnapshot } from "firebase/firestore";
import { useCollection, useFirestore, useUser, useDatabase } from "@/firebase";
import { ref, onValue, update } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/firebase/firestore/activity-logs";
import { 
  Clock, 
  X,
  Users,
  ShieldCheck,
  AlertCircle,
  UserPlus,
  RefreshCw,
  MapPin,
  Search,
  CheckCircle2,
  Zap
} from "lucide-react";
import type { Staff, CheckIn } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const firestore = useFirestore();
  const database = useDatabase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedStaffToReject, setSelectedStaffToReject] = useState<Staff | null>(null);

  // Broad Scan Registry: Listen for EVERYONE in the system immediately
  const usersQuery = useMemo(() => query(
    collection(firestore, "users"),
    orderBy("name", "asc")
  ), [firestore]);
  const { data: allUsers, loading: staffLoading } = useCollection<Staff>(usersQuery);

  const [pendingCheckIns, setPendingCheckIns] = useState<CheckIn[]>([]);
  const [checkInsLoading, setCheckInsLoading] = useState(true);

  // Live GPS Arrival Monitor
  useEffect(() => {
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
      setCheckInsLoading(false);
    });
    return () => unsubscribe();
  }, [database]);

  // Aggressive Scan: Surfacing anyone needing admin authorization
  const pendingUsers = useMemo(() => 
    allUsers?.filter(s => s.status === 'pending' || s.approved !== true) || [], 
    [allUsers]
  );

  const stats = useMemo(() => ({
    total: allUsers?.length || 0,
    active: allUsers?.filter(s => s.status === 'active' && s.approved === true).length || 0,
    pending: pendingUsers.length,
    liveCheckins: pendingCheckIns.length
  }), [allUsers, pendingUsers, pendingCheckIns]);

  const handleApproveAccess = async (staff: Staff) => {
    if (!staff.id || !currentUser) return;
    try {
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, "users", staff.id), { approved: true, status: "active" });
      await batch.commit();
      await logActivity(firestore, currentUser.uid, currentUser.displayName || "Admin", "Access Approved", `Authorized access for ${staff.name}.`);
      toast({ title: "Access Authorized", description: `${staff.name} is now approved.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const handleRejectAccess = async () => {
    if (!selectedStaffToReject || !currentUser) return;
    try {
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, "users", selectedStaffToReject.id), { 
        status: "rejected", 
        approved: false,
        rejectionReason: rejectionReason 
      });
      await batch.commit();
      await logActivity(firestore, currentUser.uid, currentUser.displayName || "Admin", "Access Rejected", `Rejected access for ${selectedStaffToReject.name}. Reason: ${rejectionReason}`);
      toast({ variant: "destructive", title: "Registration Rejected", description: `${selectedStaffToReject.name}'s access denied.` });
      setSelectedStaffToReject(null);
      setRejectionReason("");
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const handleAuthorizeCheckIn = async (checkIn: CheckIn) => {
    try {
      const path = `checkins/${checkIn.staff_id}/${checkIn.dateStr}`;
      await update(ref(database, path), { status: 'approved' });
      await logActivity(firestore, currentUser?.uid || "system", currentUser?.displayName || "Admin", "Attendance Approved", `Approved check-in for ${checkIn.staff_name}.`);
      toast({ title: "Check-In Authorized", description: `${checkIn.staff_name} arrival verified.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Authorization Failed" });
    }
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-0 mb-1 px-1">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Command Center</h1>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
            Live Registry Scanner Active
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "System Registry", value: stats.total, icon: Users, color: "text-blue-500", label: "Total Users" },
          { title: "Pending Review", value: stats.pending, icon: UserPlus, color: "text-orange-500", label: "Awaiting Action" },
          { title: "Active Staff", value: stats.active, icon: ShieldCheck, color: "text-green-500", label: "Authorized" },
          { title: "Live GPS Hits", value: stats.liveCheckins, icon: Zap, color: "text-primary", label: "Real-time" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-soft rounded-2xl bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-5 pt-5">
              <CardTitle className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{stat.title}</CardTitle>
              <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="text-xl font-bold text-slate-900">{stat.value}</div>
              <p className="text-[8px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        <Card className="lg:col-span-8 border-none shadow-soft bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">Attendance Monitor</CardTitle>
                <CardDescription className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Real-time GPS arrivals</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="h-9 uppercase text-[8px] tracking-widest font-bold">
                  <TableHead className="px-6">User</TableHead>
                  <TableHead>Arrival Time</TableHead>
                  <TableHead>Verified Location</TableHead>
                  <TableHead className="text-right px-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkInsLoading ? (
                  <TableRow><TableCell colSpan={4} className="py-20 text-center text-[9px] font-bold uppercase text-slate-300 tracking-widest">Syncing Live Database...</TableCell></TableRow>
                ) : pendingCheckIns.length > 0 ? (
                  pendingCheckIns.map((ci) => (
                    <TableRow key={`${ci.staff_id}-${ci.dateStr}`} className="h-12 hover:bg-slate-50 transition-colors border-b last:border-0">
                      <TableCell className="px-6 font-bold text-slate-900 text-[11px]">{ci.staff_name}</TableCell>
                      <TableCell className="text-slate-600 text-[10px] font-bold">{ci.timestamp ? format(new Date(ci.timestamp), 'hh:mm a') : '---'}</TableCell>
                      <TableCell className="text-slate-500 text-[10px] font-bold">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" />
                          {ci.location || "Office Site"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Button size="sm" onClick={() => handleAuthorizeCheckIn(ci)} className="bg-green-500 hover:bg-green-600 font-bold rounded-xl h-7 text-[9px] uppercase tracking-wider px-3">Authorize</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="h-40 text-center text-slate-200 font-bold uppercase text-[9px] tracking-widest">No pending arrivals</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 border-none shadow-soft bg-white rounded-3xl overflow-hidden border-l-4 border-l-orange-400">
          <CardHeader className="bg-slate-50 border-b py-3 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Pending Signups</CardTitle>
              <Badge className="bg-orange-500 text-white font-bold text-[8px] h-4 min-w-[18px] justify-center">{pendingUsers.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {staffLoading ? (
                <div className="p-5 space-y-3">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ) : pendingUsers.length > 0 ? (
                pendingUsers.map(staff => (
                  <div key={staff.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-8 w-8 rounded-xl border-2 border-white shadow-sm shrink-0">
                        <AvatarFallback className="bg-primary text-white font-bold text-[9px]">{staff.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <p className="font-bold text-[11px] text-slate-900 truncate">{staff.name}</p>
                        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest truncate">{staff.nrc || "NO NRC"} | {staff.position}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button size="sm" className="bg-primary font-bold rounded-lg h-7 text-[8px] px-2.5 uppercase tracking-wider" onClick={() => handleApproveAccess(staff)}>Approve</Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 h-7 w-7 p-0" onClick={() => setSelectedStaffToReject(staff)}><X className="h-3 w-3" /></Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl border-none">
                          <DialogHeader>
                            <DialogTitle>Deny Registration</DialogTitle>
                            <DialogDescription>
                              Reason for denying access to {selectedStaffToReject?.name}.
                            </DialogDescription>
                          </DialogHeader>
                          <Textarea 
                            placeholder="e.g. Identity verification failed..." 
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="rounded-xl"
                          />
                          <DialogFooter>
                            <Button variant="ghost" onClick={() => setSelectedStaffToReject(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleRejectAccess}>Confirm Reject</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-slate-200 font-bold text-[8px] uppercase tracking-widest">No new signups found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3 flex items-start gap-2">
        <AlertCircle className="h-3 w-3 text-primary shrink-0 mt-0.5" />
        <p className="text-[8px] text-primary/80 font-bold uppercase tracking-widest leading-relaxed">
          System Guard: This dashboard is scanning for all registrations from connected employee systems. Authorization grants immediate access to app features.
        </p>
      </div>
    </div>
  )
}
