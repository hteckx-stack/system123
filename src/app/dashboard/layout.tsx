import { AppHeader } from "./_components/header"
import { AuthGuard } from "./_components/auth-guard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full flex-col">
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </AuthGuard>
  )
}
