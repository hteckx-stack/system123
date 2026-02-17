"use client"

import { useState, useEffect, useMemo } from "react"
import {
  useUser,
  useFirestore,
  useDoc,
  useAuth,
  useStorage,
} from "@/firebase"
import { doc } from "firebase/firestore"
import { updateProfile } from "firebase/auth"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
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
  const storage = useStorage()
  const { toast } = useToast()

  const userDocRef = useMemo(
    () => (user ? doc(firestore, "users", user.uid) : null),
    [user, firestore]
  )
  const { data: userProfile, loading: profileLoading } = useDoc<Staff>(userDocRef)

  const [formData, setFormData] = useState<Partial<Staff>>({})
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (userProfile) {
      setFormData(userProfile)
    } else if (user) {
      // Pre-fill with auth data if no profile exists yet
      setFormData({
        name: user.displayName || "",
        email: user.email || "",
        photoUrl: user.photoURL || "",
      })
    }
  }, [userProfile, user])

  // Clean up the object URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview)
      }
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || !auth.currentUser) return

    setIsUpdating(true)

    let newPhotoUrl = formData.photoUrl

    if (photoFile) {
      try {
        const storageRef = ref(storage, `profile-pictures/${user.uid}`)
        const snapshot = await uploadBytes(storageRef, photoFile)
        newPhotoUrl = await getDownloadURL(snapshot.ref)
        setPhotoFile(null) // Reset file input state
      } catch (error) {
        console.error("Error uploading photo:", error)
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "Could not upload your new photo. Please try again.",
        })
        setIsUpdating(false)
        return
      }
    }

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

    if (newPhotoUrl && newPhotoUrl !== userProfile?.photoUrl) {
      updatedFirestoreFields.photoUrl = newPhotoUrl
    }

    if (Object.keys(updatedFirestoreFields).length === 0 && !photoFile) {
      toast({
        title: "No Changes",
        description: "You haven't made any changes to your profile.",
      })
      setIsUpdating(false)
      return
    }

    try {
      const authUpdates: { displayName?: string; photoURL?: string } = {}
      if (updatedFirestoreFields.name !== undefined) {
        authUpdates.displayName = updatedFirestoreFields.name
      }
      if (updatedFirestoreFields.photoUrl !== undefined) {
        authUpdates.photoURL = updatedFirestoreFields.photoUrl
      }

      const updatePromises: Promise<any>[] = []

      if (Object.keys(authUpdates).length > 0) {
        updatePromises.push(updateProfile(auth.currentUser, authUpdates))
      }

      updatePromises.push(updateUser(firestore, user.uid, updatedFirestoreFields))

      await Promise.all(updatePromises)

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
              <div className="space-y-2">
                <Label htmlFor="photo" className="cursor-pointer">
                  <span className="text-sm font-medium">Profile Photo</span>
                   <p className="text-sm text-muted-foreground">
                    Click the image to upload a new profile picture.
                  </p>
                  <div className="pt-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={photoPreview || formData.photoUrl || ""}
                      alt={formData.name || ""}
                    />
                    <AvatarFallback>
                      {formData.name?.charAt(0).toUpperCase() ||
                        user?.email?.charAt(0).toUpperCase() ||
                        "A"}
                    </AvatarFallback>
                  </Avatar>
                  </div>
                </Label>
                <Input
                  id="photo"
                  name="photo"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
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
                    type="tel"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    placeholder="+260977123456"
                    pattern="^\+260\d{9}$"
                    title="Enter a valid Zambian phone number (e.g. +260977123456)"
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

              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
