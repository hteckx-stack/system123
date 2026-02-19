"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { collection, query, orderBy, where, onSnapshot } from "firebase/firestore"
import { useFirestore, useCollection, useUser } from "@/firebase"
import type { Conversation, Message, TopicType } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Send, Search, Filter, MessageSquare, Clock, ArrowLeft } from "lucide-react"
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

    if (topicFilter === "all") return filtered;
    return filtered.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
  }, [rawConversations, topicFilter, searchQuery]);

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
      case 'Contract': return 'bg-blue-100 text-blue-700'
      case 'Payslip': return 'bg-purple-100 text-purple-700'
      case 'Leave': return 'bg-green-100 text-green-700'
      case 'Announcement': return 'bg-orange-100 text-orange-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Communication Center</h1>
          <p className="text-[#6B7280]">Manage real-time discussions with your staff members.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 bg-white border-slate-200">
            <Filter className="h-3 w-3 mr-2 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Filter Topic</span>
          </Badge>
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-[180px] border-none shadow-soft bg-white focus:ring-accent/20 h-10 rounded-xl">
              <SelectValue placeholder="All Topics" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-xl">
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
        {/* Conversations List */}
        <Card className={cn(
          "md:col-span-4 flex flex-col overflow-hidden border-none shadow-soft rounded-2xl",
          selectedConvId ? "hidden md:flex" : "flex"
        )}>
          <CardHeader className="bg-white border-b py-4 px-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-10 bg-slate-50 border-none rounded-xl h-10 focus-visible:ring-accent/10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1">
              {convsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))
              ) : conversations && conversations.length > 0 ? (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={cn(
                      "flex flex-col gap-1 p-4 rounded-xl cursor-pointer transition-all border border-transparent",
                      selectedConvId === conv.id 
                        ? "bg-accent/10 border-accent/20 shadow-sm" 
                        : "hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1A1A1A]">{conv.staff_name}</span>
                      <span className="text-[10px] text-[#6B7280]">
                        {conv.timestamp && formatDistanceToNow(conv.timestamp.toDate(), { addSuffix: false })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-[#6B7280] line-clamp-1 flex-1">
                        {conv.last_message}
                      </p>
                      <Badge variant="outline" className={cn("text-[10px] px-2 py-0 border-none shrink-0 ml-2", getTopicColor(conv.topic))}>
                        {conv.topic}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3">
                  <MessageSquare className="h-10 w-10 text-slate-100" />
                  <p className="text-sm font-medium">No conversations found.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Window */}
        <Card className={cn(
          "md:col-span-8 flex flex-col overflow-hidden border-none shadow-soft rounded-2xl relative bg-white",
          !selectedConvId ? "hidden md:flex" : "flex"
        )}>
          {selectedConv ? (
            <>
              <CardHeader className="bg-white border-b py-4 px-6 flex flex-row items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden h-9 w-9 text-slate-600"
                  onClick={() => setSelectedConvId(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border-2 border-slate-50 shadow-sm">
                    <AvatarFallback className="bg-primary text-white font-bold">
                      {selectedConv.staff_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg text-[#1A1A1A]">{selectedConv.staff_name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      <span className="text-xs text-[#6B7280] font-medium">{selectedConv.topic} Thread</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1 p-6 bg-slate-50/30">
                <div className="space-y-6">
                  {messagesLoading ? (
                    <div className="flex flex-col gap-6">
                      <Skeleton className="h-12 w-1/3 self-start rounded-2xl rounded-tl-none" />
                      <Skeleton className="h-10 w-1/4 self-end rounded-2xl rounded-tr-none" />
                      <Skeleton className="h-16 w-1/2 self-start rounded-2xl rounded-tl-none" />
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col max-w-[85%] md:max-w-[70%] group",
                          msg.sender_role === 'admin' ? "self-end items-end ml-auto" : "self-start items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "px-4 py-3 rounded-2xl text-[14px] shadow-sm leading-relaxed",
                            msg.sender_role === 'admin'
                              ? "bg-primary text-white rounded-tr-none"
                              : "bg-white text-[#1A1A1A] border border-slate-200 rounded-tl-none"
                          )}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {msg.timestamp && formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true })}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 bg-white border-t">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <Input
                    placeholder="Type a message to staff..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 border-none bg-slate-100 rounded-xl h-11 focus-visible:ring-primary/20"
                  />
                  <Button type="submit" disabled={!newMessage.trim()} className="bg-primary hover:bg-primary/90 rounded-xl h-11 w-11 p-0 shadow-lg shadow-primary/20 shrink-0">
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 p-10">
              <div className="bg-slate-50 p-10 rounded-full mb-6 border border-slate-100">
                <MessageSquare className="h-16 w-16 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Private Messaging</h3>
              <p className="text-center max-w-sm text-sm">
                Select a conversation from the sidebar to view message history and send real-time replies.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}