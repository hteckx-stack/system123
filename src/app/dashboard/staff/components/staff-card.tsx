"use client"

import type { Staff } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Edit,
  UserX,
  Send,
  Phone,
  Mail,
} from "lucide-react"
import { useAuth, useFirestore } from "@/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { updateUser } from "@/firebase/firestore/users"

interface StaffCardProps {
  staff: Staff
  onEdit: (staff: Staff) => void
}

export function StaffCard({ staff, onEdit }: StaffCardProps) {
  const auth = useAuth()
  const firestore = useFirestore()
  const { toast } = useToast()

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

  const handleDeactivate = () => {
    if (!staff.id) return
    updateUser(firestore, staff.id, { status: "inactive" })
    toast({
      title: "Staff Deactivated",
      description: `${staff.name} has been marked as inactive.`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={staff.photoUrl} alt={staff.name} />
              <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{staff.name}</CardTitle>
              <CardDescription>{staff.position}</CardDescription>
            </div>
          </div>
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
              <DropdownMenuItem onSelect={() => onEdit(staff)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleDeactivate}>
                <UserX className="mr-2 h-4 w-4" />
                Deactivate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleResetPassword}>
                <Send className="mr-2 h-4 w-4" />
                Send Login Reset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{staff.department}</p>
        </div>
        <div className="flex items-center text-sm">
          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{staff.phone}</span>
        </div>
        <div className="flex items-center text-sm">
          <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{staff.email}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Badge
          variant={staff.status === "active" ? "secondary" : "destructive"}
          className={
            staff.status === "active"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : ""
          }
        >
          {staff.status}
        </Badge>
      </CardFooter>
    </Card>
  )
}
