
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
  CalendarDays, 
  Smartphone, 
  Check, 
  X,
  UserCheck,
  Users,
  MapPin,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  ClipboardList,
  AlertCircle,
  Table as TableIcon
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

  // Data Fetching: Users
  const staffQuery = useMemo(() => query(
    collection(firestore, "users"), 
    where("role", "==", "staff")
  ), [firestore]);
  const { data: staffList, loading: staffLoading } = useCollection<Staff>(staffQuery);

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
    total: staffList?.length || 0,
    active: staffList?.filter(s => s.status === 'active').length || 0,
    pending: staffList?.filter(s => s.approved !== true).length || 0,
    checkedIn: 0
  }), [staffList]);

  const handleApproveAccess = async (staff: Staff, loginReqId?: string) => {
    if (!staff.id || !currentUser) return;
    try {
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, "users", staff.id), { approved: true, status: "active" });
      if (loginReqId) batch.delete(doc(firestore, "login_requests", loginReqId));
      await batch.commit();
      await logActivity(firestore, currentUser.uid, currentUser.displayName || "Admin", "Staff Approved", `Authorized mobile access for ${staff.name}.`);
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-soft rounded-2xl bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Registry</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Recorded staff profiles</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft rounded-2xl bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Active Personnel</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.active}</div>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Authorized for mobile app</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft rounded-2xl bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Pending Requests</CardTitle>
            <Smartphone className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.pending}</div>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Awaiting administrator review</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft rounded-2xl bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Live Check-ins</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{pendingCheckIns.length}</div>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Awaiting location authorization</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
        <div className="lg:col-span-7 space-y-8">
          <Card className="border-none shadow-soft bg-white rounded-3xl overflow-hidden border-t-4 border-t-primary">
            <CardHeader className="bg-slate-50 border-b py-6 px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">Real-time Attendance Monitor</CardTitle>
                    <CardDescription>Authorize real-time arrivals to enable staff app functionality.</CardDescription>
                  </div>
                </div>
                {pendingCheckIns.length > 0 && (
                   <Badge className="bg-primary text-white font-bold border-none h-6 px-3">
                      {pendingCheckIns.length} Awaiting Review
                   </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="h-14 uppercase text-[10px] tracking-widest font-bold">
                    <TableHead className="px-8 text-primary">Staff Member</TableHead>
                    <TableHead>Arrival Time</TableHead>
                    <TableHead>GPS Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right px-8">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkInsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                        <span className="text-slate-400 text-xs font-medium">Syncing database...</span>
                      </TableCell>
                    </TableRow>
                  ) : pendingCheckIns.length > 0 ? (
                    pendingCheckIns.map((ci) => (
                      <TableRow key={`${ci.staff_id}-${ci.dateStr}`} className="h-20 hover:bg-slate-50 transition-colors border-b last:border-0">
                        <TableCell className="px-8">
                          <div className="font-bold text-slate-900">{ci.staff_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">UID: {ci.staff_id.substring(0,8)}...</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-slate-600 font-medium">
                            <Clock className="h-4 w-4 text-orange-400" />
                            {ci.timestamp ? format(new Date(ci.timestamp), 'hh:mm:ss a') : '---'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-slate-500">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="text-sm">{ci.location || "Office Site"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-orange-50 text-orange-600 border-none font-bold text-[10px] tracking-wide px-3 h-6">
                            PENDING AUTH
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <Button 
                            onClick={() => handleAuthorizeCheckIn(ci)}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl h-10 shadow-lg shadow-green-500/10 gap-2"
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
                        <div className="flex flex-col items-center gap-4 text-slate-300 py-10">
                          <ShieldCheck className="h-12 w-12 opacity-10" />
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
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-soft bg-white rounded-3xl overflow-hidden border-t-4 border-t-primary">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-xl text-[#0D47A1]">Mobile Registration Requests</CardTitle>
              <CardDescription>Authorize access for staff members who just registered.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {loginsLoading ? (
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                ) : staffList?.filter(s => s.approved !== true).length ? (
                  staffList.filter(s => s.approved !== true).slice(0, 5).map(staff => {
                    const matchingReq = loginRequests?.find(r => r.staffId === staff.id);
                    return (
                      <div key={staff.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 rounded-xl border">
                              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                                {staff.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-slate-900">{staff.name}</p>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <Smartphone className="h-3 w-3" />
                                    {matchingReq ? matchingReq.deviceModel : "Web Registration"}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" className="bg-primary font-bold rounded-lg h-8" onClick={() => handleApproveAccess(staff, matchingReq?.id)}>Approve</Button>
                            <Button size="sm" variant="ghost" className="text-red-500 h-8 w-8 p-0"><X className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-16 text-center text-slate-300">
                    <Smartphone className="h-8 w-8 mx-auto opacity-10 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">No pending registrations</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <Card className="border-none shadow-soft bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                Latest Broadcasts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {announcementsLoading ? (
                <Skeleton className="h-40 w-full rounded-xl" />
              ) : announcements && announcements.length > 0 ? (
                <Carousel className="w-full max-w-xs mx-auto">
                  <CarouselContent>
                    {announcements.map((ann) => (
                      <CarouselItem key={ann.id}>
                        <div className="p-1">
                          <div className="flex flex-col gap-3 min-h-[160px] p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                              <span>System Broadcast</span>
                              <span>{ann.sentAt && formatDistanceToNow(ann.sentAt.toDate(), { addSuffix: true })}</span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm">{ann.title}</h3>
                            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{ann.message}</p>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="flex justify-center gap-2 mt-4">
                    <CarouselPrevious className="static translate-y-0 h-8 w-8" />
                    <CarouselNext className="static translate-y-0 h-8 w-8" />
                  </div>
                </Carousel>
              ) : (
                <div className="py-10 text-center text-slate-300 italic text-sm">No recent announcements found.</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg text-primary">Admin Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-6">
               <Link href="/dashboard/staff?tab=tasks">
                  <Button variant="outline" className="w-full justify-start gap-3 h-14 rounded-xl border-slate-100 hover:bg-slate-50">
                      <ClipboardList className="h-5 w-5 text-blue-500" />
                      <span className="font-bold text-slate-700 text-xs uppercase tracking-widest">Assign Duties</span>
                  </Button>
               </Link>
               <Link href="/dashboard/chat">
                  <Button variant="outline" className="w-full justify-start gap-3 h-14 rounded-xl border-slate-100 hover:bg-slate-50">
                      <MessageSquare className="h-5 w-5 text-orange-500" />
                      <span className="font-bold text-slate-700 text-xs uppercase tracking-widest">Chat Hub</span>
                  </Button>
               </Link>
               <Link href="/dashboard/staff">
                  <Button variant="outline" className="w-full justify-start gap-3 h-14 rounded-xl border-slate-100 hover:bg-slate-50">
                      <Users className="h-5 w-5 text-green-500" />
                      <span className="font-bold text-slate-700 text-xs uppercase tracking-widest">Staff Directory</span>
                  </Button>
               </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-[#0D47A1] shrink-0 mt-0.5" />
        <p className="text-sm text-[#0D47A1]/80 leading-relaxed">
          <strong>Security Protocol:</strong> Authorizing an arrival enables the "Check Out" button and operations console in the Staff Mobile App instantly. This portal is the primary Source of Truth for authentication.
        </p>
      </div>
    </div>
  )
}
