"use client"

import type { Row } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, UserX, Send, Trash2, UserCheck } from "lucide-react"
import { Staff } from "@/lib/types"
import { useAuth, useFirestore } from "@/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { updateUser, deleteUser } from "@/firebase/firestore/users"

interface DataTableRowActionsProps<TData extends Staff> {
  row: Row<TData>
  onEdit: (staff: TData) => void
}

export function DataTableRowActions<TData extends Staff>({
  row,
  onEdit,
}: DataTableRowActionsProps<TData>) {
  const auth = useAuth()
  const firestore = useFirestore()
  const { toast } = useToast()
  const staff = row.original

  const handleResetPassword = async () => {
    if (!staff.email) {
      toast({
        variant: "destructive",
        title: "Missing Email",
        description: "This staff member does not have an email address on file.",
      })
      return
    }
    try {
      await sendPasswordResetEmail(auth, staff.email)
      toast({
        title: "Password Reset Email Sent",
        description: `An email has been sent to ${staff.email} with instructions.`,
      })
    } catch (error: any) {
      let description = "An unexpected error occurred."
      if (error.code === "auth/user-not-found") {
        description =
          "There is no user corresponding to this email address. The user may have been deleted or not signed up yet."
      }
      toast({
        variant: "destructive",
        title: "Error Sending Email",
        description,
      })
    }
  }

  const handleApprove = async () => {
    if (!staff.id) return
    try {
        await updateUser(firestore, staff.id, { status: "active" })
        toast({
          title: "Staff Approved",
          description: `${staff.name} is now an active staff member.`,
        })
    } catch {
        toast({
            variant: "destructive",
            title: "Approval Failed",
            description: "Could not approve staff member. Please try again.",
        })
    }
  }

  const handleDeactivate = async () => {
    if (!staff.id) return
    try {
        await updateUser(firestore, staff.id, { status: "inactive" })
        toast({
          title: "Staff Deactivated",
          description: `${staff.name} has been marked as inactive.`,
        })
    } catch {
        toast({
            variant: "destructive",
            title: "Deactivation Failed",
            description: "Could not deactivate staff member. Please try again.",
        })
    }
  }

  const handleDelete = async () => {
    if (!staff.id) return
    try {
        await deleteUser(firestore, staff.id)
        toast({
          variant: "destructive",
          title: "Staff Deleted",
          description: `${staff.name} has been deleted from the database.`,
        })
    } catch {
        toast({
            variant: "destructive",
            title: "Delete Failed",
            description: "Could not delete staff member. Please try again.",
        })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {staff.status === 'pending' && (
          <DropdownMenuItem onSelect={handleApprove}>
            <UserCheck className="mr-2 h-4 w-4" />
            Approve
          </DropdownMenuItem>
        )}
        {staff.status === 'active' && (
          <DropdownMenuItem onSelect={() => onEdit(row.original)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        {staff.status === 'active' && (
          <DropdownMenuItem onSelect={handleDeactivate}>
            <UserX className="mr-2 h-4 w-4" />
            Deactivate
          </DropdownMenuItem>
        )}
        {staff.status === 'inactive' && (
          <DropdownMenuItem onSelect={handleApprove}>
            <UserCheck className="mr-2 h-4 w-4" />
            Reactivate
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleResetPassword}>
          <Send className="mr-2 h-4 w-4" />
          Send Login Reset
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
