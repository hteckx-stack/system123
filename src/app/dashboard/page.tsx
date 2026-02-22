
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Users, FileText, UserPlus, Megaphone, Clock, CalendarDays, ShieldCheck, ArrowUpRight, History } from "lucide-react"
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore } from "@/firebase";
import { useMemo } from "react";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import type { Document, Staff, Announcement, CheckIn, LeaveRequest } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateUser, deleteUser } from "@/firebase/firestore/users";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const staffQuery = useMemo(() => query(collection(firestore, "users"), where("role", "==", "staff")), [firestore]);
  const { data: staffList, loading: staffLoading } = useCollection<Staff>(staffQuery);

  const pendingCheckInsQuery = useMemo(() => query(collection(firestore, "check_ins"), where("status", "==", "pending")), [firestore]);
  const { data: pendingCheckIns, loading: checkInsLoading } = useCollection<CheckIn>(pendingCheckInsQuery);

  const pendingLeavesQuery = useMemo(() => query(collection(firestore, "leave_requests"), where("status", "==", "pending")), [firestore]);
  const { data: pendingLeaves, loading: leavesLoading } = useCollection<LeaveRequest>(pendingLeavesQuery);

  const pendingStaffQuery = useMemo(() => query(
    collection(firestore, "users"), 
    where("status", "==", "pending"),
    where("role", "==", "staff")
  ), [firestore]);
  const { data: pendingStaff, loading: pendingStaffLoading } = useCollection<Staff>(pendingStaffQuery);
  
  const recentActivityQuery = useMemo(() => query(collection(firestore, "announcements"), orderBy("sentAt", "desc"), limit(5)), [firestore]);
  const { data: recentActivity, loading: activityLoading } = useCollection<Announcement>(recentActivityQuery);

  const loading = staffLoading || checkInsLoading || leavesLoading || pendingStaffLoading || activityLoading;

  const handleApprove = async (staff: Staff) => {
    if (!staff.id) return;
    try {
        await updateUser(firestore, staff.id, { status: "active" });
        toast({
          title: "Staff Approved",
          description: `${staff.name} is now an active staff member.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Approval Failed",
            description: "Could not approve staff member. Please try again.",
        })
    }
  };

  const handleDelete = async (staff: Staff) => {
    if (!staff.id) return;
    try {
        await deleteUser(firestore, staff.id);
        toast({
          variant: "destructive",
          title: "Staff Account Denied",
          description: `${staff.name}'s account has been denied.`,
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
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">System Overview</h1>
        <p className="text-[#6B7280]">Welcome back, administrator. Here's what's happening today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Staff", val: staffList?.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50", desc: "Registered users" },
          { title: "Pending Check-ins", val: pendingCheckIns?.length, icon: Clock, color: "text-orange-600", bg: "bg-orange-50", desc: "Arrivals today" },
          { title: "Leave Requests", val: pendingLeaves?.length, icon: CalendarDays, color: "text-green-600", bg: "bg-green-50", desc: "Awaiting review" },
          { title: "Pending Approvals", val: pendingStaff?.length, icon: UserPlus, color: "text-purple-600", bg: "bg-purple-50", desc: "New registrations" },
        ].map((item, idx) => (
          <Card key={idx} className="border-none shadow-soft overflow-hidden">
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
        <Card className="lg:col-span-4 border-none shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Staff Onboarding</CardTitle>
                  <CardDescription>Review new staff members waiting for system access.</CardDescription>
                </div>
                <Link href="/dashboard/staff">
                  <Button variant="ghost" size="sm" className="text-accent hover:bg-accent/5 gap-1">
                    Manage All <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
                {pendingStaffLoading ? (
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
                ) : pendingStaff && pendingStaff.length > 0 ? (
                    <div className="space-y-3">
                      {pendingStaff.map((staff) => (
                          <div key={staff.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-white hover:border-accent/20 transition-all shadow-sm">
                              <div className="flex items-center gap-4">
                                  <Avatar className="h-11 w-11 border-2 border-slate-100 shadow-sm">
                                      <AvatarImage src={staff.photoUrl} alt={staff.name} />
                                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{staff.name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <p className="font-semibold text-[#1A1A1A]">{staff.name}</p>
                                      <p className="text-xs text-[#6B7280]">{staff.email}</p>
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  <Button size="sm" className="bg-[#22C55E] hover:bg-[#1ea34d] shadow-sm font-bold" onClick={() => handleApprove(staff)}>Approve</Button>
                                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold" onClick={() => handleDelete(staff)}>Deny</Button>
                              </div>
                          </div>
                      ))}
                    </div>
                ) : (
                    <div className="py-20 text-center flex flex-col items-center justify-center gap-3 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                        <UserPlus className="h-10 w-10 text-slate-300" />
                        <p className="text-slate-400 font-medium">No new sign ups waiting for approval.</p>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl">Recent Activity</CardTitle>
            <CardDescription>Audit trail of recent system broadcasts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
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
            ) : recentActivity && recentActivity.length > 0 ? (
                recentActivity.map(activity => (
                    <div className="flex items-start gap-4 relative group" key={activity.id}>
                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20">
                            <Megaphone className="h-5 w-5 text-accent" />
                        </div>
                        <div className="grid gap-1 border-b border-slate-50 pb-4 w-full last:border-0">
                            <p className="text-sm leading-tight">
                                <span className="font-semibold text-[#1A1A1A]">Admin</span> sent 
                                <span className="text-accent font-medium mx-1">{activity.title}</span>
                            </p>
                            <span className="text-xs text-[#6B7280] flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {recentActivity && formatDistanceToNow(activity.sentAt.toDate(), { addSuffix: true })}
                            </span>
                        </div>
                    </div>
                ))
            ) : (
                <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
                    <History className="h-10 w-10 text-slate-200" />
                    <p>No recent system activity found.</p>
                </div>
            )}
          </CardContent>
          <CardFooter className="pt-2">
            <Link href="/dashboard/activity" className="w-full">
              <Button variant="outline" className="w-full border-slate-200 text-[#1A1A1A] hover:bg-slate-50 font-semibold shadow-sm">
                View All Activity
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
