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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Staff } from "@/lib/types"

export function AddStaffDialog({ onAddStaff }: { onAddStaff: (staff: Omit<Staff, 'id' | 'status' | 'photoUrl'>) => void }) {
  const [open, setOpen] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [credentials, setCredentials] = useState({ phone: "", password: "" })
  const { toast } = useToast()

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const phone = formData.get("phone") as string
    
    const newStaffData = {
        name: formData.get("name") as string,
        phone: phone,
        email: formData.get("email") as string,
        position: formData.get("position") as string,
        department: formData.get("department") as string,
    }
    
    onAddStaff(newStaffData)
    
    const tempPassword = `Temp@${Math.floor(1000 + Math.random() * 9000)}`
    
    setCredentials({ phone, password: tempPassword })
    setOpen(false)
    setShowCredentials(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Credentials copied to clipboard.",
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
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
              Fill in the details below. A temporary password will be generated.
            </DialogDescription>
          </DialogHeader>
          <form id="add-staff-form" onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" name="name" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">Phone</Label>
                <Input id="phone" name="phone" type="tel" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" name="email" type="email" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="position" className="text-right">Position</Label>
                <Input id="position" name="position" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">Department</Label>
                <Input id="department" name="department" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="photo" className="text-right">Photo</Label>
                <Input id="photo" type="file" className="col-span-3" />
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button type="submit" form="add-staff-form">Create Staff</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCredentials} onOpenChange={setShowCredentials}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Staff Created Successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              Share these credentials with the new staff member to log into the mobile app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 my-4">
            <div className="space-y-1">
              <Label>Phone Number</Label>
              <div className="flex items-center gap-2">
                <Input value={credentials.phone} readOnly />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(credentials.phone)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Temporary Password</Label>
              <div className="flex items-center gap-2">
                <Input value={credentials.password} readOnly />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(credentials.password)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowCredentials(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
