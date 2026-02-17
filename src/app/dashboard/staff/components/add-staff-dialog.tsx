"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Staff } from "@/lib/types"
import { useFirestore, useStorage } from "@/firebase"
import { updateUser } from "@/firebase/firestore/users"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { doc, collection } from "firebase/firestore"

export function AddStaffDialog() {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const firestore = useFirestore()
  const storage = useStorage()
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0])
    }
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    const name = formData.get("name") as string
    if (!name) {
      toast({ variant: "destructive", title: "Name is required" })
      return
    }

    setIsCreating(true)

    try {
      const newStaffId = doc(collection(firestore, "users")).id
      let photoUrl = `https://picsum.photos/seed/${newStaffId}/100/100`

      if (photoFile) {
        const storageRef = ref(storage, `profile-pictures/${newStaffId}`)
        const snapshot = await uploadBytes(storageRef, photoFile)
        photoUrl = await getDownloadURL(snapshot.ref)
      }

      const newStaffData: Omit<Staff, "id"> = {
        name: name,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        position: formData.get("position") as string,
        department: formData.get("department") as string,
        status: "active",
        photoUrl: photoUrl,
      }

      await updateUser(firestore, newStaffId, newStaffData)

      toast({
        title: "Staff Added",
        description: `${newStaffData.name} has been added.`,
      })

      setOpen(false)
      form.reset()
      setPhotoFile(null)
    } catch (error) {
      console.error("Error creating staff:", error)
      toast({
        variant: "destructive",
        title: "Error adding staff",
        description: "Could not create staff member. Please try again.",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          // Reset state on close
          setPhotoFile(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new staff member.
          </DialogDescription>
        </DialogHeader>
        <form id="add-staff-form" onSubmit={handleFormSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" name="name" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                className="col-span-3"
                required
                placeholder="+260977123456"
                pattern="^\+260\d{9}$"
                title="Enter a valid Zambian phone number (e.g. +260977123456)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">
                Position
              </Label>
              <Input
                id="position"
                name="position"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Input
                id="department"
                name="department"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="photo" className="text-right">
                Photo
              </Label>
              <Input
                id="photo"
                name="photo"
                type="file"
                className="col-span-3"
                onChange={handleFileChange}
                accept="image/*"
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="add-staff-form" disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Staff"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
