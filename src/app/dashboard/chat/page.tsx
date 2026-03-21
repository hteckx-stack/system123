"use client"

import { useState, useMemo, useEffect, useRef, Suspense } from "react"
import { collection, query, orderBy, where, onSnapshot, addDoc, serverTimestamp as firestoreTimestamp } from "firebase/firestore"
import { ref, push, serverTimestamp as rtdbTimestamp } from "firebase/database"
import { useFirestore, useCollection, useUser, useDatabase } from "@/firebase"
import type { Conversation, Message, Staff } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Send, Search, MessageSquare, ArrowLeft, Megaphone, User, Plus } from "lucide-react"
import { sendMessage, getOrCreateConversation } from "@/firebase/firestore/messages"
import { addDocument } from "@/firebase/firestore/documents"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

export default function ChatHubPage() {
  return (
    <Suspense fallback={<Skeleton className="w-full h-[600px] rounded-3xl" />}>
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

  const [contractTemplate, setContractTemplate] = useState("Official Contract Template Content...")
  const [payslipTemplate, setPayslipTemplate] = useState("Official Payslip Template Content...")

  useEffect(() => {
    if (tabParam && ["messages", "broadcasts", "documents"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Data Queries: Fetch ALL users so the list is never empty
  const staffQuery = useMemo(() => query(collection(firestore, "users")), [firestore])
  const { data: staffList, loading: staffLoading } = useCollection<Staff>(staffQuery)

  const convQuery = useMemo(() => query(collection(firestore, "conversations"), orderBy("timestamp", "desc")), [firestore])
  const { data: rawConversations } = useCollection<Conversation>(convQuery)

  const filteredStaff = useMemo(() => {
    if (!staffList || !user) return []
    // Show all users except the current user
    let list = staffList.filter(s => s.id !== user.uid)
    if (searchQuery) {
      list = list.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    return list
  }, [staffList, searchQuery, user])

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
      msgs.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
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
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-3 animate-in fade-in duration-500 overflow-hidden">
      <div className="flex flex-col gap-0.5 px-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#0D47A1]">Command Hub</h1>
        <p className="text-[#6B7280] text-[10px] font-bold uppercase tracking-widest">Secure Messaging & Official Dispatch</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="bg-white p-1 rounded-xl shadow-soft border border-slate-100 self-start mb-2 ml-1">
          <TabsTrigger value="messages" className="rounded-lg font-bold px-5 h-9 text-[11px]">Direct Messages</TabsTrigger>
          <TabsTrigger value="broadcasts" className="rounded-lg font-bold px-5 h-9 text-[11px]">Global Broadcast</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg font-bold px-5 h-9 text-[11px]">Files & Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="flex-1 flex flex-col overflow-hidden m-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 overflow-hidden">
            <Card className={cn(
              "md:col-span-4 flex flex-col overflow-hidden border-none shadow-soft rounded-2xl bg-white",
              selectedConvId ? "hidden md:flex" : "flex"
            )}>
              <CardHeader className="bg-white border-b p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input 
                    placeholder="Search all employees..." 
                    className="pl-9 bg-slate-50 border-none rounded-lg h-9 text-[11px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div className="p-1.5 divide-y divide-slate-50">
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
                                <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-primary text-[11px]">
                                    {staff.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-900 text-xs truncate">{staff.name}</span>
                                        {conversation?.timestamp && (
                                            <span className="text-[8px] font-bold text-slate-400">
                                                {formatDistanceToNow(conversation.timestamp.toDate(), { addSuffix: false })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                      <p className="text-[10px] text-slate-500 truncate">{conversation?.last_message || "Start conversation..."}</p>
                                      {staff.status === 'pending' && <span className="text-[7px] font-bold text-orange-500 uppercase tracking-widest bg-orange-50 px-1.5 rounded">Pending</span>}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                  ) : (
                    <div className="text-center py-24 text-slate-400 flex flex-col items-center gap-3">
                      <User className="h-10 w-10 opacity-5" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">No Contacts Found</p>
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
                  <CardHeader className="bg-slate-50/50 border-b p-3 px-5 flex flex-row items-center gap-4">
                    <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSelectedConvId(null)}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20 text-[12px]">
                        {filteredStaff.find(s => s.id === rawConversations?.find(c => c.id === selectedConvId)?.staff_id)?.name.charAt(0) || "U"}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Secure Thread</h3>
                        <p className="text-[8px] font-bold text-primary uppercase tracking-widest">Administrative Channel</p>
                      </div>
                    </div>
                  </CardHeader>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messagesLoading ? (
                        <div className="flex flex-col gap-4">
                          <Skeleton className="h-10 w-1/3 rounded-xl rounded-tl-none" />
                          <Skeleton className="h-8 w-1/4 self-end rounded-xl rounded-tr-none" />
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex flex-col max-w-[85%] group",
                              msg.sender_role === 'admin' ? "self-end items-end ml-auto" : "self-start items-start"
                            )}
                          >
                            <div className={cn(
                              "px-4 py-2 rounded-2xl text-[12px] leading-relaxed shadow-sm",
                              msg.sender_role === 'admin' ? "bg-primary text-white rounded-tr-none" : "bg-white border text-slate-800 rounded-tl-none"
                            )}>
                              {msg.message}
                            </div>
                            <span className="text-[8px] font-bold text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {msg.timestamp && formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true })}
                            </span>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-3 border-t">
                    <form onSubmit={handleSendMessage} className="flex gap-2.5">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 h-11 rounded-xl bg-slate-50 border-none text-[12px]"
                      />
                      <Button type="submit" disabled={!newMessage.trim()} className="rounded-xl h-11 w-11 p-0 shadow-lg shadow-primary/20">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-300 p-10">
                  <MessageSquare className="h-16 w-16 opacity-5 mb-3" />
                  <h3 className="text-xl font-bold text-slate-400">Secure Messenger</h3>
                  <p className="text-center text-[12px] font-medium text-slate-400">Select an employee from the registry to begin communication.</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="broadcasts" className="flex-1 overflow-auto m-0">
          <Card className="max-w-2xl mx-auto border-none shadow-soft rounded-3xl overflow-hidden bg-white mt-1">
            <CardHeader className="bg-[#0D47A1] text-white py-5 px-8">
              <div className="flex items-center gap-3">
                <Megaphone className="h-6 w-6" />
                <CardTitle className="text-base font-bold uppercase tracking-wider">Compose Global Broadcast</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-7 px-10">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Announcement Title</Label>
                <Input 
                  placeholder="e.g. System Maintenance Tomorrow" 
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Message Content</Label>
                <Textarea 
                  placeholder="Enter details for all employee app home screens..." 
                  className="min-h-[180px] rounded-2xl bg-slate-50 border-slate-200 p-5 text-[14px] leading-relaxed"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t p-8">
              <Button 
                onClick={handleBroadcast} 
                disabled={isBroadcasting}
                className="w-full h-14 bg-[#0D47A1] rounded-2xl font-bold text-lg gap-3 shadow-lg shadow-[#0D47A1]/20 hover:bg-[#0A3578]"
              >
                <Send className="h-5 w-5" />
                {isBroadcasting ? "Processing..." : "Push to All Devices"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="flex-1 overflow-auto m-0">
          <div className="grid gap-4 max-w-4xl mx-auto mt-1">
            <Card className="border-none shadow-soft rounded-3xl bg-white overflow-hidden">
              <CardHeader className="bg-primary p-4 px-8 text-white">
                <div className="flex items-center gap-3">
                  <Plus className="h-5 w-5" />
                  <CardTitle className="text-base font-bold uppercase tracking-wider">Create & Dispatch Documents</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <Tabs defaultValue="upload">
                  <TabsList className="grid w-full grid-cols-2 mb-8 h-10 bg-slate-100 rounded-xl">
                    <TabsTrigger value="upload" className="text-[11px] font-bold rounded-lg">Upload External File</TabsTrigger>
                    <TabsTrigger value="template" className="text-[11px] font-bold rounded-lg">Generate from Template</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="m-0 space-y-5">
                    <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Select Recipient</Label>
                        <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-[13px]">
                            <SelectValue placeholder="Staff Member" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {staffList?.map(s => (
                              <SelectItem key={s.id} value={s.id} className="rounded-lg">{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Classification</Label>
                        <Select value={documentType} onValueChange={setDocumentType}>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-[13px]">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Payslip">Payslip</SelectItem>
                            <SelectItem value="Warning Letter">Warning Letter</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Attach PDF</Label>
                        <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="h-12 rounded-xl border-dashed border-2 pt-3" />
                      </div>
                      <Button disabled={uploading} className="md:col-span-2 rounded-2xl h-14 font-bold text-lg shadow-lg shadow-primary/10">
                        {uploading ? "Uploading..." : "Dispatch Document"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="template" className="m-0 space-y-5">
                    <form onSubmit={handleGenerateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Target Recipient</Label>
                        <Select value={templateStaffId} onValueChange={setTemplateStaffId}>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-[13px]">
                            <SelectValue placeholder="Choose employee" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {staffList?.map(s => (
                              <SelectItem key={s.id} value={s.id} className="rounded-lg">{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">System Template</Label>
                        <Select value={templateDocType} onValueChange={setTemplateDocType}>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-[13px]">
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Contract">Standard Contract</SelectItem>
                            <SelectItem value="Payslip">Monthly Payslip</SelectItem>
                            <SelectItem value="Warning Letter">Official Warning</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button disabled={generating} className="md:col-span-2 rounded-2xl h-14 font-bold text-lg shadow-lg shadow-primary/10">
                        {generating ? "Generating..." : "Generate & Send Instantly"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="border-none shadow-soft rounded-3xl bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 border-b p-4 px-8">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Template Master Configuration</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="contract" className="border-none px-8">
                    <AccordionTrigger className="hover:no-underline font-bold text-[13px]">Employee Contract Master</AccordionTrigger>
                    <AccordionContent className="pb-5 space-y-3">
                      <Textarea value={contractTemplate} onChange={(e) => setContractTemplate(e.target.value)} className="min-h-[120px] text-xs font-mono bg-slate-50 border-none rounded-xl p-4" />
                      <Button size="sm" onClick={() => toast({ title: "Template Updated" })} className="rounded-xl px-6 font-bold h-10">Save Changes</Button>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="payslip" className="border-none border-t px-8">
                    <AccordionTrigger className="hover:no-underline font-bold text-[13px]">Payslip Layout Master</AccordionTrigger>
                    <AccordionContent className="pb-5 space-y-3">
                      <Textarea value={payslipTemplate} onChange={(e) => setPayslipTemplate(e.target.value)} className="min-h-[120px] text-xs font-mono bg-slate-50 border-none rounded-xl p-4" />
                      <Button size="sm" onClick={() => toast({ title: "Template Updated" })} className="rounded-xl px-6 font-bold h-10">Save Changes</Button>
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