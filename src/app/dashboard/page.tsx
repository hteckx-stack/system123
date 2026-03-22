
"use client";

import { useMemo, useState, useEffect } from "react";
import { collection, query, doc, writeBatch, orderBy, limit } from "firebase/firestore";
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
  Megaphone, 
  Clock, 
  X,
  UserCheck,
  Users,
  ShieldCheck,
  AlertCircle,
  UserPlus,
  RefreshCw,
  FileText,
  MapPin,
  ChevronRight
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

export default function Dashboard() {
  const firestore = useFirestore();
  const database = useDatabase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedStaffToReject, setSelectedStaffToReject] = useState<Staff | null>(null);

  // Fetch ALL profiles to capture external signups instantly
  const usersQuery = useMemo(() => query(
    collection(firestore, "users")
  ), [firestore]);
  const { data: allUsers, loading: staffLoading } = useCollection<Staff>(usersQuery);

  const [pendingCheckIns, setPendingCheckIns] = useState<CheckIn[]>([]);
  const [checkInsLoading, setCheckInsLoading] = useState(true);

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

  const pendingUsers = useMemo(() => 
    allUsers?.filter(s => s.status === 'pending' || s.approved === false) || [], 
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

  const handleRejectCheckIn = async (checkIn: CheckIn) => {
    try {
      const path = `checkins/${checkIn.staff_id}/${checkIn.dateStr}`;
      await update(ref(database, path), { status: 'rejected' });
      await logActivity(firestore, currentUser?.uid || "system", currentUser?.displayName || "Admin", "Attendance Rejected", `Rejected check-in for ${checkIn.staff_name}.`);
      toast({ variant: "destructive", title: "Check-In Rejected", description: `${checkIn.staff_name} arrival denied.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-0 mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Control Center</h1>
        <p className="text-[#6B7280] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
          <RefreshCw className="h-3 w-3 animate-spin-slow" /> Real-time System Guard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Employees", value: stats.total, icon: Users, color: "text-blue-500", label: "Registry count" },
          { title: "Pending Review", value: stats.pending, icon: UserPlus, color: "text-orange-500", label: "Awaiting approval" },
          { title: "Active Staff", value: stats.active, icon: ShieldCheck, color: "text-green-500", label: "Authorized users" },
          { title: "Arrivals", value: stats.liveCheckins, icon: Clock, color: "text-primary", label: "Live GPS logs" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-soft rounded-2xl bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <p className="text-[9px] text-slate-500 mt-1 font-bold uppercase tracking-wider">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8 border-none shadow-soft bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-4 px-8 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Attendance Monitor</CardTitle>
                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time GPS Authorizations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="h-10 uppercase text-[9px] tracking-widest font-bold">
                  <TableHead className="px-8">Staff Member</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right px-8">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkInsLoading ? (
                  <TableRow><TableCell colSpan={4} className="py-20 text-center text-[10px] font-bold uppercase text-slate-300 tracking-widest">Syncing logs...</TableCell></TableRow>
                ) : pendingCheckIns.length > 0 ? (
                  pendingCheckIns.map((ci) => (
                    <TableRow key={`${ci.staff_id}-${ci.dateStr}`} className="h-14 hover:bg-slate-50 transition-colors border-b last:border-0">
                      <TableCell className="px-8 font-bold text-slate-900 text-xs">{ci.staff_name}</TableCell>
                      <TableCell className="text-slate-600 text-[11px] font-bold">{ci.timestamp ? format(new Date(ci.timestamp), 'hh:mm a') : '---'}</TableCell>
                      <TableCell className="text-slate-500 text-[11px] font-bold">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" />
                          {ci.location || "Office Site"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => handleAuthorizeCheckIn(ci)} className="bg-green-500 hover:bg-green-600 font-bold rounded-xl h-8 text-[10px] uppercase tracking-wider">Approve</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleRejectCheckIn(ci)} className="text-red-500 hover:text-red-600 h-8 w-8 p-0"><X className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="h-60 text-center text-slate-200 font-bold uppercase text-[10px] tracking-widest">All arrivals authorized</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 border-none shadow-soft bg-white rounded-3xl overflow-hidden border-l-4 border-l-orange-400">
          <CardHeader className="bg-slate-50 border-b py-4 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">Pending Signups</CardTitle>
              <Badge className="bg-orange-500 text-white font-bold text-[9px] h-5 min-w-[20px] justify-center">{pendingUsers.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {staffLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : pendingUsers.length > 0 ? (
                pendingUsers.map(staff => (
                  <div key={staff.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 rounded-xl border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-primary text-white font-bold text-[10px]">{staff.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-xs text-slate-900">{staff.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{staff.nrc || "No NRC"}</p>
                        <p className="text-[8px] text-slate-400 font-medium">{staff.position}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" className="bg-primary font-bold rounded-lg h-8 text-[9px] px-3 uppercase tracking-wider" onClick={() => handleApproveAccess(staff)}>Approve</Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 h-8 w-8 p-0" onClick={() => setSelectedStaffToReject(staff)}><X className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl border-none">
                          <DialogHeader>
                            <DialogTitle>Reject Registration</DialogTitle>
                            <DialogDescription>
                              Provide a reason for denying access to {selectedStaffToReject?.name}.
                            </DialogDescription>
                          </DialogHeader>
                          <Textarea 
                            placeholder="e.g. Documentation incomplete..." 
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="rounded-xl"
                          />
                          <DialogFooter>
                            <Button variant="ghost" onClick={() => setSelectedStaffToReject(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleRejectAccess}>Confirm Rejection</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 text-center text-slate-200 font-bold text-[9px] uppercase tracking-widest">No pending signups</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-[#0D47A1] shrink-0 mt-0.5" />
        <p className="text-[10px] text-[#0D47A1]/80 font-bold uppercase tracking-widest leading-relaxed">
          System Guard: This portal automatically captures signups from all external employee systems for your verification. All changes reflect in real-time.
        </p>
      </div>
    </div>
  )
}
