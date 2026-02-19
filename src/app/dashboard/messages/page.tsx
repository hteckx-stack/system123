
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
import { Send, Search, Filter, MessageSquare, Clock } from "lucide-react"
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch Conversations
  const convQuery = useMemo(() => {
    let q = query(collection(firestore, "conversations"), orderBy("timestamp", "desc"))
    if (topicFilter !== "all") {
      q = query(q, where("topic", "==", topicFilter))
    }
    return q
  }, [firestore, topicFilter])

  const { data: conversations, loading: convsLoading } = useCollection<Conversation>(convQuery)

  const selectedConv = useMemo(() => 
    conversations?.find(c => c.id === selectedConvId), 
    [conversations, selectedConvId]
  )

  // Real-time Messages Listener
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([])
      return
    }

    setMessagesLoading(true)
    const q = query(
      collection(firestore, "messages"),
      where("conversation_id", "==", selectedConvId),
      orderBy("timestamp", "asc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message))
      setMessages(msgs)
      setMessagesLoading(false)
      // Scroll to bottom
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
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Messages</h1>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-[180px] border-primary/20">
              <SelectValue placeholder="Filter by Topic" />
            </SelectTrigger>
            <SelectContent>
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

      <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
        {/* Conversations List */}
        <Card className="col-span-4 flex flex-col overflow-hidden border-primary/20 shadow-lg">
          <CardHeader className="bg-muted/30 border-b py-4">
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {convsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
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
                      "flex flex-col gap-1 p-3 rounded-lg cursor-pointer transition-all border border-transparent",
                      selectedConvId === conv.id 
                        ? "bg-primary/10 border-primary/20 shadow-sm" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary">{conv.staff_name}</span>
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getTopicColor(conv.topic))}>
                        {conv.topic}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 italic">
                      {conv.last_message}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                      <Clock className="h-2.5 w-2.5" />
                      {conv.timestamp && formatDistanceToNow(conv.timestamp.toDate(), { addSuffix: true })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No conversations found.
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Window */}
        <Card className="col-span-8 flex flex-col overflow-hidden border-primary/20 shadow-lg relative">
          {selectedConv ? (
            <>
              <CardHeader className="bg-primary/5 border-b py-3 px-6">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {selectedConv.staff_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg text-primary">{selectedConv.staff_name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      Topic: <span className="font-medium text-foreground">{selectedConv.topic}</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1 p-6 bg-slate-50/50">
                <div className="space-y-4">
                  {messagesLoading ? (
                    <div className="flex flex-col gap-4">
                      <Skeleton className="h-10 w-1/3 self-start rounded-2xl" />
                      <Skeleton className="h-10 w-1/4 self-end rounded-2xl" />
                      <Skeleton className="h-10 w-1/2 self-start rounded-2xl" />
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col max-w-[80%] gap-1",
                          msg.sender_role === 'admin' ? "self-end items-end ml-auto" : "self-start items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "px-4 py-2 rounded-2xl text-sm shadow-sm",
                            msg.sender_role === 'admin'
                              ? "bg-primary text-white rounded-tr-none"
                              : "bg-white text-foreground border border-slate-200 rounded-tl-none"
                          )}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[10px] text-muted-foreground px-1">
                          {msg.timestamp && formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true })}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 bg-white border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 border-primary/20 focus-visible:ring-primary"
                  />
                  <Button type="submit" disabled={!newMessage.trim()} className="bg-primary hover:bg-primary/90">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground p-10 bg-slate-50/30">
              <div className="bg-white p-6 rounded-full shadow-inner mb-4">
                <MessageSquare className="h-12 w-12 text-primary/30" />
              </div>
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Click on a staff member to start chatting in real time.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
