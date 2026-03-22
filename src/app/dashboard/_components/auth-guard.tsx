"use client"

import { useUser, useFirestore, useDoc } from "@/firebase"
import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import { doc } from "firebase/firestore"
import type { Staff } from "@/lib/types"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser()
  const firestore = useFirestore()
  const router = useRouter()

  const userRef = useMemo(() => user ? doc(firestore, "users", user.uid) : null, [user, firestore])
  const { data: profile, loading: profileLoading } = useDoc<Staff>(userRef)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Non-blocking: Show content while redirecting if needed, 
  // or if user is authenticated even if profile is still loading
  if (authLoading || !user) {
    return null
  }

  return <>{children}</>
}
