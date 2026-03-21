
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
import { Send, Search, MessageSquare, ArrowLeft, Megaphone, User, Plus, FileText } from "lucide-react"
import { sendMessage, getOrCreateConversation } from "@/firebase/firestore/messages"
import { addDocument } from "@/firebase/firestore/documents"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

export default function ChatHubPage() {
  return (
    <Suspense fallback={<div className="p-4"><Skeleton className="w-full h-[400px] rounded-3xl" /></div>}>
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
  
  const [activeTab, setActiveTab] = useState(tabParam || "messages")
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

  useEffect(() => {
    if (tabParam && ["messages", "broadcasts", "documents"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Fetch ALL users in the system for chatting
  const staffQuery = useMemo(() => query(collection(firestore, "users")), [firestore])
  const { data: staffList, loading: staffLoading } = useCollection<Staff>(staffQuery)

  const convQuery = useMemo(() => query(collection(firestore, "conversations"), orderBy("timestamp", "desc")), [firestore])
  const { data: rawConversations } = useCollection<Conversation>(convQuery)

  const filteredStaff = useMemo(() => {
    if (!staffList || !user) return []
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
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-2 animate-in fade-in duration-500 overflow-hidden">
      <div className="flex flex-col gap-0 px-1 mb-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#0D47A1]">System Command Hub</h1>
        <p className="text-[#6B7280] text-[10px] font-bold uppercase tracking-widest">Unified Communications & Record Management</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="bg-white p-1 rounded-xl shadow-soft border border-slate-100 self-start mb-2 ml-1">
          <TabsTrigger value="messages" className="rounded-lg font-bold px-6 h-9 text-[11px] tracking-wide">Messaging</TabsTrigger>
          <TabsTrigger value="broadcasts" className="rounded-lg font-bold px-6 h-9 text-[11px] tracking-wide">Broadcasts</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg font-bold px-6 h-9 text-[11px] tracking-wide">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="flex-1 flex flex-col overflow-hidden m-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 overflow-hidden">
            <Card className={cn(
              "md:col-span-4 flex flex-col overflow-hidden border-none shadow-soft rounded-2xl bg-white",
              selectedConvId ? "hidden md:flex" : "flex"
            )}>
              <CardHeader className="bg-white border-b p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input 
                    placeholder="Search all employees..." 
                    className="pl-10 bg-slate-50 border-none rounded-xl h-9 text-[11px] font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div className="p-1.5 space-y-1">
                  {staffLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="p-3 flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-2 w-1/3" />
                        </div>
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
                                <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-primary text-xs shadow-sm">
                                    {staff.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-900 text-xs truncate">{staff.name}</span>
                                        {conversation?.timestamp && (
                                            <span className="text-[9px] font-bold text-slate-400">
                                                {formatDistanceToNow(conversation.timestamp.toDate(), { addSuffix: false })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 truncate font-medium">{conversation?.last_message || "Start thread..."}</p>
                                </div>
                            </div>
                        )
                    })
                  ) : (
                    <div className="text-center py-24 text-slate-300 flex flex-col items-center gap-3 opacity-50">
                      <User className="h-12 w-12" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Registry Empty</p>
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
                  <CardHeader className="bg-slate-50/50 border-b p-3 px-6 flex flex-row items-center gap-4">
                    <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSelectedConvId(null)}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20 text-[10px]">
                        {filteredStaff.find(s => s.id === rawConversations?.find(c => c.id === selectedConvId)?.staff_id)?.name.charAt(0) || "U"}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-xs">{filteredStaff.find(s => s.id === rawConversations?.find(c => c.id === selectedConvId)?.staff_id)?.name}</h3>
                        <p className="text-[8px] font-bold text-primary uppercase tracking-widest leading-none">Administrative Thread</p>
                      </div>
                    </div>
                  </CardHeader>
                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-4">
                      {messagesLoading ? (
                        <div className="flex flex-col gap-4">
                          <Skeleton className="h-12 w-1/3 rounded-2xl rounded-tl-none" />
                          <Skeleton className="h-10 w-1/4 self-end rounded-2xl rounded-tr-none" />
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
                              "px-4 py-2.5 rounded-2xl text-[12px] leading-relaxed shadow-sm",
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
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                      <Input
                        placeholder="Type a secure message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 h-10 rounded-xl bg-slate-50 border-none text-[12px] font-medium"
                      />
                      <Button type="submit" disabled={!newMessage.trim()} className="rounded-xl h-10 w-10 p-0 shadow-lg shadow-primary/20">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-300 p-10 opacity-50">
                  <MessageSquare className="h-16 w-16 mb-4" />
                  <h3 className="text-xl font-bold">Secure Messenger</h3>
                  <p className="text-center text-[11px] font-bold uppercase tracking-widest mt-2">Select an employee to begin</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="broadcasts" className="flex-1 flex flex-col m-0 pt-0">
          <Card className="max-w-xl mx-auto border-none shadow-soft rounded-3xl overflow-hidden bg-white mt-2">
            <CardHeader className="bg-[#0D47A1] text-white py-3 px-8">
              <div className="flex items-center gap-3">
                <Megaphone className="h-4 w-4" />
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest">Compose Global Broadcast</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 px-10 pb-6">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Announcement Title</Label>
                <Input 
                  placeholder="e.g. System Maintenance Tomorrow" 
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="h-9 rounded-xl bg-slate-50 border-none font-bold text-[12px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Message Content</Label>
                <Textarea 
                  placeholder="Enter details for all employee app home screens..." 
                  className="min-h-[140px] rounded-2xl bg-slate-50 border-none p-5 text-[12px] leading-relaxed"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleBroadcast} 
                disabled={isBroadcasting}
                className="w-full h-10 bg-[#0D47A1] rounded-xl font-bold text-sm gap-2 shadow-lg shadow-[#0D47A1]/20 hover:bg-[#0A3578] mt-2"
              >
                <Send className="h-4 w-4" />
                {isBroadcasting ? "Broadcasting..." : "Push to All Devices"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="flex-1 flex flex-col m-0 pt-0">
          <div className="grid gap-4 max-w-2xl mx-auto mt-2 w-full">
            <Card className="border-none shadow-soft rounded-3xl bg-white overflow-hidden">
              <CardHeader className="bg-primary p-3 px-8 text-white">
                <div className="flex items-center gap-3">
                  <Plus className="h-3 w-3" />
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest">Create & Send Official Documents</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <Tabs defaultValue="upload">
                  <TabsList className="grid w-full grid-cols-2 mb-6 h-9 bg-slate-100 rounded-xl">
                    <TabsTrigger value="upload" className="text-[9px] font-bold rounded-lg uppercase tracking-wider">Upload File</TabsTrigger>
                    <TabsTrigger value="template" className="text-[9px] font-bold rounded-lg uppercase tracking-wider">Use Template</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="m-0 space-y-5">
                    <form onSubmit={handleUploadSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 ml-1">Recipient</Label>
                          <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                            <SelectTrigger className="h-9 rounded-xl bg-slate-50 border-none text-[11px] font-bold">
                              <SelectValue placeholder="Select Staff" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {staffList?.map(s => (
                                <SelectItem key={s.id} value={s.id} className="rounded-lg">{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 ml-1">Type</Label>
                          <Select value={documentType} onValueChange={setDocumentType}>
                            <SelectTrigger className="h-9 rounded-xl bg-slate-50 border-none text-[11px] font-bold">
                              <SelectValue placeholder="Classification" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="Payslip">Payslip</SelectItem>
                              <SelectItem value="Warning Letter">Warning Letter</SelectItem>
                              <SelectItem value="Contract">Contract</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 ml-1">File Attachment</Label>
                        <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="h-10 rounded-xl border-dashed border-2 pt-1.5 text-[9px] font-medium" />
                      </div>
                      <Button disabled={uploading} className="w-full rounded-xl h-10 font-bold text-xs shadow-lg shadow-primary/10 mt-2 uppercase tracking-widest">
                        {uploading ? "Uploading..." : "Dispatch Document"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="template" className="m-0 space-y-5">
                    <form onSubmit={handleGenerateSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 ml-1">Select Staff</Label>
                          <Select value={templateStaffId} onValueChange={setTemplateStaffId}>
                            <SelectTrigger className="h-9 rounded-xl bg-slate-50 border-none text-[11px] font-bold">
                              <SelectValue placeholder="Staff Member" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {staffList?.map(s => (
                                <SelectItem key={s.id} value={s.id} className="rounded-lg">{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 ml-1">Select Template</Label>
                          <Select value={templateDocType} onValueChange={setTemplateDocType}>
                            <SelectTrigger className="h-9 rounded-xl bg-slate-50 border-none text-[11px] font-bold">
                              <SelectValue placeholder="Template type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="Contract">Standard Contract</SelectItem>
                              <SelectItem value="Payslip">Monthly Payslip</SelectItem>
                              <SelectItem value="Warning Letter">Official Warning</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button disabled={generating} className="w-full rounded-xl h-10 font-bold text-xs shadow-lg shadow-primary/10 mt-2 uppercase tracking-widest">
                        {generating ? "Generating..." : "Generate & Dispatch"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
