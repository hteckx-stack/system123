
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserNav } from "./user-nav"
import type { NavItem } from "@/lib/types"
import {
  LayoutDashboard,
  Users,
  FileText,
  Megaphone,
  History,
  Menu,
  CalendarDays,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, variant: "ghost" },
  { title: "Staff", href: "/dashboard/staff", icon: Users, variant: "ghost" },
  { title: "Leave Requests", href: "/dashboard/leave-requests", icon: CalendarDays, variant: "ghost" },
  { title: "Messages", href: "/dashboard/messages", icon: MessageSquare, variant: "ghost" },
  { title: "Documents", href: "/dashboard/documents", icon: FileText, variant: "ghost" },
  { title: "Announcements", href: "/dashboard/announcements", icon: Megaphone, variant: "ghost" },
  { title: "Activity", href: "/dashboard/activity", icon: History, variant: "ghost" },
]

export function AppHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-primary px-4 md:px-6 text-white shadow-md">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-bold md:text-xl text-white mr-4"
        >
          <div className="bg-white text-primary p-1 rounded-md shadow-sm">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <span>BlueLink</span>
        </Link>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "transition-colors hover:text-white/80 font-medium px-2 py-1 rounded-md",
              pathname === item.href
                ? "bg-white/10 text-white"
                : "text-white/70"
            )}
          >
            {item.title}
          </Link>
        ))}
      </nav>

      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 md:hidden text-white hover:bg-white/10"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-primary border-r-white/10 text-white">
          <SheetHeader>
            <SheetTitle className="text-white text-left font-bold text-2xl mb-4">BlueLink</SheetTitle>
          </SheetHeader>
          <nav className="grid gap-4 text-lg font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 transition-colors hover:text-white px-3 py-2 rounded-md",
                  pathname === item.href
                    ? "bg-white/20 text-white"
                    : "text-white/60"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial" />
        <UserNav />
      </div>
    </header>
  )
}
