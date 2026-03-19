"use client";

import { useMemo, useState, useEffect } from "react";
import { collection, query, where, doc, writeBatch, orderBy, limit } from "firebase/firestore";
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
  Smartphone, 
  X,
  UserCheck,
  Users,
  MapPin,
  ShieldCheck,
  MessageSquare,
  ClipboardList,
  AlertCircle,
  ChevronRight,
  UserPlus
} from "lucide-react";
import Link from 'next/link';
import type { Staff, LoginRequest, Announcement, CheckIn } from "@/lib/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow, format } from "date-fns";

export default function Dashboard() {
  const firestore = useFirestore();
  const database = useDatabase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  // Data Fetching: All users (to find pending ones)
  const usersQuery = useMemo(() => query(
    collection(firestore, "users")
  ), [firestore]);
  const { data: allUsers, loading: staffLoading } = useCollection<Staff>(usersQuery);

  // Data Fetching: Login Requests
  const loginRequestsQuery = useMemo(() => collection(firestore, "login_requests"), [firestore]);
  const { data: loginRequests, loading: loginsLoading } = useCollection<LoginRequest>(loginRequestsQuery);

  // Data Fetching: Announcements
  const announcementsQuery = useMemo(() => query(
    collection(firestore, "announcements"),
    orderBy("sentAt", "desc"),
    limit(5)
  ), [firestore]);
  const { data: announcements, loading: announcementsLoading } = useCollection<Announcement>(announcementsQuery);

  // RTDB Listener: Pending Check-ins
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

  const stats = useMemo(() => ({
    total: allUsers?.length || 0,
    active: allUsers?.filter(s => s.status === 'active').length || 0,
    pending: allUsers?.filter(s => s.status === 'pending').length || 0,
    liveCheckins: pendingCheckIns.length
  }), [allUsers, pendingCheckIns]);

  const handleApproveAccess = async (staff: Staff, loginReqId?: string) => {
    if (!staff.id || !currentUser) return;
    try {
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, "users", staff.id), { approved: true, status: "active" });
      if (loginReqId) batch.delete(doc(firestore, "login_requests", loginReqId));
      await batch.commit();
      await logActivity(firestore, currentUser.uid, currentUser.displayName || "Admin", "Access Approved", `Authorized ${staff.role} access for ${staff.name}.`);
      toast({ title: "Access Authorized", description: `${staff.name} is now approved.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const handleAuthorizeCheckIn = async (checkIn: CheckIn) => {
    try {
      const path = `checkins/${checkIn.staff_id}/${checkIn.dateStr}`;
      await update(ref(database, path), { status: 'approved' });
      toast({ title: "Check-In Authorized", description: `${checkIn.staff_name} is now active.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Authorization Failed" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">System Command Center</h1>
        <p className="text-[#6B7280]">Real-time synchronization and security oversight for the Staff Ecosystem.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Registry", value: stats.total, icon: Users, color: "text-blue-500", label: "Profiles recorded" },
          { title: "Active Personnel", value: stats.active, icon: ShieldCheck, color: "text-green-500", label: "Authorized users" },
          { title: "Pending Review", value: stats.pending, icon: UserPlus, color: "text-orange-500", label: "Awaiting registration approval" },
          { title: "Live Arrivals", value: stats.liveCheckins, icon: Clock, color: "text-primary", label: "Awaiting GPS authorization" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-soft rounded-2xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Feature: Attendance Monitor */}
      <Card className="border-none shadow-soft bg-white rounded-3xl overflow-hidden border-t-4 border-t-primary">
        <CardHeader className="bg-slate-50 border-b py-6 px-8 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-xl font-bold">Real-time Attendance Monitor</CardTitle>
              <CardDescription>Authorize GPS-verified arrivals to enable staff app functionality.</CardDescription>
            </div>
          </div>
          {pendingCheckIns.length > 0 && (
            <Badge className="bg-primary text-white font-bold px-3 h-6">
              {pendingCheckIns.length} PENDING
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="h-12 uppercase text-[10px] tracking-widest font-bold">
                <TableHead className="px-8">Staff Member</TableHead>
                <TableHead>Arrival Time</TableHead>
                <TableHead>Location Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right px-8">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkInsLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Syncing logs...</span>
                  </TableCell>
                </TableRow>
              ) : pendingCheckIns.length > 0 ? (
                pendingCheckIns.map((ci) => (
                  <TableRow key={`${ci.staff_id}-${ci.dateStr}`} className="h-20 hover:bg-slate-50/80 transition-colors border-b last:border-0">
                    <TableCell className="px-8 font-bold text-slate-900">
                      {ci.staff_name}
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {ci.staff_id.substring(0,8)}...</div>
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-400" />
                        {ci.timestamp ? format(new Date(ci.timestamp), 'hh:mm:ss a') : '---'}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{ci.location || "Office Site"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-orange-50 text-orange-600 border-none font-bold text-[10px] tracking-wide px-3">
                        AWAITING AUTH
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <Button 
                        size="sm"
                        onClick={() => handleAuthorizeCheckIn(ci)}
                        className="bg-green-500 hover:bg-green-600 font-bold rounded-xl h-9 shadow-lg shadow-green-500/10 gap-2"
                      >
                        <UserCheck className="h-4 w-4" />
                        Authorize
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-60 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <div className="p-6 bg-slate-50 rounded-full">
                        <ShieldCheck className="h-10 w-10 opacity-10" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-slate-400">All Arrivals Authorized</p>
                        <p className="text-xs">No pending check-ins detected in the Realtime Database.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bottom Grid: Reg Requests, Broadcasts, Shortcuts */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Registration Approvals (Admins & Staff) */}
        <Card className="border-none shadow-soft bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-5">
            <CardTitle className="text-base font-bold text-[#0D47A1]">Pending Registrations</CardTitle>
            <Badge variant="outline" className="text-[9px] font-bold tracking-widest">{allUsers?.filter(s => s.status === 'pending').length || 0} PENDING</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {loginsLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : allUsers?.filter(s => s.status === 'pending').length ? (
                allUsers.filter(s => s.status === 'pending').slice(0, 3).map(staff => {
                  const matchingReq = loginRequests?.find(r => r.staffId === staff.id);
                  return (
                    <div key={staff.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-all">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 rounded-xl border">
                          <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
                            {staff.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm text-slate-900">{staff.name}</p>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                            <Smartphone className="h-2.5 w-2.5" />
                            {staff.role.toUpperCase()} • {matchingReq ? matchingReq.deviceModel : "Web Portal"}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" className="bg-primary font-bold rounded-lg h-8 text-[11px]" onClick={() => handleApproveAccess(staff, matchingReq?.id)}>
                        Approve
                      </Button>
                    </div>
                  )
                })
              ) : (
                <div className="py-16 text-center text-slate-300">
                  <Smartphone className="h-6 w-6 mx-auto opacity-10 mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No pending requests</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-slate-50/30 text-center">
              <Link href="/dashboard/staff">
                <Button variant="link" className="text-xs font-bold text-slate-400 uppercase tracking-widest h-auto p-0">View All Staff</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Latest Broadcasts */}
        <Card className="border-none shadow-soft bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-5">
            <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Latest Broadcasts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {announcementsLoading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : announcements && announcements.length > 0 ? (
              <div className="relative">
                <Carousel className="w-full">
                  <CarouselContent>
                    {announcements.map((ann) => (
                      <CarouselItem key={ann.id}>
                        <div className="flex flex-col gap-3 min-h-[140px] p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>Push Broadcast</span>
                            <span>{ann.sentAt && formatDistanceToNow(ann.sentAt.toDate(), { addSuffix: true })}</span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm">{ann.title}</h3>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{ann.message}</p>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="flex justify-end gap-2 mt-4">
                    <CarouselPrevious className="static translate-y-0 h-8 w-8 rounded-lg bg-white shadow-sm border-none" />
                    <CarouselNext className="static translate-y-0 h-8 w-8 rounded-lg bg-white shadow-sm border-none" />
                  </div>
                </Carousel>
              </div>
            ) : (
              <div className="py-14 text-center text-slate-300 italic text-xs">No active broadcasts found.</div>
            )}
          </CardContent>
        </Card>

        {/* Shortcuts */}
        <Card className="border-none shadow-soft bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-5">
            <CardTitle className="text-base font-bold text-primary">Admin Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-6 px-6">
             <Link href="/dashboard/staff?tab=tasks" className="block">
                <Button variant="outline" className="w-full justify-between h-14 rounded-xl border-slate-100 hover:bg-slate-50 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg"><ClipboardList className="h-4 w-4 text-blue-500" /></div>
                      <span className="font-bold text-slate-700 text-[11px] uppercase tracking-widest">Assign Duties</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                </Button>
             </Link>
             <Link href="/dashboard/chat" className="block">
                <Button variant="outline" className="w-full justify-between h-14 rounded-xl border-slate-100 hover:bg-slate-50 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg"><MessageSquare className="h-4 w-4 text-purple-500" /></div>
                      <span className="font-bold text-slate-700 text-[11px] uppercase tracking-widest">Chat Hub</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                </Button>
             </Link>
             <Link href="/dashboard/leave-requests" className="block">
                <Button variant="outline" className="w-full justify-between h-14 rounded-xl border-slate-100 hover:bg-slate-50 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg"><Clock className="h-4 w-4 text-green-500" /></div>
                      <span className="font-bold text-slate-700 text-[11px] uppercase tracking-widest">Leave Review</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                </Button>
             </Link>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-[#0D47A1] shrink-0 mt-0.5" />
        <p className="text-sm text-[#0D47A1]/80 leading-relaxed">
          <strong>Security Protocol:</strong> Authorizing an arrival or registration enables the staff member's profile and mobile app console. This portal is the primary Source of Truth for authentication.
        </p>
      </div>
    </div>
  )
}