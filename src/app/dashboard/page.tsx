"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Users, FileText, UserPlus } from "lucide-react"
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore } from "@/firebase";
import { useMemo } from "react";
import { collection, query, where } from "firebase/firestore";
import type { Document, Staff } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateUser, deleteUser } from "@/firebase/firestore/users";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const staffQuery = useMemo(() => collection(firestore, "users"), [firestore]);
  const { data: staffList, loading: staffLoading } = useCollection<Staff>(staffQuery);

  const documentsQuery = useMemo(() => collection(firestore, "documents"), [firestore]);
  const { data: documents, loading: documentsLoading } = useCollection<Document>(documentsQuery);

  const pendingStaffQuery = useMemo(() => query(collection(firestore, "users"), where("status", "==", "pending")), [firestore]);
  const { data: pendingStaff, loading: pendingStaffLoading } = useCollection<Staff>(pendingStaffQuery);

  const loading = staffLoading || documentsLoading || pendingStaffLoading;

  const handleApprove = (staff: Staff) => {
    if (!staff.id) return;
    updateUser(firestore, staff.id, { status: "active" });
    toast({
      title: "Staff Approved",
      description: `${staff.name} is now an active staff member.`,
    });
  };

  const handleDelete = (staff: Staff) => {
    if (!staff.id) return;
    deleteUser(firestore, staff.id);
    toast({
      variant: "destructive",
      title: "Staff Account Denied",
      description: `${staff.name}'s account has been deleted.`,
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{staffList?.length ?? 0}</div>}
            <p className="text-xs text-muted-foreground">
              Currently managed staff members.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
          {loading ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{documents?.length ?? 0}</div>}
            <p className="text-xs text-muted-foreground">
              Total documents stored.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Sign Ups</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
          {loading ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{pendingStaff?.length ?? 0}</div>}
            <p className="text-xs text-muted-foreground">
              New users awaiting approval.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>New Sign Ups</CardTitle>
            <CardDescription>Review and approve new staff members waiting for access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {pendingStaffLoading ? (
                <div className="space-y-4">
                    {Array.from({length: 2}).map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-9 w-20" />
                                <Skeleton className="h-9 w-20" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : pendingStaff && pendingStaff.length > 0 ? (
                pendingStaff.map((staff) => (
                    <div key={staff.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={staff.photoUrl} alt={staff.name} />
                                <AvatarFallback>{staff.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{staff.name}</p>
                                <p className="text-sm text-muted-foreground">{staff.email}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleApprove(staff)}>Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(staff)}>Deny</Button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="py-12 text-center text-muted-foreground">
                    <p>No new sign ups waiting for approval.</p>
                </div>
            )}
        </CardContent>
        <CardFooter>
            <Link href="/dashboard/staff" className="w-full">
                <Button variant="outline" className="w-full">
                    Manage All Staff
                </Button>
            </Link>
        </CardFooter>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>A log of recent actions from administrators.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="py-12 text-center text-muted-foreground">
              <p>Activity feed is not yet connected.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Link href="/dashboard/activity" className="w-full">
            <Button variant="outline" className="w-full">
              View All Activity
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
