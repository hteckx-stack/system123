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
import { cn } from "@/lib/utils"

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
      // Concatenate names for the backend
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
        photoUrl: `https://picsum.photos/seed/${formData.email}/100/100`
      };

      await addUser(firestore, newStaffData)
      
      toast({
        title: "Staff Added",
        description: `${fullName} has been added. They will still need to sign up with ${formData.email} to create an account.`,
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Add Staff",
        description: "Could not add staff member. Please try again.",
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
          <DialogTitle className="text-2xl font-bold">Add New Staff Member</DialogTitle>
          <DialogDescription className="text-white/70">
            Create a new staff profile. Names will be combined for the global directory.
          </DialogDescription>
        </DialogHeader>
        <form id="add-staff-form" onSubmit={handleFormSubmit} className="p-8 space-y-5 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Jane"
                className="rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-primary/20 h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                className="rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-primary/20 h-11"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="middleName" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
              Middle Name <span className="text-slate-300 font-normal italic">(Optional)</span>
            </Label>
            <Input
              id="middleName"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              placeholder="Maria"
              className="rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-primary/20 h-11"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jane.doe@company.com"
                className="rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-primary/20 h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+260977123456"
                pattern="^\+260\d{9}$"
                title="Enter a valid Zambian phone number (e.g. +260977123456)"
                className="rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-primary/20 h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                Position
              </Label>
              <Input
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="Project Manager"
                className="rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-primary/20 h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                Department
              </Label>
              <Input
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Operations"
                className="rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-primary/20 h-11"
                required
              />
            </div>
          </div>
        </form>
        <DialogFooter className="bg-slate-50 p-6 px-8 border-t flex items-center justify-end gap-3">
           <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="rounded-xl text-slate-500 hover:bg-slate-200/50 font-bold"
          >
            Cancel
          </Button>
          <Button type="submit" form="add-staff-form" disabled={isSaving} className="rounded-xl px-8 font-bold shadow-lg shadow-primary/20 h-11">
            {isSaving ? "Creating Account..." : "Add Staff Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}