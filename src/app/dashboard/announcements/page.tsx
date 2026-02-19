"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Staff, Announcement } from "@/lib/types"
import { useCollection, useFirestore } from "@/firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { addAnnouncement } from "@/firebase/firestore/announcements"
import { Skeleton } from "@/components/ui/skeleton"
import { Megaphone, Users, Clock, ArrowRight, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AnnouncementsPage() {
  const { toast } = useToast()
  const firestore = useFirestore()
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)
  
  const staffQuery = useMemo(() => collection(firestore, "users"), [firestore])
  const { data: staffList, loading: staffLoading } = useCollection<Staff>(staffQuery)

  const announcementsQuery = useMemo(() => query(collection(firestore, "announcements"), orderBy("sentAt", "desc")), [firestore]);
  const { data: sentAnnouncements, loading: announcementsLoading } = useCollection<Announcement>(announcementsQuery);

  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null)
  const [detailedRecipients, setDetailedRecipients] = useState<Staff[]>([])
  const [recipientsLoading, setRecipientsLoading] = useState(false)

  useEffect(() => {
    if (viewingAnnouncement && viewingAnnouncement.recipientIds.length > 0) {
      const fetchRecipients = async () => {
        setRecipientsLoading(true);
        const recipients: Staff[] = [];
        const ids = viewingAnnouncement.recipientIds.slice(0, 30);
        const q = query(collection(firestore, "users"), where("__name__", "in", ids));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          recipients.push({ id: doc.id, ...doc.data() } as Staff);
        });
        setDetailedRecipients(recipients);
        setRecipientsLoading(false);
      };
      fetchRecipients();
    } else {
      setDetailedRecipients([]);
    }
  }, [viewingAnnouncement, firestore]);

  const handleSelectStaff = (staffId: string) => {
    setSelectedStaff((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    )
  }

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedStaff(staffList?.map((staff) => staff.id) || [])
    } else {
      setSelectedStaff([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !message || selectedStaff.length === 0) {
      toast({
        variant: "destructive",
        title: "Incomplete Form",
        description: "Please fill out the title, message, and select at least one staff member.",
      })
      return
    }
    
    setIsSending(true);
    try {
        const newAnnouncement: Omit<Announcement, 'id' | 'sentAt'> = {
            title,
            message,
            recipientIds: selectedStaff,
            recipientCount: selectedStaff.length,
        };
        await addAnnouncement(firestore, newAnnouncement);
        toast({ title: "Announcement Sent!", description: `Message broadcasted to ${selectedStaff.length} recipients.` })
        setTitle(""); setMessage(""); setSelectedStaff([]);
    } catch (error) {
        toast({ variant: "destructive", title: "Send Failed", description: "Could not broadcast the message." })
    } finally {
        setIsSending(false);
    }
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Date not available';
    const date = timestamp.toDate();
    return date.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
    });
  };
  
  const isAllSelected = (staffList?.length ?? 0) > 0 && selectedStaff.length === staffList?.length;
  const isIndeterminate = selectedStaff.length > 0 && !isAllSelected;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Announcements</h1>
        <p className="text-[#6B7280]">Broadcast important updates and corporate news to your team.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-12">
        <Card className="lg:col-span-7 border-none shadow-soft rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary text-white py-6">
                <div className="flex items-center gap-3">
                  <Megaphone className="h-6 w-6" />
                  <CardTitle className="text-xl">Compose Broadcast</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-8">
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-bold uppercase text-slate-400 tracking-wider">Announcement Title</Label>
                    <Input 
                        id="title" 
                        placeholder="e.g. Q4 Performance Review & Strategy" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-primary/20"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-bold uppercase text-slate-400 tracking-wider">Message Content</Label>
                    <Textarea
                        id="message"
                        placeholder="Type your company announcement here..."
                        className="min-h-[250px] rounded-2xl border-slate-200 bg-slate-50 focus-visible:ring-primary/20 p-5 leading-relaxed"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                    />
                </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t p-6">
              <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg shadow-lg shadow-primary/20" disabled={staffLoading || isSending}>
                {isSending ? 'Broadcasting...' : 'Send Announcement'}
              </Button>
            </CardFooter>
        </Card>

        <Card className="lg:col-span-5 border-none shadow-soft rounded-3xl">
            <CardHeader>
                <CardTitle className="text-xl">Target Recipients</CardTitle>
                <CardDescription>Select which staff members should receive this update.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <Checkbox 
                        id="select-all-staff" 
                        checked={isIndeterminate ? 'indeterminate' : isAllSelected}
                        onCheckedChange={handleSelectAll}
                        disabled={staffLoading}
                    />
                    <Label htmlFor="select-all-staff" className="font-bold cursor-pointer text-[#1A1A1A]">
                        Broadcast to All Staff
                    </Label>
                </div>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pr-4">
                    {staffLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50/50">
                                <Skeleton className="h-4 w-4 rounded" />
                                <div className="w-full space-y-2">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-3 w-1/3" />
                                </div>
                            </div>
                        ))
                    ) : (
                      staffList?.map((staff) => (
                        <div key={staff.id} className={cn(
                          "flex items-center space-x-3 rounded-xl p-3 transition-all",
                          selectedStaff.includes(staff.id) ? "bg-accent/5 border border-accent/10" : "hover:bg-slate-50 border border-transparent"
                        )}>
                            <Checkbox
                            id={`select-${staff.id}`}
                            checked={selectedStaff.includes(staff.id)}
                            onCheckedChange={() => handleSelectStaff(staff.id)}
                            />
                            <Label htmlFor={`select-${staff.id}`} className="w-full cursor-pointer flex items-center gap-3">
                              <Avatar className="h-9 w-9 border">
                                <AvatarImage src={staff.photoUrl} />
                                <AvatarFallback className="text-xs font-bold">{staff.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-[#1A1A1A]">{staff.name}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{staff.position}</span>
                              </div>
                            </Label>
                        </div>
                    )))}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="pt-4 border-t">
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Selected Counts</span>
                  <Badge variant="secondary" className="bg-accent/10 text-accent font-bold px-4">{selectedStaff.length} Members</Badge>
                </div>
            </CardFooter>
        </Card>
      </form>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Communication History</h2>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{sentAnnouncements?.length || 0} Total Sent</span>
        </div>

        {announcementsLoading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({length: 3}).map((_, i) => (
                    <Card key={i} className="rounded-2xl shadow-soft">
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent><Skeleton className="h-12 w-full" /></CardContent>
                    </Card>
                ))}
            </div>
        ) : sentAnnouncements && sentAnnouncements.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sentAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="border-none shadow-soft rounded-2xl group hover:bg-slate-50 transition-all cursor-pointer overflow-hidden border-t-4 border-t-primary" onClick={() => setViewingAnnouncement(announcement)}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md">Broadcast</span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(announcement.sentAt.toDate(), { addSuffix: true })}
                    </div>
                  </div>
                  <CardTitle className="text-lg font-bold text-[#1A1A1A] line-clamp-1">{announcement.title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  <p className="text-sm text-[#6B7280] line-clamp-2 leading-relaxed">{announcement.message}</p>
                </CardContent>
                <CardFooter className="bg-slate-50 py-3 px-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <Users className="h-3.5 w-3.5" />
                    {announcement.recipientCount} Recipients
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-accent hover:bg-accent/10 gap-1 pr-0">
                    View Details <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white rounded-3xl shadow-soft flex flex-col items-center justify-center gap-4">
            <div className="bg-slate-50 p-8 rounded-full">
              <History className="h-12 w-12 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A]">History Clear</h3>
            <p className="text-slate-400">You haven't sent any announcements yet.</p>
          </div>
        )}
      </div>

      {viewingAnnouncement && (
        <Dialog open={!!viewingAnnouncement} onOpenChange={(open) => !open && setViewingAnnouncement(null)}>
          <DialogContent className="sm:max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="bg-primary text-white p-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-white/10 p-2 rounded-xl">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                   <DialogTitle className="text-2xl font-bold text-white leading-none">{viewingAnnouncement.title}</DialogTitle>
                   <p className="text-white/60 text-sm mt-1">Broadcasted on {formatTimestamp(viewingAnnouncement.sentAt)}</p>
                </div>
              </div>
            </DialogHeader>
            <div className="p-8 space-y-8">
                <div>
                    <h3 className="mb-3 text-xs font-bold uppercase text-slate-400 tracking-widest">Announcement Message</h3>
                    <div className="text-[15px] text-[#1A1A1A] leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                      {viewingAnnouncement.message}
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest">Recipients History</h3>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold">{viewingAnnouncement.recipientCount} Total</Badge>
                    </div>
                    <ScrollArea className="h-64 rounded-2xl border border-slate-100 p-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {recipientsLoading ? (
                             Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 rounded-xl border p-3 bg-slate-50/30">
                                    <Skeleton className="h-9 w-9 rounded-full" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-2.5 w-16" />
                                    </div>
                                </div>
                            ))
                        ) : detailedRecipients.map(staff => (
                            <div key={staff.id} className="flex items-center gap-3 rounded-xl border border-slate-50 p-3 hover:bg-slate-50 transition-colors">
                                <Avatar className="h-9 w-9 border shadow-sm">
                                    <AvatarImage src={staff.photoUrl} alt={staff.name} />
                                    <AvatarFallback className="font-bold text-xs">{staff.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-[#1A1A1A] truncate">{staff.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{staff.position}</p>
                                </div>
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
            <div className="bg-slate-50 p-6 flex justify-end">
              <Button onClick={() => setViewingAnnouncement(null)} className="rounded-xl px-8 font-bold">Close Details</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}