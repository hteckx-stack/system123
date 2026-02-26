"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Users, UserPlus, Megaphone, Clock, CalendarDays, ArrowUpRight, History as LucideHistory } from "lucide-react"
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { useMemo } from "react";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import type { Staff, Announcement, CheckIn, LeaveRequest } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateUser, deleteUser } from "@/firebase/firestore/users";
import { logActivity } from "@/firebase/firestore/activity-logs";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const staffQuery = useMemo(() => query(collection(firestore, "users"), where("role", "==", "staff")), [firestore]);
  const { data: staffList, loading: staffLoading } = useCollection<Staff>(staffQuery);

  const pendingCheckInsQuery = useMemo(() => query(collection(firestore, "check_ins"), where("status", "==", "pending")), [firestore]);
  const { data: pendingCheckIns, loading: checkInsLoading } = useCollection<CheckIn>(pendingCheckInsQuery);

  const pendingLeavesQuery = useMemo(() => query(collection(firestore, "leave_requests"), where("status", "==", "pending")), [firestore]);
  const { data: pendingLeaves, loading: leavesLoading } = useCollection<LeaveRequest>(pendingLeavesQuery);

  const pendingStaffQuery = useMemo(() => query(
    collection(firestore, "users"), 
    where("status", "==", "pending")
  ), [firestore]);
  const { data: pendingUsers, loading: onboardingLoading } = useCollection<Staff>(pendingStaffQuery);
  
  const recentActivityQuery = useMemo(() => query(collection(firestore, "announcements"), orderBy("sentAt", "desc"), limit(5)), [firestore]);
  const { data: recentBroadcasts, loading: activityLoading } = useCollection<Announcement>(recentActivityQuery);

  const loading = staffLoading || checkInsLoading || leavesLoading || onboardingLoading || activityLoading;

  const handleApprove = async (staff: Staff) => {
    if (!staff.id || !currentUser) return;
    try {
        await updateUser(firestore, staff.id, { status: "active" });
        await logActivity(
            firestore,
            currentUser.uid,
            currentUser.displayName || "Admin",
            "User Approved",
            `Activated system access for ${staff.name} (${staff.email})`
        );
        toast({
          title: "Access Granted",
          description: `${staff.name} is now an active member of the system.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Action Failed",
            description: "Could not approve registration. Please try again.",
        })
    }
  };

  const handleDelete = async (staff: Staff) => {
    if (!staff.id || !currentUser) return;
    try {
        await deleteUser(firestore, staff.id);
        await logActivity(
            firestore,
            currentUser.uid,
            currentUser.displayName || "Admin",
            "User Rejected",
            `Denied registration for ${staff.name} (${staff.email})`
        );
        toast({
          variant: "destructive",
          title: "Registration Denied",
          description: `The account request for ${staff.name} has been removed.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Action Failed",
            description: "Could not process request. Please try again.",
        })
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Admin Command Center</h1>
        <p className="text-[#6B7280]">Welcome back. Here is your system overview and pending oversight tasks.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Users (Staff)", val: staffList?.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50", desc: "Registered accounts" },
          { title: "Arrivals Awaiting", val: pendingCheckIns?.length, icon: Clock, color: "text-orange-600", bg: "bg-orange-50", desc: "Today's logs" },
          { title: "Leave Approvals", val: pendingLeaves?.length, icon: CalendarDays, color: "text-green-600", bg: "bg-green-50", desc: "Pending review" },
          { title: "System Onboarding", val: pendingUsers?.length, icon: UserPlus, color: "text-purple-600", bg: "bg-purple-50", desc: "New registrations" },
        ].map((item, idx) => (
          <Card key={idx} className="border-none shadow-soft overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#6B7280]">{item.title}</CardTitle>
              <div className={cn("p-2 rounded-lg", item.bg)}>
                <item.icon className={cn("h-4 w-4", item.color)} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold text-[#1A1A1A]">{item.val ?? 0}</div>}
              <p className="text-xs text-[#6B7280] mt-1">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

       <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-soft bg-white">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
                <div>
                  <CardTitle className="text-xl">Pending User Approvals</CardTitle>
                  <CardDescription>Review all registration requests from the app here.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-white px-3 font-bold border-primary/20">{pendingUsers?.length || 0} Request(s)</Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                {onboardingLoading ? (
                    <div className="space-y-4">
                        {Array.from({length: 3}).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-9 w-20 rounded-lg" />
                                    <Skeleton className="h-9 w-20 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : pendingUsers && pendingUsers.length > 0 ? (
                    <div className="space-y-3">
                      {pendingUsers.map((staff) => (
                          <div key={staff.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-white hover:border-accent/20 transition-all shadow-sm group">
                              <div className="flex items-center gap-4">
                                  <Avatar className="h-11 w-11 border-2 border-slate-100 shadow-sm transition-transform group-hover:scale-105">
                                      <AvatarImage src={staff.photoUrl} alt={staff.name} />
                                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{staff.name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                      <p className="font-bold text-[#1A1A1A] truncate">{staff.name}</p>
                                      <p className="text-xs text-[#6B7280] truncate">{staff.email} • {staff.role}</p>
                                  </div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                  <Button 
                                    size="sm" 
                                    className="bg-[#22C55E] hover:bg-[#1ea34d] shadow-md shadow-[#22C55E]/20 font-bold px-4 rounded-xl" 
                                    onClick={() => handleApprove(staff)}
                                  >
                                    Accept
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold px-4 rounded-xl" 
                                    onClick={() => handleDelete(staff)}
                                  >
                                    Reject
                                  </Button>
                              </div>
                          </div>
                      ))}
                    </div>
                ) : (
                    <div className="py-20 text-center flex flex-col items-center justify-center gap-3 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                        <UserPlus className="h-10 w-10 text-slate-300" />
                        <p className="text-slate-400 font-medium">All registration requests have been processed.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-2">
                <Link href="/dashboard/staff" className="w-full">
                  <Button variant="ghost" className="w-full text-primary font-bold hover:bg-primary/5">View Complete Directory</Button>
                </Link>
            </CardFooter>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-soft bg-white">
          <CardHeader className="border-b pb-6">
            <CardTitle className="text-xl">System Broadcasts</CardTitle>
            <CardDescription>Recent announcements sent to the team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {activityLoading ? (
                Array.from({length: 4}).map((_, i) => (
                   <div className="flex items-center gap-4" key={i}>
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="grid gap-1 w-full">
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-3 w-2/3" />
                        </div>
                    </div>
                ))
            ) : recentBroadcasts && recentBroadcasts.length > 0 ? (
              recentBroadcasts.map(broadcast => (
                    <div className="flex items-start gap-4 relative group" key={broadcast.id}>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                            <Megaphone className="h-5 w-5 text-primary" />
                        </div>
                        <div className="grid gap-1 border-b border-slate-50 pb-4 w-full last:border-0">
                            <p className="text-sm leading-tight text-slate-700 font-medium">
                                {broadcast.title}
                            </p>
                            <span className="text-[10px] text-[#6B7280] flex items-center gap-1 font-bold uppercase tracking-wider mt-1">
                                <Clock className="h-3 w-3" />
                                {broadcast.sentAt && formatDistanceToNow(broadcast.sentAt.toDate(), { addSuffix: true })}
                            </span>
                        </div>
                    </div>
                ))
            ) : (
                <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
                    <LucideHistory className="h-10 w-10 text-slate-200" />
                    <p>No recent broadcasts logged.</p>
                </div>
            )}
          </CardContent>
          <CardFooter className="pt-2">
            <Link href="/dashboard/announcements" className="w-full">
              <Button variant="outline" className="w-full border-slate-200 text-[#1A1A1A] hover:bg-slate-50 font-bold rounded-xl shadow-sm">
                Broadcast New Update
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}