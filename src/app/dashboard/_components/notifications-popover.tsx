
"use client"

import { useMemo } from "react"
import { Bell, CheckCheck, Clock, MessageSquare, UserPlus, Calendar, ShieldCheck } from "lucide-react"
import { useFirestore, useCollection, useUser } from "@/firebase"
import { collection, query, where, orderBy, limit, updateDoc, doc, writeBatch } from "firebase/firestore"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import type { Notification } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export function NotificationsPopover() {
  const { user } = useUser()
  const firestore = useFirestore()

  const notificationsQuery = useMemo(() => {
    if (!user) return null
    return query(
      collection(firestore, "notifications"),
      where("userId", "in", [user.uid, "admin"]),
      orderBy("createdAt", "desc"),
      limit(20)
    )
  }, [firestore, user])

  const { data: notifications, loading } = useCollection<Notification>(notificationsQuery as any)

  const unreadCount = useMemo(() => 
    notifications?.filter(n => !n.read).length || 0, 
    [notifications]
  )

  const handleMarkAllAsRead = async () => {
    if (!notifications || !firestore) return
    const batch = writeBatch(firestore)
    notifications.forEach(n => {
      if (!n.read) {
        batch.update(doc(firestore, "notifications", n.id), { read: true })
      }
    })
    await batch.commit()
  }

  const handleMarkAsRead = async (id: string) => {
    if (!firestore) return
    await updateDoc(doc(firestore, "notifications", id), { read: true })
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'leave': return <Calendar className="h-4 w-4 text-blue-500" />
      case 'checkin': return <Clock className="h-4 w-4 text-orange-500" />
      case 'message': return <MessageSquare className="h-4 w-4 text-green-500" />
      case 'signup': return <UserPlus className="h-4 w-4 text-purple-500" />
      default: return <Bell className="h-4 w-4 text-slate-500" />
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 border-2 border-primary text-[10px] font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 border-none shadow-2xl rounded-2xl overflow-hidden" align="end">
        <div className="bg-primary p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <h3 className="font-bold text-sm">System Alerts</h3>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="h-8 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-white/10 p-2"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[350px]">
          {loading ? (
            <div className="p-10 text-center text-slate-400">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-xs">Loading alerts...</p>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={cn(
                    "p-4 flex gap-3 cursor-pointer transition-colors",
                    n.read ? "bg-white" : "bg-blue-50/50 hover:bg-blue-50"
                  )}
                  onClick={() => !n.read && handleMarkAsRead(n.id)}
                >
                  <div className="shrink-0 mt-1">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <p className={cn("text-xs leading-none", n.read ? "font-semibold text-slate-700" : "font-bold text-primary")}>
                        {n.title}
                      </p>
                      <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">
                        {n.createdAt && formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-slate-400 flex flex-col items-center gap-2">
              <Bell className="h-8 w-8 opacity-10" />
              <p className="text-xs font-medium">All clear! No new alerts.</p>
            </div>
          )}
        </ScrollArea>
        <div className="bg-slate-50 p-3 text-center border-t">
          <Button variant="link" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary">
            View All Activity
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
