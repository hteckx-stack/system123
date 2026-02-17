"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Staff } from "@/lib/types"
import { useFirestore } from "@/firebase"
import { updateUser } from "@/firebase/firestore/users"
import { useToast } from "@/hooks/use-toast"

interface EditStaffDialogProps {
  staff: Staff | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateStaff: (staff: Staff) => void
}

export function EditStaffDialog({
  staff,
  open,
  onOpenChange,
}: EditStaffDialogProps) {
  const [formData, setFormData] = useState<Partial<Staff>>({})
  const firestore = useFirestore()
  const { toast } = useToast()

  useEffect(() => {
    if (staff) {
      setFormData(staff)
    }
  }, [staff])

  if (!staff) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!staff.id) return

    const updatedFields: Partial<Staff> = {}
    // We explicitly check which fields have changed.
    const fieldsToCompare: (keyof Staff)[] = [
      "name",
      "phone",
      "email",
      "position",
      "department",
    ]
    fieldsToCompare.forEach((field) => {
      const currentValue = formData[field] ?? ""
      const originalValue = staff[field] ?? ""
      if (currentValue !== originalValue) {
        updatedFields[field] = currentValue
      }
    })

    if (Object.keys(updatedFields).length > 0) {
      try {
        await updateUser(firestore, staff.id, updatedFields)
        toast({
          title: "Staff Updated",
          description: `${staff.name}'s details have been updated.`,
        })
      } catch (error) {
        console.error("Error updating staff:", error)
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: "Could not update staff details. Please try again.",
        })
      }
    } else {
      toast({
        title: "No Changes",
        description: "You haven't made any changes to the staff details.",
      })
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>
            Update the details for this staff member.
          </DialogDescription>
        </DialogHeader>
        <form id="edit-staff-form" onSubmit={handleFormSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone || ""}
                onChange={handleChange}
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
                value={formData.email || ""}
                onChange={handleChange}
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
                value={formData.position || ""}
                onChange={handleChange}
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
                value={formData.department || ""}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="edit-staff-form">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
