"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  FileText,
  Megaphone,
  History,
  CalendarDays,
  MessageSquare,
  Clock,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { useState } from "react"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Staff", href: "/dashboard/staff", icon: Users },
  { title: "Check-ins", href: "/dashboard/check-ins", icon: Clock },
  { title: "Leave Requests", href: "/dashboard/leave-requests", icon: CalendarDays },
  { title: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { title: "Documents", href: "/dashboard/documents", icon: FileText },
  { title: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
  { title: "Activity", href: "/dashboard/activity", icon: History },
]

export function Sidebar() {
  const pathname = usePathname()
  const auth = useAuth()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
  }

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col h-screen bg-[#0A3578] text-white transition-all duration-300 relative",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-6 flex items-center gap-3">
        <div className="bg-white text-primary p-1.5 rounded-lg shadow-sm shrink-0">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        {!isCollapsed && <span className="text-xl font-bold tracking-tight">EMPLOYEE APP</span>}
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
              pathname === item.href
                ? "bg-[#1976D2] text-white shadow-lg shadow-black/10"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 shrink-0",
              pathname === item.href ? "text-white" : "group-hover:text-white"
            )} />
            {!isCollapsed && <span className="font-medium">{item.title}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Button
          variant="ghost"
          className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 gap-3 px-3"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </Button>
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-accent text-white rounded-full p-1 shadow-md hover:bg-accent/90 focus:outline-none"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  )
}
