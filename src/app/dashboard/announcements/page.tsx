
"use client"

import { useState, useMemo } from "react"
import { useDatabase, useFirestore, useUser } from "@/firebase"
import { ref, push, serverTimestamp as rtdbTimestamp } from "firebase/database"
import { collection, addDoc, serverTimestamp as firestoreTimestamp, query, orderBy } from "firebase/firestore"
import { useCollection } from "@/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
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
  const { user } = useUser()
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
      // 1. Push to Realtime Database for instant staff app display
      const rtdbRef = ref(database, 'announcements');
      await push(rtdbRef, {
        title,
        message,
        date: new Date().toISOString(),
        timestamp: rtdbTimestamp()
      });

      // 2. Save to Firestore for Admin History
      await addDoc(collection(firestore, "announcements"), {
        title,
        message,
        sentAt: firestoreTimestamp(),
        recipientCount: 0 // Global broadcast
      });

      toast({
        title: "Broadcast Sent",
        description: "Message delivered instantly to all staff apps.",
      });
      setTitle("");
      setMessage("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Broadcast Failed",
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Announcements & Broadcasts</h1>
        <p className="text-[#6B7280]">Deliver instant updates to staff via Realtime Database.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <Card className="lg:col-span-7 border-none shadow-soft rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-[#0D47A1] text-white py-6">
            <div className="flex items-center gap-3">
              <Megaphone className="h-6 w-6" />
              <CardTitle className="text-xl">Compose Instant Message</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Headline</Label>
              <Input 
                placeholder="e.g. Mandatory Safety Briefing" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Message Content</Label>
              <Textarea 
                placeholder="Enter details for the staff home screen..." 
                className="min-h-[200px] rounded-2xl bg-slate-50 border-slate-200 p-5"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t p-6">
            <Button 
              onClick={handleBroadcast} 
              disabled={isSending}
              className="w-full h-12 bg-[#0D47A1] rounded-xl font-bold text-lg gap-2"
            >
              <Send className="h-5 w-5" />
              {isSending ? "Broadcasting..." : "Send to All Devices"}
            </Button>
          </CardFooter>
        </Card>

        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <LucideHistory className="h-5 w-5 text-slate-400" />
            Recent Broadcasts
          </h2>
          <div className="space-y-4">
            {loading ? (
              <Skeleton className="h-24 w-full rounded-2xl" />
            ) : sentAnnouncements?.map(ann => (
              <Card key={ann.id} className="border-none shadow-soft rounded-2xl bg-white overflow-hidden border-l-4 border-l-primary">
                <CardHeader className="p-4 pb-0">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                    <span>Broadcast</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {ann.sentAt && formatDistanceToNow(ann.sentAt.toDate(), { addSuffix: true })}
                    </div>
                  </div>
                  <CardTitle className="text-base font-bold text-[#1A1A1A]">{ann.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-sm text-[#6B7280] line-clamp-2">{ann.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
