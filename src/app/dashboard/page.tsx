"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Users, FileText } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore } from "@/firebase";
import { useMemo } from "react";
import { collection } from "firebase/firestore";
import type { Document, Staff } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";


const recentActivities = [
  {
    id: "ACT-001",
    user: "Admin",
    userAvatar: "https://picsum.photos/seed/admin/40/40",
    action: "STAFF_CREATE",
    details: "Added new staff member: John Marston",
    timestamp: "2023-11-15 10:00 AM",
  },
  {
    id: "ACT-002",
    user: "Admin",
    userAvatar: "https://picsum.photos/seed/admin/40/40",
    action: "DOC_UPLOAD",
    details: "Uploaded 'contract-am.pdf' for Arthur Morgan",
    timestamp: "2023-11-15 09:45 AM",
  },
  {
    id: "ACT-003",
    user: "Admin",
    userAvatar: "https://picsum.photos/seed/admin/40/40",
    action: "ANNOUNCE_SEND",
    details: "Sent announcement: 'Team-wide meeting next week'",
    timestamp: "2023-11-14 02:30 PM",
  },
  {
    id: "ACT-004",
    user: "Admin",
    userAvatar: "https://picsum.photos/seed/admin/40/40",
    action: "STAFF_UPDATE",
    details: "Updated profile for Eleanor Vance",
    timestamp: "2023-11-14 11:10 AM",
  },
  {
    id: "ACT-005",
    user: "Admin",
    userAvatar: "https://picsum.photos/seed/admin/40/40",
    action: "AUTH_RESET",
    details: "Sent password reset for Marcus Holloway",
    timestamp: "2023-11-13 04:00 PM",
  },
]

export default function Dashboard() {
  const firestore = useFirestore();

  const staffQuery = useMemo(() => collection(firestore, "users"), [firestore]);
  const { data: staffList, loading: staffLoading } = useCollection<Staff>(staffQuery);

  const documentsQuery = useMemo(() => collection(firestore, "documents"), [firestore]);
  const { data: documents, loading: documentsLoading } = useCollection<Document>(documentsQuery);

  const loading = staffLoading || documentsLoading;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
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
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>A log of recent actions from administrators.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-6">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={activity.userAvatar} alt={activity.user} />
                  <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1 text-sm">
                  <p className="font-medium leading-tight">{activity.details}</p>
                  <p className="text-xs text-muted-foreground">
                    by {activity.user}
                  </p>
                </div>
                <div className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                  {activity.timestamp}
                </div>
              </div>
            ))}
             {recentActivities.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No recent activity.</p>
                </div>
             )}
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
