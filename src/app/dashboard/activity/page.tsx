
"use client"

import { useMemo } from "react"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { useFirestore, useCollection } from "@/firebase"
import type { ActivityLog } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { History as LucideHistory, Activity, User, ShieldCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function ActivityPage() {
  const firestore = useFirestore()
  
  const activityQuery = useMemo(() => query(
    collection(firestore, "activity_logs"),
    orderBy("timestamp", "desc"),
    limit(50)
  ), [firestore])

  const { data: logs, loading } = useCollection<ActivityLog>(activityQuery as any)

  const getActionIcon = (action: string) => {
    if (action.includes('Leave')) return <LucideHistory className="h-4 w-4 text-blue-500" />
    if (action.includes('Message')) return <Activity className="h-4 w-4 text-green-500" />
    if (action.includes('Admin')) return <ShieldCheck className="h-4 w-4 text-purple-500" />
    return <User className="h-4 w-4 text-slate-500" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0D47A1]">System Audit Logs</h1>
        <p className="text-muted-foreground">
          Traceability trail of all administrative and staff actions performed.
        </p>
      </div>

      <Card className="border-none shadow-soft bg-white rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-xl">Audit Trail</CardTitle>
          <CardDescription>
            Most recent 50 activities tracked automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="p-4 flex gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))
            ) : logs && logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                  <div className="bg-white p-2 rounded-full border shadow-sm self-start">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-[#0D47A1]">{log.action}</span>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {log.timestamp && formatDistanceToNow(log.timestamp.toDate(), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{log.details}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <User className="h-2.5 w-2.5" />
                      <span>Performed by: {log.user_name}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto opacity-20 mb-2" />
                <p>No activity logs found yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
