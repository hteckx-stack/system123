
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Staff } from "@/lib/types"
import { useFirestore } from "@/firebase"
import { addUser } from "@/firebase/firestore/users"
import { useToast } from "@/hooks/use-toast"

interface AddStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddStaffDialog({ open, onOpenChange }: AddStaffDialogProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    position: "",
    department: "",
  })
  const firestore = useFirestore()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    
    try {
      const fullName = [formData.firstName, formData.middleName, formData.lastName]
        .filter(Boolean)
        .join(" ");

      const newStaffData: Omit<Staff, 'id'> = {
        name: fullName,
        phone: formData.phone,
        email: formData.email,
        position: formData.position,
        department: formData.department,
        status: 'pending',
        role: 'staff',
        approved: false,
      };

      await addUser(firestore, newStaffData)
      
      toast({
        title: "Staff Profile Created",
        description: `${fullName} has been added to the register.`,
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Could not create staff profile. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isSaving && !isOpen) {
        setFormData({ 
          firstName: "", 
          middleName: "", 
          lastName: "", 
          phone: "", 
          email: "", 
          position: "", 
          department: "" 
        });
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 border-none shadow-2xl rounded-3xl overflow-hidden">
        <DialogHeader className="bg-primary p-8 text-white">
          <DialogTitle className="text-2xl font-bold">New Staff Registration</DialogTitle>
          <DialogDescription className="text-white/70">
            Enter employee details to create their official management record.
          </DialogDescription>
        </DialogHeader>
        <form id="add-staff-form" onSubmit={handleFormSubmit} className="p-8 space-y-5 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">First Name</Label>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Jane" className="rounded-xl h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Last Name</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" className="rounded-xl h-11" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Middle Name (Optional)</Label>
            <Input id="middleName" name="middleName" value={formData.middleName} onChange={handleChange} placeholder="Maria" className="rounded-xl h-11" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="jane.doe@company.com" className="rounded-xl h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Phone</Label>
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+260..." className="rounded-xl h-11" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Position</Label>
              <Input id="position" name="position" value={formData.position} onChange={handleChange} placeholder="Officer" className="rounded-xl h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Department</Label>
              <Input id="department" name="department" value={formData.department} onChange={handleChange} placeholder="Ops" className="rounded-xl h-11" required />
            </div>
          </div>
        </form>
        <DialogFooter className="bg-slate-50 p-6 px-8 border-t flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving} className="rounded-xl font-bold">Cancel</Button>
          <Button type="submit" form="add-staff-form" disabled={isSaving} className="rounded-xl px-8 font-bold h-11">
            {isSaving ? "Registering..." : "Add to Directory"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
