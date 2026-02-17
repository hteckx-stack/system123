import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./_components/sidebar"
import { AppHeader } from "./_components/header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 p-4 sm:px-6 sm:py-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
