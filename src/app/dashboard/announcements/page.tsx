
"use client"

import { useState, useMemo } from "react"
import { useDatabase, useFirestore } from "@/firebase"
import { ref, push, serverTimestamp as rtdbTimestamp } from "firebase/database"
import { collection, addDoc, serverTimestamp as firestoreTimestamp, query, orderBy } from "firebase/firestore"
import { useCollection } from "@/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Megaphone, History as LucideHistory, Clock, Send } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Announcement } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

export default function AnnouncementsPage() {
  const database = useDatabase()
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const announcementsQuery = useMemo(() => query(
    collection(firestore, "announcements"), 
    orderBy("sentAt", "desc")
  ), [firestore]);
  const { data: sentAnnouncements, loading } = useCollection<Announcement>(announcementsQuery);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !message) return

    setIsSending(true)
    try {
      // 1. Push to Realtime Database for instant Staff App home screen display
      const rtdbRef = ref(database, 'announcements');
      await push(rtdbRef, {
        title,
        message,
        date: new Date().toISOString(),
        timestamp: rtdbTimestamp()
      });

      // 2. Save to Firestore for Admin Audit Trail
      await addDoc(collection(firestore, "announcements"), {
        title,
        message,
        sentAt: firestoreTimestamp()
      });

      toast({
        title: "Broadcast Successful",
        description: "Staff home screens updated instantly.",
      });
      setTitle("");
      setMessage("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Broadcast Failed",
        description: "Check your connection to Realtime Database."
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Broadcast Tool</h1>
        <p className="text-[#6B7280]">Deliver instant real-time updates to all staff home screens.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <Card className="lg:col-span-7 border-none shadow-soft rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-[#0D47A1] text-white py-6">
            <div className="flex items-center gap-3">
              <Megaphone className="h-6 w-6" />
              <CardTitle className="text-xl">Compose Broadcast</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Announcement Title</Label>
              <Input 
                placeholder="e.g. System Maintenance Tomorrow" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 border-slate-200 font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Message Content</Label>
              <Textarea 
                placeholder="Staff will see this instantly on their home dashboard..." 
                className="min-h-[200px] rounded-2xl bg-slate-50 border-slate-200 p-5 leading-relaxed"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t p-6">
            <Button 
              onClick={handleBroadcast} 
              disabled={isSending}
              className="w-full h-12 bg-[#0D47A1] rounded-xl font-bold text-lg gap-3 shadow-lg shadow-[#0D47A1]/20 hover:bg-[#0A3578]"
            >
              <Send className="h-5 w-5" />
              {isSending ? "Broadcasting..." : "Push to All Devices"}
            </Button>
          </CardFooter>
        </Card>

        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <LucideHistory className="h-5 w-5 text-slate-400" />
            Broadcast History
          </h2>
          <div className="space-y-4">
            {loading ? (
              <Skeleton className="h-28 w-full rounded-2xl" />
            ) : sentAnnouncements?.map(ann => (
              <Card key={ann.id} className="border-none shadow-soft rounded-2xl bg-white overflow-hidden border-l-4 border-l-[#0D47A1]">
                <CardHeader className="p-5 pb-0">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                    <span className="text-[#0D47A1]">Live Broadcast</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {ann.sentAt && formatDistanceToNow(ann.sentAt.toDate(), { addSuffix: true })}
                    </div>
                  </div>
                  <CardTitle className="text-base font-bold text-[#1A1A1A]">{ann.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-2 pb-4">
                  <p className="text-sm text-[#6B7280] line-clamp-3 leading-relaxed">{ann.message}</p>
                </CardContent>
              </Card>
            ))}
            {sentAnnouncements?.length === 0 && (
               <div className="py-20 text-center text-slate-300">
                  <Megaphone className="h-10 w-10 mx-auto opacity-10 mb-2" />
                  <p className="text-sm font-medium">No previous broadcasts.</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
