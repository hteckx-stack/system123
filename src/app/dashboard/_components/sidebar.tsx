"use client"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { NavItem } from "@/lib/types"
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Megaphone, 
  History, 
  LogOut 
} from "lucide-react"

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, variant: "default" },
  { title: "Staff", href: "/dashboard/staff", icon: Users, variant: "ghost" },
  { title: "Documents", href: "/dashboard/documents", icon: FileText, variant: "ghost" },
  { title: "Announcements", href: "/dashboard/announcements", icon: Megaphone, variant: "ghost" },
  { title: "Activity", href: "/dashboard/activity", icon: History, variant: "ghost" },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="h-14 items-center">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-sidebar-primary"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
              fill="currentColor"
            />
            <path
              d="M12.5 12.5H17v-1h-4.5V7H11v5.5H7v1h4V17h1.5v-4.5z"
              fill="currentColor"
            />
          </svg>
          <span className="group-data-[collapsible=icon]:hidden">BlueLink</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  asChild
                  variant={item.variant}
                  isActive={pathname === item.href}
                  tooltip={item.title}
                >
                  <span>
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Separator className="my-2" />
        <SidebarMenu>
          <SidebarMenuItem>
             <Link href="/login" passHref>
              <SidebarMenuButton asChild variant="ghost" tooltip="Logout">
                <span>
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
