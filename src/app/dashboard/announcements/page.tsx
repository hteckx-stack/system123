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

type SentAnnouncement = Announcement & {
  recipients: Staff[];
  sentAt: string;
};

export default function AnnouncementsPage() {
  const { toast } = useToast()
  const firestore = useFirestore()
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  
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
        // Firestore 'in' query is limited to 30 elements.
        // For larger lists, you'd need to fetch in batches.
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !message || selectedStaff.length === 0) {
      toast({
        variant: "destructive",
        title: "Incomplete Form",
        description: "Please fill out the title, message, and select at least one staff member.",
      })
      return
    }
    
    const newAnnouncement: Omit<Announcement, 'id' | 'sentAt'> = {
        title,
        message,
        recipientIds: selectedStaff,
        recipientCount: selectedStaff.length,
    };
    addAnnouncement(firestore, newAnnouncement);
    
    toast({
      title: "Announcement Sent!",
      description: `Your message "${title}" has been sent to ${selectedStaff.length} staff member(s).`,
    })

    // Reset form
    setTitle("")
    setMessage("")
    setSelectedStaff([])
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Date not available';
    const date = timestamp.toDate();
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
  };
  
  const isAllSelected = (staffList?.length ?? 0) > 0 && selectedStaff.length === staffList?.length;
  const isIndeterminate = selectedStaff.length > 0 && !isAllSelected;

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
            <p className="text-muted-foreground">
              Create and send announcements to staff members.
            </p>
          </div>
          <Button type="submit" disabled={staffLoading}>Send Announcement</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Compose Message</CardTitle>
                    <CardDescription>
                        Write your announcement below. It will be sent to the selected staff members.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input 
                            id="title" 
                            placeholder="e.g. Upcoming Team Meeting" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            placeholder="Type your message here."
                            className="min-h-[200px]"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Select Recipients</CardTitle>
                    <CardDescription>
                       Choose which staff should receive this.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center space-x-2 border-b pb-4">
                        <Checkbox 
                            id="select-all-staff" 
                            checked={isIndeterminate ? 'indeterminate' : isAllSelected}
                            onCheckedChange={handleSelectAll}
                            disabled={staffLoading}
                        />
                        <Label htmlFor="select-all-staff" className="font-medium cursor-pointer">
                            Select All Staff
                        </Label>
                    </div>
                  <ScrollArea className="h-72">
                    <div className="space-y-3 pr-4">
                        {staffLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center space-x-3 p-2">
                                    <Skeleton className="h-4 w-4" />
                                    <div className="w-full space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))
                        ) : (
                          staffList?.map((staff) => (
                            <div key={staff.id} className="flex items-center space-x-3 rounded-md p-2 hover:bg-muted/50">
                                <Checkbox
                                id={`select-${staff.id}`}
                                checked={selectedStaff.includes(staff.id)}
                                onCheckedChange={() => handleSelectStaff(staff.id)}
                                />
                                <Label htmlFor={`select-${staff.id}`} className="w-full cursor-pointer flex items-center gap-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{staff.name}</span>
                                    <span className="text-xs text-muted-foreground">{staff.position}</span>
                                  </div>
                                </Label>
                            </div>
                        )))}
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter>
                    <p className="text-sm text-muted-foreground">
                        {selectedStaff.length} of {staffList?.length || 0} staff selected.
                    </p>
                </CardFooter>
            </Card>
        </div>
      </form>
      
      <Separator />

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Sent History</h2>
        <p className="text-muted-foreground">
            A history of all announcements that have been sent. Click a card to view details.
        </p>

        {announcementsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({length: 3}).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                           <Skeleton className="h-8 w-full" />
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-6 w-24" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        ) : sentAnnouncements && sentAnnouncements.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sentAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewingAnnouncement(announcement)}>
                <CardHeader>
                  <CardTitle className="text-lg">{announcement.title}</CardTitle>
                  <CardDescription>{formatTimestamp(announcement.sentAt)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{announcement.message}</p>
                </CardContent>
                <CardFooter>
                  <Badge variant="outline">{announcement.recipientCount} Recipient(s)</Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-muted-foreground">
                No announcements have been sent yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {viewingAnnouncement && (
        <Dialog open={!!viewingAnnouncement} onOpenChange={(open) => !open && setViewingAnnouncement(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{viewingAnnouncement.title}</DialogTitle>
              <DialogDescription>
                Sent on {formatTimestamp(viewingAnnouncement.sentAt)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div>
                    <h3 className="mb-2 font-medium">Message</h3>
                    <p className="text-sm text-muted-foreground rounded-md border p-4 bg-muted/50">{viewingAnnouncement.message}</p>
                </div>
                <div>
                    <h3 className="mb-2 font-medium">Recipients ({viewingAnnouncement.recipientCount})</h3>
                    <ScrollArea className="h-48">
                        <div className="space-y-2 pr-4">
                        {recipientsLoading ? (
                             Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 rounded-md border p-2">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                            ))
                        ) : detailedRecipients.map(staff => (
                            <div key={staff.id} className="flex items-center gap-3 rounded-md border p-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={staff.photoUrl} alt={staff.name} />
                                    <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">{staff.name}</p>
                                    <p className="text-xs text-muted-foreground">{staff.position}</p>
                                </div>
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
