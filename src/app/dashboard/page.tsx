
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Megaphone, Clock, CalendarDays, ShieldCheck, Smartphone, Check, X } from "lucide-react"
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { useMemo } from "react";
import { collection, query, where, doc, writeBatch } from "firebase/firestore";
import type { Staff, LoginRequest } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logActivity } from "@/firebase/firestore/activity-logs";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  // Onboarding Hub: Fetch all staff with 'pending' status
  const pendingStaffQuery = useMemo(() => query(
    collection(firestore, "users"), 
    where("status", "==", "pending"),
    where("role", "==", "staff")
  ), [firestore]);
  
  const { data: pendingStaff, loading: staffLoading } = useCollection<Staff>(pendingStaffQuery);

  // Fetch device login requests
  const loginRequestsQuery = useMemo(() => collection(firestore, "login_requests"), [firestore]);
  const { data: loginRequests, loading: loginsLoading } = useCollection<LoginRequest>(loginRequestsQuery);

  const handleApproveAccess = async (staff: Staff, loginReqId?: string) => {
    if (!staff.id || !currentUser) return;
    
    try {
      const batch = writeBatch(firestore);
      
      // Update staff document: approved = true, status = active
      batch.update(doc(firestore, "users", staff.id), { 
        approved: true, 
        status: "active" 
      });
      
      // Delete corresponding login request to notify the user's app
      if (loginReqId) {
        batch.delete(doc(firestore, "login_requests", loginReqId));
      }
      
      await batch.commit();
      
      await logActivity(
        firestore,
        currentUser.uid,
        currentUser.displayName || "Admin",
        "Staff Approved",
        `Approved access for ${staff.name} and cleared device request.`
      );

      toast({
        title: "Staff Approved",
        description: `${staff.name} can now access the Staff App.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: "Could not approve registration.",
      });
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
        <p className="text-[#6B7280]">Real-time Source of Truth for Staff App status.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-soft bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50 border-b pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-[#0D47A1]">System Onboarding</CardTitle>
                    <CardDescription>Approve staff and clear device requests.</CardDescription>
                  </div>
                  <Badge className="bg-[#0D47A1] text-white font-bold h-7 px-3 rounded-full">
                    { (pendingStaff?.length || 0) + (loginRequests?.length || 0) } Pending
                  </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-4">
                  {staffLoading || loginsLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-full rounded-2xl" />
                      <Skeleton className="h-20 w-full rounded-2xl" />
                    </div>
                  ) : (
                    <>
                      {pendingStaff?.map(staff => {
                        const matchingReq = loginRequests?.find(r => r.staffId === staff.id);
                        return (
                          <div key={staff.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 bg-white hover:border-[#1976D2]/20 transition-all shadow-sm group">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-slate-100 shadow-sm">
                                    <AvatarImage src={staff.photoUrl} />
                                    <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold text-[#1A1A1A]">{staff.name}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">
                                        <Smartphone className="h-3.5 w-3.5" />
                                        {matchingReq ? `${matchingReq.deviceModel} (ID: ${matchingReq.deviceId.substring(0,8)}...)` : "Awaiting device request..."}
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
                      {(!pendingStaff || pendingStaff.length === 0) && (
                        <div className="py-16 text-center text-slate-300">
                          <ShieldCheck className="h-12 w-12 mx-auto opacity-10 mb-3" />
                          <p className="font-medium">All staff and devices are currently authorized.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
            </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-soft bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b pb-6">
            <CardTitle className="text-xl text-[#0D47A1]">Quick Controls</CardTitle>
            <CardDescription>Instant administrative actions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6">
             <Link href="/dashboard/tasks">
                <Button variant="outline" className="w-full justify-start gap-4 h-16 rounded-2xl border-slate-100 hover:bg-slate-50 group transition-all">
                    <div className="bg-blue-50 p-2.5 rounded-xl group-hover:bg-white transition-colors">
                      <CalendarDays className="h-5 w-5 text-blue-500" />
                    </div>
                    <span className="font-bold text-slate-700">Task Creator</span>
                </Button>
             </Link>
             <Link href="/dashboard/announcements">
                <Button variant="outline" className="w-full justify-start gap-4 h-16 rounded-2xl border-slate-100 hover:bg-slate-50 group transition-all">
                    <div className="bg-orange-50 p-2.5 rounded-xl group-hover:bg-white transition-colors">
                      <Megaphone className="h-5 w-5 text-orange-500" />
                    </div>
                    <span className="font-bold text-slate-700">Broadcast Center</span>
                </Button>
             </Link>
             <Link href="/dashboard/check-ins">
                <Button variant="outline" className="w-full justify-start gap-4 h-16 rounded-2xl border-slate-100 hover:bg-slate-50 group transition-all">
                    <div className="bg-green-50 p-2.5 rounded-xl group-hover:bg-white transition-colors">
                      <Clock className="h-5 w-5 text-green-500" />
                    </div>
                    <span className="font-bold text-slate-700">Attendance Feed</span>
                </Button>
             </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
