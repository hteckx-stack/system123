"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Users, FileText } from "lucide-react"
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore } from "@/firebase";
import { useMemo } from "react";
import { collection } from "firebase/firestore";
import type { Document, Staff } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

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
