
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Users, UserPlus, Megaphone, Clock, CalendarDays, ShieldCheck, Smartphone, Check, X } from "lucide-react"
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { useMemo } from "react";
import { collection, query, where, doc, deleteDoc, writeBatch } from "firebase/firestore";
import type { Staff, LoginRequest } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateUser } from "@/firebase/firestore/users";
import { logActivity } from "@/firebase/firestore/activity-logs";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  // Fetch pending staff users
  const pendingStaffQuery = useMemo(() => query(
    collection(firestore, "users"), 
    where("status", "==", "pending")
  ), [firestore]);
  const { data: pendingStaff, loading: staffLoading } = useCollection<Staff>(pendingStaffQuery);

  // Fetch login requests
  const loginRequestsQuery = useMemo(() => collection(firestore, "login_requests"), [firestore]);
  const { data: loginRequests, loading: loginsLoading } = useCollection<LoginRequest>(loginRequestsQuery);

  const handleApproveAccess = async (staff: Staff, loginReqId?: string) => {
    if (!staff.id || !currentUser) return;
    
    try {
      const batch = writeBatch(firestore);
      
      // 1. Set approved = true (active) in staff's document
      batch.set(doc(firestore, "users", staff.id), { status: "active" }, { merge: true });
      
      // 2. Delete corresponding login request if exists
      if (loginReqId) {
        batch.delete(doc(firestore, "login_requests", loginReqId));
      }
      
      await batch.commit();
      
      await logActivity(
        firestore,
        currentUser.uid,
        currentUser.displayName || "Admin",
        "Security Approval",
        `Granted access to ${staff.name} and cleared device request.`
      );

      toast({
        title: "Access Approved",
        description: `${staff.name} can now access the staff app.`,
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
        <p className="text-[#6B7280]">Source of Truth for Staff App status and security.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-soft bg-white">
            <CardHeader className="border-b pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Staff & Login Approvals</CardTitle>
                    <CardDescription>Verify users and device requests to unlock Staff App.</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    { (pendingStaff?.length || 0) + (loginRequests?.length || 0) } Pending
                  </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-4">
                  {staffLoading || loginsLoading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : (
                    <>
                      {/* Combine Pending Users and Login Requests for UX */}
                      {pendingStaff?.map(staff => {
                        const matchingReq = loginRequests?.find(r => r.staffId === staff.id);
                        return (
                          <div key={staff.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-white hover:border-accent/20 transition-all shadow-sm group">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-11 w-11 border-2 border-slate-100 shadow-sm">
                                    <AvatarImage src={staff.photoUrl} />
                                    <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold text-[#1A1A1A]">{staff.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                                        <Smartphone className="h-3 w-3" />
                                        {matchingReq ? matchingReq.deviceModel : "Waiting for login..."}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  className="bg-[#22C55E] hover:bg-[#1ea34d] font-bold rounded-xl"
                                  onClick={() => handleApproveAccess(staff, matchingReq?.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" /> Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-red-600 hover:bg-red-50 font-bold rounded-xl"
                                  onClick={() => handleRejectAccess(staff.id, matchingReq?.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                            </div>
                          </div>
                        )
                      })}
                      {(!pendingStaff || pendingStaff.length === 0) && (
                        <div className="py-12 text-center text-slate-400">
                          <ShieldCheck className="h-10 w-10 mx-auto opacity-10 mb-2" />
                          <p>All users and devices are authorized.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
            </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-soft bg-white">
          <CardHeader className="border-b pb-6">
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            <CardDescription>Shortcut to vital admin tools.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6">
             <Link href="/dashboard/tasks">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl border-slate-200">
                    <CalendarDays className="h-5 w-5 text-blue-500" />
                    <span className="font-bold">Assign New Tasks</span>
                </Button>
             </Link>
             <Link href="/dashboard/announcements">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl border-slate-200">
                    <Megaphone className="h-5 w-5 text-orange-500" />
                    <span className="font-bold">Broadcast Instantly</span>
                </Button>
             </Link>
             <Link href="/dashboard/check-ins">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl border-slate-200">
                    <Clock className="h-5 w-5 text-green-500" />
                    <span className="font-bold">Monitor Attendance</span>
                </Button>
             </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
