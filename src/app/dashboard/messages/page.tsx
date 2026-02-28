
"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { collection, query, orderBy, where, onSnapshot } from "firebase/firestore"
import { useFirestore, useCollection, useUser } from "@/firebase"
import type { Conversation, Message } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Send, Search, Filter, MessageSquare, ArrowLeft } from "lucide-react"
import { sendMessage } from "@/firebase/firestore/messages"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

export default function MessagesPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [topicFilter, setTopicFilter] = useState<string>("all")
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const convQuery = useMemo(() => {
    if (topicFilter !== "all") {
      return query(collection(firestore, "conversations"), where("topic", "==", topicFilter))
    }
    return query(collection(firestore, "conversations"), orderBy("timestamp", "desc"))
  }, [firestore, topicFilter])

  const { data: rawConversations, loading: convsLoading } = useCollection<Conversation>(convQuery)

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
      msgs.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
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
    <div className="flex flex-col h-[calc(100vh-10rem)] gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0D47A1]">Communication Hub</h1>
          <p className="text-[#6B7280]">Official messaging threads with staff members.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-[180px] border-none shadow-soft bg-white h-11 rounded-xl">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 overflow-hidden">
        <Card className={cn(
          "md:col-span-4 flex flex-col overflow-hidden border-none shadow-soft rounded-3xl bg-white",
          selectedConvId ? "hidden md:flex" : "flex"
        )}>
          <CardHeader className="bg-white border-b p-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search staff..." 
                className="pl-10 bg-slate-50 border-none rounded-xl h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-2 divide-y divide-slate-50">
              {convsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-2">
                    <Skeleton className="h-4 w-1/2 rounded" />
                    <Skeleton className="h-3 w-3/4 rounded" />
                  </div>
                ))
              ) : conversations && conversations.length > 0 ? (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={cn(
                      "flex flex-col gap-1 p-5 rounded-2xl cursor-pointer transition-all",
                      selectedConvId === conv.id ? "bg-primary/5 shadow-inner" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{conv.staff_name}</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {conv.timestamp && formatDistanceToNow(conv.timestamp.toDate(), { addSuffix: false })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 line-clamp-1 flex-1 pr-4">{conv.last_message}</p>
                      <Badge variant="outline" className={cn("text-[9px] px-2 py-0 border-none uppercase font-bold tracking-widest", getTopicColor(conv.topic))}>
                        {conv.topic}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3">
                  <MessageSquare className="h-10 w-10 opacity-10" />
                  <p className="text-xs font-bold uppercase tracking-widest">No Threads Found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        <Card className={cn(
          "md:col-span-8 flex flex-col overflow-hidden border-none shadow-soft rounded-3xl bg-white",
          !selectedConvId ? "hidden md:flex" : "flex"
        )}>
          {selectedConv ? (
            <>
              <CardHeader className="bg-slate-50/50 border-b p-5 flex flex-row items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConvId(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
                    {selectedConv.staff_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{selectedConv.staff_name}</h3>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{selectedConv.topic} Thread</p>
                  </div>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
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
                          "flex flex-col max-w-[80%] group",
                          msg.sender_role === 'admin' ? "self-end items-end ml-auto" : "self-start items-start"
                        )}
                      >
                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm",
                          msg.sender_role === 'admin' ? "bg-primary text-white rounded-tr-none" : "bg-white border text-slate-800 rounded-tl-none"
                        )}>
                          {msg.message}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {msg.timestamp && formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true })}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <Input
                    placeholder="Official response..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 h-12 rounded-xl bg-slate-50 border-none"
                  />
                  <Button type="submit" disabled={!newMessage.trim()} className="rounded-xl h-12 w-12 p-0 shadow-lg shadow-primary/20">
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-300 p-10">
              <MessageSquare className="h-16 w-16 opacity-5 mb-4" />
              <h3 className="text-xl font-bold text-slate-400">Secure Messaging</h3>
              <p className="text-center text-sm font-medium">Select a thread to view administrative logs.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
