
"use client"

import { UserNav } from "./user-nav"
import { NotificationsPopover } from "./notifications-popover"
import { Menu, Search, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

const navItems = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Staff", href: "/dashboard/staff" },
  { title: "Check-ins", href: "/dashboard/check-ins" },
  { title: "Leave Requests", href: "/dashboard/leave-requests" },
  { title: "Chat", href: "/dashboard/chat" },
  { title: "Documents", href: "/dashboard/documents" },
]

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()

  const getPageTitle = () => {
    const item = navItems.find(i => i.href === pathname)
    return item ? item.title : "ADMIN PORTAL"
  }

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b bg-primary text-white shadow-sm flex items-center px-4 md:px-8">
      <div className="flex items-center gap-4 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-[#0A3578] text-white border-none">
            <SheetHeader>
              <SheetTitle className="text-white text-left text-2xl font-bold mb-8">ADMIN PORTAL</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-3 rounded-lg transition-all",
                    pathname === item.href ? "bg-[#1976D2]" : "hover:bg-white/10"
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <span className="font-bold text-lg">ADMIN PORTAL</span>
      </div>

      <div className="hidden md:flex items-center gap-4 flex-1">
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
        <div className="relative ml-8 w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <Input 
            placeholder="Search..." 
            className="bg-white/10 border-none text-white placeholder:text-white/50 pl-10 h-9 focus-visible:ring-white/30" 
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-white/10"
          onClick={() => router.push('/dashboard/chat')}
          title="Chat Hub"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
        <NotificationsPopover />
        <div className="h-8 w-px bg-white/10 mx-2 hidden md:block"></div>
        <UserNav />
      </div>
    </header>
  )
}
