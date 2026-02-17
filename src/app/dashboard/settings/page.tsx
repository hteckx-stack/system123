
"use client"

import { useState, useEffect } from "react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
  const { user, loading: userLoading } = useUser()
  const auth = useAuth()
  const firestore = useFirestore()
  const { toast } = useToast()

  const userDocRef = user ? doc(firestore, "users", user.uid) : null
  const { data: userProfile, loading: profileLoading } = useDoc<Staff>(userDocRef)

  const [formData, setFormData] = useState<Partial<Staff>>({})

  useEffect(() => {
    if (userProfile) {
      setFormData(userProfile)
    } else if (user) {
      // Pre-fill with auth data if no profile exists
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

    const updatedFields: Partial<Staff> = {}
    // Compare form data with the initial profile data to find changes
    Object.keys(formData).forEach((key) => {
      const formValue = formData[key as keyof Staff]
      const profileValue = userProfile ? userProfile[key as keyof Staff] : undefined
      if (formValue !== profileValue && (formValue || profileValue !== undefined)) {
        updatedFields[key as keyof Staff] = formValue
      }
    });

    if (Object.keys(updatedFields).length > 0) {
      // 1. Update Firestore document
      updateUser(firestore, user.uid, updatedFields)

      // 2. Update Firebase Auth profile
      const authUpdates: { displayName?: string; photoURL?: string } = {}
      if (updatedFields.name) {
        authUpdates.displayName = updatedFields.name
      }
      if (updatedFields.photoUrl) {
        authUpdates.photoURL = updatedFields.photoUrl
      }

      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(auth.currentUser, authUpdates)
      }

      toast({
        title: "Profile Updated",
        description: "Your profile details have been successfully updated.",
      })
    } else {
      toast({
        title: "No Changes",
        description: "You haven't made any changes to your profile.",
        variant: "default",
      })
    }
  }

  const loading = userLoading || profileLoading

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and profile information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            This is how others will see you on the site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 mt-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={formData.photoUrl || ""}
                    alt={formData.name || ""}
                  />
                  <AvatarFallback>
                    {formData.name?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase() ||
                      "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="w-full space-y-2">
                   <Label htmlFor="photoUrl">Photo URL</Label>
                   <Input 
                     id="photoUrl" 
                     name="photoUrl" 
                     value={formData.photoUrl || ""} 
                     onChange={handleChange}
                     placeholder="https://example.com/photo.jpg"
                    />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    placeholder="e.g. +1-202-555-0184"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    name="position"
                    value={formData.position || ""}
                    onChange={handleChange}
                    placeholder="e.g. Lead Developer"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department || ""}
                    onChange={handleChange}
                    placeholder="e.g. Engineering"
                  />
                </div>
              </div>

              <Button type="submit">Save Changes</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
