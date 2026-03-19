"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { collection, query, orderBy, where, onSnapshot, addDoc, serverTimestamp as firestoreTimestamp } from "firebase/firestore"
import { ref, push, serverTimestamp as rtdbTimestamp } from "firebase/database"
import { useFirestore, useCollection, useUser, useDatabase } from "@/firebase"
import type { Conversation, Message, Announcement, Document, Staff } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Send, Search, MessageSquare, ArrowLeft, Megaphone, Clock, History as LucideHistory, FileText, Download, Plus } from "lucide-react"
import { sendMessage } from "@/firebase/firestore/messages"
import { addDocument } from "@/firebase/firestore/documents"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"

const placeholderTemplates = {
  contract: `CONTRACT OF EMPLOYMENT\n\nBETWEEN:\n[Company Name]\n\nAND:\n{{staffName}}\n\nThis contract is effective from {{date}}.\n...`,
  payslip: `[Company Logo]\n\nPAYSLIP\n\nStaff Name: {{staffName}}\nMonth: {{month}}\nAmount: \${{amount}}\n\nThis is a summary of your payment.\n...`,
  warning: `WARNING LETTER\n\nDate: {{date}}\nTo: {{staffName}}\n\nThis letter serves as a formal warning regarding...`
}

export default function ChatHubPage() {
  const firestore = useFirestore()
  const database = useDatabase()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [topicFilter, setTopicFilter] = useState<string>("all")
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [isBroadcasting, setIsBroadcasting] = useState(false)

  // Document State
  const [selectedStaffId, setSelectedStaffId] = useState<string>("")
  const [documentType, setDocumentType] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  
  const [templateStaffId, setTemplateStaffId] = useState<string>("")
  const [templateDocType, setTemplateDocType] = useState<string>("")
  const [generating, setGenerating] = useState(false)

  const [contractTemplate, setContractTemplate] = useState(placeholderTemplates.contract)
  const [payslipTemplate, setPayslipTemplate] = useState(placeholderTemplates.payslip)

  // Data Queries
  const convQuery = useMemo(() => {
    if (topicFilter !== "all") {
      return query(collection(firestore, "conversations"), where("topic", "==", topicFilter))
    }
    return query(collection(firestore, "conversations"), orderBy("timestamp", "desc"))
  }, [firestore, topicFilter])

  const { data: rawConversations, loading: convsLoading } = useCollection<Conversation>(convQuery)

  const announcementsQuery = useMemo(() => query(
    collection(firestore, "announcements"), 
    orderBy("sentAt", "desc")
  ), [firestore])
  const { data: sentAnnouncements, loading: broadcastsLoading } = useCollection<Announcement>(announcementsQuery)

  const staffQuery = useMemo(() => collection(firestore, "users"), [firestore])
  const { data: staffList } = useCollection<Staff>(staffQuery)

  const documentsQuery = useMemo(() => query(collection(firestore, "documents"), orderBy("date", "desc")), [firestore])
  const { data: documents, loading: documentsLoading } = useCollection<Document>(documentsQuery)

  const conversations = useMemo(() => {
    if (!rawConversations) return null;
    let filtered = [...rawConversations];
    if (searchQuery) {
      filtered = filtered.filter(c => c.staff_name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
  }, [rawConversations, searchQuery]);

  const selectedConv = useMemo(() => 
    conversations?.find(c => c.id === selectedConvId), 
    [conversations, selectedConvId]
  )

  useEffect(() => {
    if (!selectedConvId) {
      setMessages([])
      return
    }

    setMessagesLoading(true)
    const q = query(
      collection(firestore, "messages"),
      where("conversation_id", "==", selectedConvId)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message))
      msgs.sort((a, b) => (a.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setMessages(msgs)
      setMessagesLoading(false)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    })

    return () => unsubscribe()
  }, [firestore, selectedConvId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConvId || !user) return

    const text = newMessage
    setNewMessage("")
    try {
      await sendMessage(firestore, selectedConvId, user.uid, 'admin', text)
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastTitle || !broadcastMessage) return

    setIsBroadcasting(true)
    try {
      const rtdbRef = ref(database, 'announcements');
      await push(rtdbRef, {
        title: broadcastTitle,
        message: broadcastMessage,
        date: new Date().toISOString(),
        timestamp: rtdbTimestamp()
      });

      await addDoc(collection(firestore, "announcements"), {
        title: broadcastTitle,
        message: broadcastMessage,
        sentAt: firestoreTimestamp()
      });

      toast({
        title: "Broadcast Successful",
        description: "Sent to all staff app home screens.",
      });
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Broadcast Failed",
        description: "Verify database connection."
      });
    } finally {
      setIsBroadcasting(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaffId || !documentType || !file) {
      toast({ variant: "destructive", title: "Incomplete Form", description: "All fields are required." })
      return
    }

    setUploading(true)
    try {
        const staffMember = staffList?.find(s => s.id === selectedStaffId);
        if (staffMember) {
          const newDocument: Omit<Document, 'id'> = {
            staffId: staffMember.id,
            staffName: staffMember.name,
            type: documentType,
            fileName: file.name,
            date: new Date().toISOString().split('T')[0],
          };
          await addDocument(firestore, newDocument);
        }
        toast({ title: "Document Uploaded!", description: `${file.name} sent to ${staffMember?.name}.` })
        setSelectedStaffId("")
        setDocumentType("")
        setFile(null)
    } catch (error) {
        toast({ variant: "destructive", title: "Upload Failed" })
    } finally {
        setUploading(false)
    }
  }

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateStaffId || !templateDocType) return
    
    setGenerating(true)
    try {
        const staffMember = staffList?.find(s => s.id === templateStaffId);
        if (staffMember) {
            const docName = `${templateDocType.toLowerCase().replace(' ', '-')}-${staffMember.name.toLowerCase().split(' ').join('-')}.pdf`;
            const newDocument: Omit<Document, 'id'> = {
                staffId: staffMember.id,
                staffName: staffMember.name,
                type: templateDocType,
                fileName: docName,
                date: new Date().toISOString().split('T')[0],
            };
            await addDocument(firestore, newDocument);
            toast({ title: "Document Generated!", description: `${templateDocType} sent to ${staffMember.name}.` });
        }
        setTemplateStaffId("")
        setTemplateDocType("")
    } catch (error) {
        toast({ variant: "destructive", title: "Generation Failed" });
    } finally {
        setGenerating(false)
    }
  }

  const getTopicColor = (topic: string) => {
    switch (topic) {
      case 'Contract': return 'bg-blue-50 text-blue-700'
      case 'Payslip': return 'bg-purple-50 text-purple-700'
      case 'Leave': return 'bg-green-50 text-green-700'
      case 'Announcement': return 'bg-orange-50 text-orange-700'
      default: return 'bg-slate-50 text-slate-700'
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-2 animate-in fade-in duration-500 overflow-hidden">
      <div className="flex flex-col gap-0.5 px-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#0D47A1]">Chat Hub</h1>
        <p className="text-[#6B7280] text-[10px] font-medium uppercase tracking-wider">Messaging & Official Documents</p>
      </div>

      <Tabs defaultValue="messages" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="bg-white p-1 rounded-xl shadow-soft border border-slate-100 self-start mb-1.5 ml-1">
          <TabsTrigger value="messages" className="rounded-lg font-bold px-4 h-8 text-xs">Direct Messages</TabsTrigger>
          <TabsTrigger value="broadcasts" className="rounded-lg font-bold px-4 h-8 text-xs">Broadcasts</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg font-bold px-4 h-8 text-xs">Files & Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="flex-1 flex flex-col overflow-hidden m-0">
          <div className="flex items-center gap-3 mb-2 px-1">
            <Select value={topicFilter} onValueChange={setTopicFilter}>
              <SelectTrigger className="w-[160px] border-none shadow-soft bg-white h-8 rounded-lg text-[11px] font-bold">
                <SelectValue placeholder="Filter Topic" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Topics</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Payslip">Payslip</SelectItem>
                <SelectItem value="Leave">Leave</SelectItem>
                <SelectItem value="Announcement">Announcement</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 flex-1 overflow-hidden">
            <Card className={cn(
              "md:col-span-4 flex flex-col overflow-hidden border-none shadow-soft rounded-2xl bg-white",
              selectedConvId ? "hidden md:flex" : "flex"
            )}>
              <CardHeader className="bg-white border-b p-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input 
                    placeholder="Search staff..." 
                    className="pl-9 bg-slate-50 border-none rounded-lg h-8 text-[11px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div className="p-1 divide-y divide-slate-50">
                  {convsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-3 space-y-1.5">
                        <Skeleton className="h-3 w-1/2 rounded" />
                        <Skeleton className="h-2.5 w-3/4 rounded" />
                      </div>
                    ))
                  ) : conversations && conversations.length > 0 ? (
                    conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConvId(conv.id)}
                        className={cn(
                          "flex flex-col gap-0.5 p-3 rounded-xl cursor-pointer transition-all",
                          selectedConvId === conv.id ? "bg-primary/5 shadow-inner" : "hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{conv.staff_name}</span>
                          <span className="text-[8px] font-bold text-slate-400">
                            {conv.timestamp && formatDistanceToNow(conv.timestamp.toDate(), { addSuffix: false })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-slate-500 line-clamp-1 flex-1 pr-4">{conv.last_message}</p>
                          <Badge variant="outline" className={cn("text-[8px] px-1.5 py-0 border-none uppercase font-bold tracking-widest", getTopicColor(conv.topic))}>
                            {conv.topic}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-2">
                      <MessageSquare className="h-8 w-8 opacity-10" />
                      <p className="text-[9px] font-bold uppercase tracking-widest">No Threads Found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>

            <Card className={cn(
              "md:col-span-8 flex flex-col overflow-hidden border-none shadow-soft rounded-2xl bg-white",
              !selectedConvId ? "hidden md:flex" : "flex"
            )}>
              {selectedConv ? (
                <>
                  <CardHeader className="bg-slate-50/50 border-b p-2 px-4 flex flex-row items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSelectedConvId(null)}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20 text-[11px]">
                        {selectedConv.staff_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-xs">{selectedConv.staff_name}</h3>
                        <p className="text-[8px] font-bold text-primary uppercase tracking-widest">{selectedConv.topic} Thread</p>
                      </div>
                    </div>
                  </CardHeader>
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-3">
                      {messagesLoading ? (
                        <div className="flex flex-col gap-3">
                          <Skeleton className="h-8 w-1/3 rounded-xl rounded-tl-none" />
                          <Skeleton className="h-6 w-1/4 self-end rounded-xl rounded-tr-none" />
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex flex-col max-w-[80%] group",
                              msg.sender_role === 'admin' ? "self-end items-end ml-auto" : "self-start items-start"
                            )}
                          >
                            <div className={cn(
                              "px-3 py-1.5 rounded-xl text-[11px] leading-relaxed shadow-sm",
                              msg.sender_role === 'admin' ? "bg-primary text-white rounded-tr-none" : "bg-white border text-slate-800 rounded-tl-none"
                            )}>
                              {msg.message}
                            </div>
                            <span className="text-[7px] font-bold text-slate-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {msg.timestamp && formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true })}
                            </span>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-2 border-t">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        placeholder="Official response..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 h-9 rounded-lg bg-slate-50 border-none text-[11px]"
                      />
                      <Button type="submit" disabled={!newMessage.trim()} className="rounded-lg h-9 w-9 p-0 shadow-lg shadow-primary/20">
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-300 p-8">
                  <MessageSquare className="h-12 w-12 opacity-5 mb-2" />
                  <h3 className="text-lg font-bold text-slate-400">Secure Messaging</h3>
                  <p className="text-center text-[11px] font-medium">Select a thread to view administrative logs.</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="broadcasts" className="flex-1 overflow-hidden m-0">
          <div className="grid gap-2.5 lg:grid-cols-12 h-full">
            <Card className="lg:col-span-5 border-none shadow-soft rounded-2xl overflow-hidden bg-white flex flex-col">
              <CardHeader className="bg-[#0D47A1] text-white py-2 px-5">
                <div className="flex items-center gap-2.5">
                  <Megaphone className="h-3.5 w-3.5" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">Compose Broadcast</CardTitle>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1">
                <CardContent className="space-y-2.5 pt-3 px-5">
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Announcement Title</Label>
                    <Input 
                      placeholder="e.g. System Maintenance Tomorrow" 
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      className="h-9 rounded-lg bg-slate-50 border-slate-200 font-semibold text-[11px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Message Content</Label>
                    <Textarea 
                      placeholder="Staff will see this instantly on their app..." 
                      className="min-h-[120px] rounded-xl bg-slate-50 border-slate-200 p-3 text-[11px] leading-relaxed"
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                    />
                  </div>
                </CardContent>
              </ScrollArea>
              <CardFooter className="bg-slate-50 border-t p-2.5 px-5">
                <Button 
                  onClick={handleBroadcast} 
                  disabled={isBroadcasting}
                  className="w-full h-9 bg-[#0D47A1] rounded-lg font-bold text-xs gap-2 shadow-lg shadow-[#0D47A1]/20 hover:bg-[#0A3578]"
                >
                  <Send className="h-3 w-3" />
                  {isBroadcasting ? "Broadcasting..." : "Push to All Devices"}
                </Button>
              </CardFooter>
            </Card>

            <div className="lg:col-span-7 flex flex-col overflow-hidden">
              <h2 className="text-[11px] font-bold text-[#1A1A1A] flex items-center gap-1.5 mb-1.5 px-1 uppercase tracking-wider">
                <LucideHistory className="h-3.5 w-3.5 text-slate-400" />
                Broadcast History
              </h2>
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-2 pb-4">
                  {broadcastsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full rounded-xl" />
                      <Skeleton className="h-16 w-full rounded-xl" />
                    </div>
                  ) : sentAnnouncements?.map(ann => (
                    <Card key={ann.id} className="border-none shadow-soft rounded-xl bg-white overflow-hidden border-l-4 border-l-[#0D47A1]">
                      <CardHeader className="p-2.5 px-4 pb-0">
                        <div className="flex justify-between items-center text-[7px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                          <span className="text-[#0D47A1]">Live Broadcast</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-2 w-2" />
                            {ann.sentAt && formatDistanceToNow(ann.sentAt.toDate(), { addSuffix: true })}
                          </div>
                        </div>
                        <CardTitle className="text-[12px] font-bold text-[#1A1A1A]">{ann.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-2.5 px-4 pt-0.5 pb-2.5">
                        <p className="text-[10px] text-[#6B7280] line-clamp-2 leading-relaxed">{ann.message}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="flex-1 overflow-hidden m-0">
          <div className="grid gap-2.5 lg:grid-cols-12 h-full overflow-hidden">
            <div className="lg:col-span-4 flex flex-col gap-2.5 overflow-hidden">
              <Card className="border-none shadow-soft rounded-2xl bg-white overflow-hidden flex flex-col">
                <CardHeader className="bg-primary p-2 px-4 text-white">
                  <div className="flex items-center gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider">Create & Send</CardTitle>
                  </div>
                </CardHeader>
                <ScrollArea className="flex-1">
                  <CardContent className="p-3">
                    <Tabs defaultValue="upload">
                      <TabsList className="grid w-full grid-cols-2 mb-2 h-7">
                        <TabsTrigger value="upload" className="text-[9px] font-bold">Upload</TabsTrigger>
                        <TabsTrigger value="template" className="text-[9px] font-bold">Template</TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="m-0 space-y-2">
                        <form onSubmit={handleUploadSubmit} className="space-y-2">
                          <div className="space-y-1">
                            <Label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Select Staff</Label>
                            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                              <SelectTrigger className="h-8 rounded-lg bg-slate-50 border-none text-[10px] font-bold">
                                <SelectValue placeholder="Staff Member" />
                              </SelectTrigger>
                              <SelectContent>
                                {staffList?.filter(s => s.status === 'active').map(s => (
                                  <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Doc Type</Label>
                            <Select value={documentType} onValueChange={setDocumentType}>
                              <SelectTrigger className="h-8 rounded-lg bg-slate-50 border-none text-[10px] font-bold">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Payslip">Payslip</SelectItem>
                                <SelectItem value="Warning Letter">Warning Letter</SelectItem>
                                <SelectItem value="Contract">Contract</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">File</Label>
                            <Input type="file" onChange={handleFileChange} className="h-8 rounded-lg border-dashed text-[9px] pt-1" />
                          </div>
                          <Button disabled={uploading} className="w-full rounded-lg h-8 font-bold text-[10px] uppercase tracking-wider">
                            {uploading ? "Sending..." : "Send Document"}
                          </Button>
                        </form>
                      </TabsContent>
                      <TabsContent value="template" className="m-0 space-y-2">
                        <form onSubmit={handleGenerateSubmit} className="space-y-2">
                          <div className="space-y-1">
                            <Label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Select Staff</Label>
                            <Select value={templateStaffId} onValueChange={setTemplateStaffId}>
                              <SelectTrigger className="h-8 rounded-lg bg-slate-50 border-none text-[10px] font-bold">
                                <SelectValue placeholder="Staff Member" />
                              </SelectTrigger>
                              <SelectContent>
                                {staffList?.filter(s => s.status === 'active').map(s => (
                                  <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Template</Label>
                            <Select value={templateDocType} onValueChange={setTemplateDocType}>
                              <SelectTrigger className="h-8 rounded-lg bg-slate-50 border-none text-[10px] font-bold">
                                <SelectValue placeholder="Choose Template" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Contract">Contract</SelectItem>
                                <SelectItem value="Payslip">Payslip</SelectItem>
                                <SelectItem value="Warning Letter">Warning Letter</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button disabled={generating} className="w-full rounded-lg h-8 font-bold text-[10px] uppercase tracking-wider">
                            {generating ? "Generating..." : "Generate & Send"}
                          </Button>
                        </form>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </ScrollArea>
              </Card>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-2.5 overflow-hidden">
              <Card className="border-none shadow-soft rounded-2xl bg-white overflow-hidden flex flex-col">
                <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between p-2 px-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider">Document Registry</CardTitle>
                  </div>
                  <Badge variant="outline" className="font-bold text-[7px] tracking-widest border-none bg-slate-100">
                    {documents?.length || 0} RECORDS
                  </Badge>
                </CardHeader>
                <ScrollArea className="flex-1">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="h-8 uppercase text-[7px] tracking-widest font-bold">
                        <TableHead className="px-4">Recipient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right px-4">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={5} className="p-2"><Skeleton className="h-4 w-full" /></TableCell>
                          </TableRow>
                        ))
                      ) : documents && documents.length > 0 ? (
                        documents.map((doc) => (
                          <TableRow key={doc.id} className="h-9 hover:bg-slate-50/50">
                            <TableCell className="px-4 font-bold text-slate-900 text-[10px]">{doc.staffName}</TableCell>
                            <TableCell>
                              <Badge className="bg-slate-100 text-slate-600 border-none text-[7px] font-bold">
                                {doc.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-[8px] text-slate-500 max-w-[100px] truncate">{doc.fileName}</TableCell>
                            <TableCell className="text-[8px] font-medium text-slate-400">{doc.date}</TableCell>
                            <TableCell className="text-right px-4">
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary">
                                <Download className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">
                            No documents archived yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>

              <Card className="border-none shadow-soft rounded-2xl bg-white overflow-hidden">
                <CardHeader className="bg-slate-50 border-b p-2 px-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">System Templates</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="contract" className="border-none">
                      <AccordionTrigger className="px-4 py-2 hover:no-underline font-bold text-[11px]">Contract Template</AccordionTrigger>
                      <AccordionContent className="px-4 pb-2">
                        <Textarea value={contractTemplate} onChange={(e) => setContractTemplate(e.target.value)} className="min-h-[80px] text-[8px] font-mono mb-1.5" />
                        <Button size="sm" onClick={() => toast({ title: "Template Saved" })} className="rounded-lg h-6 text-[9px] font-bold uppercase tracking-wider">Update</Button>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="payslip" className="border-none border-t">
                      <AccordionTrigger className="px-4 py-2 hover:no-underline font-bold text-[11px]">Payslip Template</AccordionTrigger>
                      <AccordionContent className="px-4 pb-2">
                        <Textarea value={payslipTemplate} onChange={(e) => setPayslipTemplate(e.target.value)} className="min-h-[80px] text-[8px] font-mono mb-1.5" />
                        <Button size="sm" onClick={() => toast({ title: "Template Saved" })} className="rounded-lg h-6 text-[9px] font-bold uppercase tracking-wider">Update</Button>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
