
"use client";

import { useMemo } from "react";
import { collection, query, where, doc, writeBatch } from "firebase/firestore";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/firebase/firestore/activity-logs";
import { 
  Megaphone, 
  Clock, 
  CalendarDays, 
  ShieldCheck, 
  Smartphone, 
  Check, 
  X,
  UserCheck
} from "lucide-react";
import Link from 'next/link';
import type { Staff, LoginRequest } from "@/lib/types";

export default function Dashboard() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const staffQuery = useMemo(() => query(
    collection(firestore, "users"), 
    where("role", "==", "staff")
  ), [firestore]);
  
  const { data: staffList, loading: onboardingLoading } = useCollection<Staff>(staffQuery);
  const pendingUsers = useMemo(() => staffList?.filter(s => s.approved !== true), [staffList]);

  const loginRequestsQuery = useMemo(() => collection(firestore, "login_requests"), [firestore]);
  const { data: loginRequests, loading: loginsLoading } = useCollection<LoginRequest>(loginRequestsQuery);

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

  const handleRejectAccess = async (staffId: string, loginReqId?: string) => {
    if (!staffId) return;
    try {
      const batch = writeBatch(firestore);
      if (loginReqId) batch.delete(doc(firestore, "login_requests", loginReqId));
      batch.delete(doc(firestore, "users", staffId));
      await batch.commit();
      toast({ title: "Request Rejected", variant: "destructive" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Admin Command Center</h1>
        <p className="text-[#6B7280]">Source of Truth for Staff App synchronization and security.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-soft bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50 border-b pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-[#0D47A1]">Pending User Approvals</CardTitle>
                    <CardDescription>Review all registration requests from the app here.</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-white px-3 font-bold border-primary/20">
                    {pendingUsers?.length || 0} Request(s)
                  </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-6 px-0">
                <div className="divide-y">
                  {onboardingLoading || loginsLoading ? (
                    <div className="space-y-4 p-6">
                      <Skeleton className="h-20 w-full rounded-2xl" />
                      <Skeleton className="h-20 w-full rounded-2xl" />
                    </div>
                  ) : (
                    <>
                      {pendingUsers?.map(staff => {
                        const matchingReq = loginRequests?.find(r => r.staffId === staff.id);
                        return (
                          <div key={staff.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-lg text-primary">
                                    {staff.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-[#1A1A1A]">{staff.name}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">
                                        <Smartphone className="h-3.5 w-3.5" />
                                        {matchingReq ? matchingReq.deviceModel : "Awaiting device request..."}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  className="bg-[#22C55E] hover:bg-[#1ea34d] font-bold rounded-xl h-10 px-4 shadow-lg shadow-[#22C55E]/10"
                                  onClick={() => handleApproveAccess(staff, matchingReq?.id)}
                                >
                                  <Check className="h-4 w-4 mr-1.5" /> Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-red-600 hover:bg-red-50 font-bold rounded-xl h-10 w-10 p-0"
                                  onClick={() => handleRejectAccess(staff.id, matchingReq?.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                            </div>
                          </div>
                        )
                      })}
                      {(!pendingUsers || pendingUsers.length === 0) && (
                        <div className="py-20 text-center text-slate-300">
                          <UserCheck className="h-12 w-12 mx-auto opacity-10 mb-3" />
                          <p className="font-medium">No pending registration requests.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
            </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-soft bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b pb-6">
            <CardTitle className="text-xl text-[#0D47A1]">Shortcuts</CardTitle>
            <CardDescription>Administrative actions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6">
             <Link href="/dashboard/tasks">
                <Button variant="outline" className="w-full justify-start gap-4 h-16 rounded-2xl border-slate-100 hover:bg-slate-50 group transition-all">
                    <div className="bg-blue-50 p-2.5 rounded-xl group-hover:bg-white transition-colors">
                      <CalendarDays className="h-5 w-5 text-blue-500" />
                    </div>
                    <span className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">Duty Creator</span>
                </Button>
             </Link>
             <Link href="/dashboard/announcements">
                <Button variant="outline" className="w-full justify-start gap-4 h-16 rounded-2xl border-slate-100 hover:bg-slate-50 group transition-all">
                    <div className="bg-orange-50 p-2.5 rounded-xl group-hover:bg-white transition-colors">
                      <Megaphone className="h-5 w-5 text-orange-500" />
                    </div>
                    <span className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">Broadcast Center</span>
                </Button>
             </Link>
             <Link href="/dashboard/check-ins">
                <Button variant="outline" className="w-full justify-start gap-4 h-16 rounded-2xl border-slate-100 hover:bg-slate-50 group transition-all">
                    <div className="bg-green-50 p-2.5 rounded-xl group-hover:bg-white transition-colors">
                      <Clock className="h-5 w-5 text-green-500" />
                    </div>
                    <span className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">Attendance Feed</span>
                </Button>
             </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
