
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
  const [isSaving, setIsSaving] = useState(false);


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
    setIsSaving(true)

    try {
        const updatedFields: Partial<Staff> = {}
        const fieldsToCompare: (keyof Staff)[] = [
        "name",
        "phone",
        "email",
        "nrc",
        "position",
        "department",
        ]
        fieldsToCompare.forEach((field) => {
            const currentValue = formData[field] ?? ""
            const originalValue = staff[field] ?? ""
            if (currentValue !== originalValue) {
                (updatedFields as any)[field] = currentValue as string
            }
        })

        if (Object.keys(updatedFields).length > 0) {
            await updateUser(firestore, staff.id, updatedFields)
            toast({
                title: "Staff Updated",
                description: `${staff.name}'s details have been updated.`,
            })
        } else {
            toast({
                title: "No Changes",
                description: "You haven't made any changes to the staff details.",
            })
        }
        onOpenChange(false)
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update staff details. Please try again.",
        })
    } finally {
        setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="bg-primary p-8 text-white">
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription className="text-white/70">
            Update the details for this staff member.
          </DialogDescription>
        </DialogHeader>
        <form id="edit-staff-form" onSubmit={handleFormSubmit} className="p-8 space-y-4 bg-white">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Full Name</Label>
            <Input id="name" name="name" value={formData.name || ""} onChange={handleChange} className="rounded-xl h-11" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nrc" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">NRC Number</Label>
              <Input id="nrc" name="nrc" value={formData.nrc || ""} onChange={handleChange} className="rounded-xl h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Phone</Label>
              <Input id="phone" name="phone" type="tel" value={formData.phone || ""} onChange={handleChange} className="rounded-xl h-11" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email || ""} onChange={handleChange} className="rounded-xl h-11" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Position</Label>
              <Input id="position" name="position" value={formData.position || ""} onChange={handleChange} className="rounded-xl h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Department</Label>
              <Input id="department" name="department" value={formData.department || ""} onChange={handleChange} className="rounded-xl h-11" required />
            </div>
          </div>
        </form>
        <DialogFooter className="bg-slate-50 p-6 px-8 border-t flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving} className="rounded-xl font-bold">Cancel</Button>
          <Button type="submit" form="edit-staff-form" disabled={isSaving} className="rounded-xl px-8 font-bold h-11">
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
