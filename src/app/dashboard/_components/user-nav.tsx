"use client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth, useDoc, useFirestore, useUser } from "@/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { doc } from "firebase/firestore"
import type { Staff } from "@/lib/types"

export function UserNav() {
  const { user } = useUser()
  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()

  const userDocRef = useMemo(
    () => (user ? doc(firestore, "users", user.uid) : null),
    [user, firestore]
  )
  const { data: userProfile } = useDoc<Staff>(userDocRef as any)

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
  }

  const displayName = userProfile?.name || user?.displayName || "Admin"
  const displayEmail = userProfile?.email || user?.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-white text-primary font-bold">
              {displayName?.[0].toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 rounded-xl border-none shadow-2xl" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none text-slate-900">{displayName}</p>
            <p className="text-xs leading-none text-slate-500 font-medium">
              {displayEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="p-1">
          <DropdownMenuItem onSelect={() => router.push("/dashboard/settings")} className="rounded-lg font-medium">
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="p-1">
          <DropdownMenuItem onClick={handleLogout} className="rounded-lg font-bold text-red-600 focus:text-red-700 focus:bg-red-50">
            Log out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
