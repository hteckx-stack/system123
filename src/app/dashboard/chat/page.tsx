"use client"

import { useState, useMemo, useEffect, useRef, Suspense } from "react"
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
import { Send, Search, MessageSquare, ArrowLeft, Megaphone, Clock, History as LucideHistory, FileText, Download, Plus, User } from "lucide-react"
import { sendMessage, getOrCreateConversation } from "@/firebase/firestore/messages"
import { addDocument } from "@/firebase/firestore/documents"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

export default function ChatHubPage() {
  return (
    <Suspense fallback={<Skeleton className="w-full h-full" />}>
      <ChatHubContent />
    </Suspense>
  )
}

function ChatHubContent() {
  const firestore = useFirestore()
  const database = useDatabase()
  const { user } = useUser()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  
  const [activeTab, setActiveTab] = useState("messages")
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

  const [contractTemplate, setContractTemplate] = useState("Official Contract Template...")
  const [payslipTemplate, setPayslipTemplate] = useState("Official Payslip Template...")

  useEffect(() => {
    if (tabParam && ["messages", "broadcasts", "documents"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Data Queries
  const staffQuery = useMemo(() => query(collection(firestore, "users"), where("role", "==", "staff")), [firestore])
  const { data: staffList, loading: staffLoading } = useCollection<Staff>(staffQuery)

  const convQuery = useMemo(() => query(collection(firestore, "conversations"), orderBy("timestamp", "desc")), [firestore])
  const { data: rawConversations } = useCollection<Conversation>(convQuery)

  const filteredStaff = useMemo(() => {
    if (!staffList) return []
    let list = staffList.filter(s => s.status === 'active')
    if (searchQuery) {
      list = list.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    return list
  }, [staffList, searchQuery])

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

  const handleSelectStaff = async (staff: Staff) => {
    if (!firestore) return
    try {
      const convId = await getOrCreateConversation(firestore, staff.id, staff.name, 'General')
      setSelectedConvId(convId)
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not open chat thread." })
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConvId || !user) return

    const text = newMessage
    setNewMessage("")
    try {
      await sendMessage(firestore, selectedConvId, user.uid, 'admin', text)
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Message failed to send." })
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

      toast({ title: "Broadcast Successful", description: "Sent to all staff app home screens." });
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (error) {
      toast({ variant: "destructive", title: "Broadcast Failed" });
    } finally {
      setIsBroadcasting(false);
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaffId || !documentType || !file) return

    setUploading(true)
    try {
        const staffMember = staffList?.find(s => s.id === selectedStaffId);
        if (staffMember) {
          await addDocument(firestore, {
            staffId: staffMember.id,
            staffName: staffMember.name,
            type: documentType,
            fileName: file.name,
            date: new Date().toISOString().split('T')[0],
          });
          toast({ title: "Document Uploaded!", description: `Sent to ${staffMember.name}.` })
        }
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
            await addDocument(firestore, {
                staffId: staffMember.id,
                staffName: staffMember.name,
                type: templateDocType,
                fileName: `${templateDocType.replace(' ', '-')}.pdf`,
                date: new Date().toISOString().split('T')[0],
            });
            toast({ title: "Document Generated!", description: `Sent to ${staffMember.name}.` });
        }
        setTemplateStaffId("")
        setTemplateDocType("")
    } catch (error) {
        toast({ variant: "destructive", title: "Generation Failed" });
    } finally {
        setGenerating(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-2 animate-in fade-in duration-500 overflow-hidden">
      <div className="flex flex-col gap-0.5 px-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#0D47A1]">Chat Hub</h1>
        <p className="text-[#6B7280] text-[10px] font-medium uppercase tracking-wider">Messaging & Official Documents</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="bg-white p-1 rounded-xl shadow-soft border border-slate-100 self-start mb-1.5 ml-1">
          <TabsTrigger value="messages" className="rounded-lg font-bold px-4 h-8 text-xs">Direct Messages</TabsTrigger>
          <TabsTrigger value="broadcasts" className="rounded-lg font-bold px-4 h-8 text-xs">Broadcasts</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg font-bold px-4 h-8 text-xs">Files & Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="flex-1 flex flex-col overflow-hidden m-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 flex-1 overflow-hidden">
            <Card className={cn(
              "md:col-span-4 flex flex-col overflow-hidden border-none shadow-soft rounded-2xl bg-white",
              selectedConvId ? "hidden md:flex" : "flex"
            )}>
              <CardHeader className="bg-white border-b p-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input 
                    placeholder="Search all staff..." 
                    className="pl-9 bg-slate-50 border-none rounded-lg h-8 text-[11px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div className="p-1 divide-y divide-slate-50">
                  {staffLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="p-3 flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-3 w-1/2 rounded" />
                      </div>
                    ))
                  ) : filteredStaff.length > 0 ? (
                    filteredStaff.map((staff) => {
                        const conversation = rawConversations?.find(c => c.staff_id === staff.id);
                        return (
                            <div
                                key={staff.id}
                                onClick={() => handleSelectStaff(staff)}
                                className={cn(
                                "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                                selectedConvId === conversation?.id ? "bg-primary/5 shadow-inner" : "hover:bg-slate-50"
                                )}
                            >
                                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-primary text-[10px]">
                                    {staff.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-900 text-xs truncate">{staff.name}</span>
                                        {conversation?.timestamp && (
                                            <span className="text-[7px] font-bold text-slate-400">
                                                {formatDistanceToNow(conversation.timestamp.toDate(), { addSuffix: false })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-slate-500 truncate">{conversation?.last_message || "No recent messages"}</p>
                                </div>
                            </div>
                        )
                    })
                  ) : (
                    <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-2">
                      <User className="h-8 w-8 opacity-10" />
                      <p className="text-[9px] font-bold uppercase tracking-widest">No Staff Found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>

            <Card className={cn(
              "md:col-span-8 flex flex-col overflow-hidden border-none shadow-soft rounded-2xl bg-white",
              !selectedConvId ? "hidden md:flex" : "flex"
            )}>
              {selectedConvId ? (
                <>
                  <CardHeader className="bg-slate-50/50 border-b p-2 px-4 flex flex-row items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSelectedConvId(null)}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20 text-[11px]">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-xs">Secure Thread</h3>
                        <p className="text-[8px] font-bold text-primary uppercase tracking-widest">Administrative Log</p>
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
                  <p className="text-center text-[11px] font-medium">Select a staff member from the list to begin.</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="broadcasts" className="flex-1 overflow-hidden m-0">
          <Card className="max-w-2xl mx-auto border-none shadow-soft rounded-2xl overflow-hidden bg-white mt-4">
            <CardHeader className="bg-[#0D47A1] text-white py-4 px-6">
              <div className="flex items-center gap-3">
                <Megaphone className="h-5 w-5" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Compose Global Broadcast</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 px-8">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Announcement Title</Label>
                <Input 
                  placeholder="e.g. System Maintenance Tomorrow" 
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Message Content</Label>
                <Textarea 
                  placeholder="Staff will see this instantly on their app home screens..." 
                  className="min-h-[160px] rounded-2xl bg-slate-50 border-slate-200 p-4 text-[13px] leading-relaxed"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t p-6">
              <Button 
                onClick={handleBroadcast} 
                disabled={isBroadcasting}
                className="w-full h-12 bg-[#0D47A1] rounded-xl font-bold text-lg gap-3 shadow-lg shadow-[#0D47A1]/20 hover:bg-[#0A3578]"
              >
                <Send className="h-5 w-5" />
                {isBroadcasting ? "Broadcasting..." : "Push to All Devices"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="flex-1 overflow-hidden m-0">
          <div className="grid gap-4 max-w-4xl mx-auto mt-4">
            <Card className="border-none shadow-soft rounded-2xl bg-white overflow-hidden">
              <CardHeader className="bg-primary p-3 px-6 text-white">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">Create & Send Official Documents</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs defaultValue="upload">
                  <TabsList className="grid w-full grid-cols-2 mb-6 h-9">
                    <TabsTrigger value="upload" className="text-[11px] font-bold">Upload External File</TabsTrigger>
                    <TabsTrigger value="template" className="text-[11px] font-bold">Generate from Template</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="m-0 space-y-4">
                    <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Recipient</Label>
                        <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                          <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-[13px]">
                            <SelectValue placeholder="Choose staff member..." />
                          </SelectTrigger>
                          <SelectContent>
                            {staffList?.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Document Classification</Label>
                        <Select value={documentType} onValueChange={setDocumentType}>
                          <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-[13px]">
                            <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Payslip">Payslip</SelectItem>
                            <SelectItem value="Warning Letter">Warning Letter</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Attach PDF Document</Label>
                        <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="h-11 rounded-xl border-dashed pt-2.5" />
                      </div>
                      <Button disabled={uploading} className="md:col-span-2 rounded-xl h-12 font-bold text-lg shadow-lg shadow-primary/10">
                        {uploading ? "Sending..." : "Dispatch Document"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="template" className="m-0 space-y-4">
                    <form onSubmit={handleGenerateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Staff</Label>
                        <Select value={templateStaffId} onValueChange={setTemplateStaffId}>
                          <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-[13px]">
                            <SelectValue placeholder="Recipient..." />
                          </SelectTrigger>
                          <SelectContent>
                            {staffList?.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Template</Label>
                        <Select value={templateDocType} onValueChange={setTemplateDocType}>
                          <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-[13px]">
                            <SelectValue placeholder="Choose template..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Contract">Contract Template</SelectItem>
                            <SelectItem value="Payslip">Monthly Payslip</SelectItem>
                            <SelectItem value="Warning Letter">Official Warning</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button disabled={generating} className="md:col-span-2 rounded-xl h-12 font-bold text-lg shadow-lg shadow-primary/10">
                        {generating ? "Processing..." : "Generate & Send Instantly"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="border-none shadow-soft rounded-2xl bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 border-b p-3 px-6">
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Configure System Templates</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="contract" className="border-none px-6">
                    <AccordionTrigger className="hover:no-underline font-bold text-[13px]">Employee Contract Template</AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-3">
                      <Textarea value={contractTemplate} onChange={(e) => setContractTemplate(e.target.value)} className="min-h-[100px] text-xs font-mono" />
                      <Button size="sm" onClick={() => toast({ title: "Template Saved" })} className="rounded-lg px-6">Update Base Template</Button>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="payslip" className="border-none border-t px-6">
                    <AccordionTrigger className="hover:no-underline font-bold text-[13px]">Standard Payslip Template</AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-3">
                      <Textarea value={payslipTemplate} onChange={(e) => setPayslipTemplate(e.target.value)} className="min-h-[100px] text-xs font-mono" />
                      <Button size="sm" onClick={() => toast({ title: "Template Saved" })} className="rounded-lg px-6">Update Base Template</Button>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
