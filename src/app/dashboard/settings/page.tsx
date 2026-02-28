
"use client"

import { useState, useEffect, useMemo } from "react"
import {
  useUser,
  useFirestore,
  useDoc,
  useAuth,
} from "@/firebase"
import { doc } from "firebase/firestore"
import { updateProfile } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { updateUser } from "@/firebase/firestore/users"
import type { Staff } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { User } from "lucide-react"

export default function SettingsPage() {
  const { user, loading: userLoading } = useUser()
  const auth = useAuth()
  const firestore = useFirestore()
  const { toast } = useToast()

  const userDocRef = useMemo(
    () => (user ? doc(firestore, "users", user.uid) : null),
    [user, firestore]
  )
  const { data: userProfile, loading: profileLoading } = useDoc<Staff>(userDocRef)

  const [formData, setFormData] = useState<Partial<Staff>>({})
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (userProfile) {
      setFormData(userProfile)
    } else if (user) {
      setFormData({
        name: user.displayName || "",
        email: user.email || "",
      })
    }
  }, [userProfile, user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || !auth.currentUser) return

    setIsUpdating(true)

    try {
        const updatedFirestoreFields: Partial<Staff> = {}
        const fieldsToCompare: (keyof Staff)[] = [
            "name",
            "phone",
            "position",
            "department",
        ]

        fieldsToCompare.forEach((field) => {
            const currentValue = formData[field] ?? ""
            const originalValue = userProfile?.[field] ?? ""
            if (currentValue !== originalValue) {
            updatedFirestoreFields[field] = currentValue
            }
        })

        if (Object.keys(updatedFirestoreFields).length === 0) {
            toast({
                title: "No Changes",
                description: "You haven't made any changes to your profile.",
            })
            setIsUpdating(false)
            return
        }
        
        const authUpdates: { displayName?: string } = {}
        if (updatedFirestoreFields.name !== undefined) {
            authUpdates.displayName = updatedFirestoreFields.name
        }

        if (auth.currentUser && Object.keys(authUpdates).length > 0) {
            await updateProfile(auth.currentUser, authUpdates)
        }

        await updateUser(firestore, user.uid, updatedFirestoreFields)

        toast({
            title: "Profile Updated",
            description: "Your profile details have been successfully updated.",
        })

    } catch (error) {
        console.error("Error updating profile:", error)
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update your profile. Please try again.",
        })
    } finally {
        setIsUpdating(false)
    }
  }

  const loading = userLoading || profileLoading

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0D47A1]">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile information and contact details.
        </p>
      </div>

      <Card className="border-none shadow-soft rounded-3xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b pb-6">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-[#0D47A1]" />
            <div>
              <CardTitle className="text-xl">Profile Details</CardTitle>
              <CardDescription>
                Public identity for administrative interactions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          {loading ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 mt-6">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    disabled
                    className="h-12 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    placeholder="+260977123456"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Position</Label>
                  <Input
                    id="position"
                    name="position"
                    value={formData.position || ""}
                    onChange={handleChange}
                    placeholder="e.g. Lead Developer"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="department" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department || ""}
                    onChange={handleChange}
                    placeholder="e.g. Engineering"
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isUpdating} className="h-12 px-8 rounded-xl font-bold bg-[#0D47A1] shadow-lg shadow-primary/20 min-w-[160px]">
                  {isUpdating ? "Saving..." : "Update Profile"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
