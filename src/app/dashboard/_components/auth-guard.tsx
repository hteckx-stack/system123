
"use client"

import { useUser, useFirestore, useDoc } from "@/firebase"
import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import Loading from "@/app/loading"
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
    } else if (!authLoading && user && !profileLoading && profile) {
      if (!profile.approved || profile.role !== 'admin') {
         // Optionally redirect to a 'pending' or 'denied' page
         // For now we just push back to login if they aren't an admin
         router.push("/login")
      }
    }
  }, [user, authLoading, profile, profileLoading, router])

  if (authLoading || profileLoading || !user || !profile || profile.role !== 'admin') {
    return <Loading />
  }

  return <>{children}</>
}
