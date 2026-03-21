"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  History as LucideHistory,
  CalendarDays,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { useState, useEffect } from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Staff Directory", href: "/dashboard/staff", icon: Users },
  { title: "Leave Requests", href: "/dashboard/leave-requests", icon: CalendarDays },
  { 
    title: "Chat Hub", 
    href: "/dashboard/chat", 
    icon: MessageSquare,
    subItems: [
        { title: "Messaging", href: "/dashboard/chat?tab=messages" },
        { title: "Broadcasts", href: "/dashboard/chat?tab=broadcasts" },
        { title: "Documents", href: "/dashboard/chat?tab=documents" },
    ]
  },
  { title: "Audit Trail", href: "/dashboard/activity", icon: LucideHistory },
]

export function Sidebar() {
  const pathname = usePathname()
  const auth = useAuth()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(pathname.startsWith("/dashboard/chat"))

  useEffect(() => {
    if (pathname.startsWith("/dashboard/chat")) {
        setIsChatOpen(true)
    }
  }, [pathname])

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
  }

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col h-screen bg-[#0A3578] text-white transition-all duration-300 relative shrink-0",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-6 flex items-center gap-3">
        <div className="bg-white text-[#0A3578] p-1.5 rounded-lg shadow-sm shrink-0">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        {!isCollapsed && <span className="text-xl font-bold tracking-tight text-white uppercase">Portal</span>}
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.subItems && pathname.startsWith(item.href))
          
          if (item.subItems) {
            return (
                <Collapsible
                    key={item.href}
                    open={isChatOpen}
                    onOpenChange={setIsChatOpen}
                    className="w-full"
                >
                    <div className={cn(
                        "flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all group cursor-pointer",
                        isActive ? "bg-[#1976D2] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}>
                        <div 
                            className="flex items-center gap-3 flex-1"
                            onClick={() => {
                                router.push(item.href)
                                if (isCollapsed) setIsCollapsed(false)
                                setIsChatOpen(true)
                            }}
                        >
                            <item.icon className={cn(
                                "h-5 w-5 shrink-0",
                                isActive ? "text-white" : "group-hover:text-white"
                            )} />
                            {!isCollapsed && <span className="font-medium text-xs font-bold uppercase tracking-wider">{item.title}</span>}
                        </div>
                        {!isCollapsed && (
                            <CollapsibleTrigger asChild>
                                <button className="p-1 hover:bg-white/10 rounded-md transition-colors">
                                    <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isChatOpen && "rotate-180")} />
                                </button>
                            </CollapsibleTrigger>
                        )}
                    </div>
                    <CollapsibleContent className="space-y-1 mt-1 px-4">
                        {!isCollapsed && item.subItems.map((sub) => {
                            return (
                                <Link
                                    key={sub.href}
                                    href={sub.href}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    {sub.title}
                                </Link>
                            )
                        })}
                    </CollapsibleContent>
                </Collapsible>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                isActive
                  ? "bg-[#1976D2] text-white shadow-lg shadow-black/10"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0",
                isActive ? "text-white" : "group-hover:text-white"
              )} />
              {!isCollapsed && <span className="font-medium text-xs font-bold uppercase tracking-wider">{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          className="flex w-full items-center gap-3 px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span className="font-bold text-xs uppercase tracking-wider">Logout</span>}
        </button>
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-[#1976D2] text-white rounded-full p-1 shadow-md hover:bg-[#1976D2]/90 focus:outline-none z-50"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  )
}
