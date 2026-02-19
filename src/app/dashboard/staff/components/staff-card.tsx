
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
  Trash2,
  UserCheck,
  MessageSquare,
} from "lucide-react"
import { useAuth, useFirestore } from "@/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { updateUser, deleteUser } from "@/firebase/firestore/users"
import { useRouter } from "next/navigation"
import { getOrCreateConversation } from "@/firebase/firestore/messages"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface StaffCardProps {
  staff: Staff
  onEdit: (staff: Staff) => void
}

export function StaffCard({ staff, onEdit }: StaffCardProps) {
  const auth = useAuth()
  const firestore = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const [isMessaging, setIsMessaging] = useState(false)

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
    } catch (error) {
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
    } catch(error) {
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
    } catch(error) {
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "Could not delete staff member. Please try again.",
        })
    }
  }

  const handleMessageStaff = async () => {
    if (!staff.id) return
    setIsMessaging(true)
    try {
      await getOrCreateConversation(firestore, staff.id, staff.name)
      router.push("/dashboard/messages")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Chat Error",
        description: "Could not open conversation. Please try again.",
      })
    } finally {
      setIsMessaging(false)
    }
  }

  return (
    <Card className="border-primary/20 hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-primary/10">
              <AvatarImage src={staff.photoUrl} alt={staff.name} />
              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                {staff.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg text-primary">{staff.name}</CardTitle>
              <CardDescription className="text-xs">{staff.position}</CardDescription>
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
               {staff.status === 'pending' && (
                <DropdownMenuItem onSelect={handleApprove}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Approve
                </DropdownMenuItem>
              )}
              {staff.status === 'active' && (
                <>
                  <DropdownMenuItem onSelect={() => onEdit(staff)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleDeactivate}>
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                </>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm font-semibold text-primary/80">
          {staff.department}
        </div>
        <div className="space-y-1">
          <div className="flex items-center text-xs text-muted-foreground">
            <Phone className="mr-2 h-3 w-3" />
            <span>{staff.phone || "No phone"}</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Mail className="mr-2 h-3 w-3" />
            <span className="truncate">{staff.email}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-2">
        <Badge
          variant={staff.status === "active" ? "secondary" : staff.status === "pending" ? "outline" : "destructive"}
          className={cn(
            "capitalize",
            staff.status === "active" && "bg-green-100 text-green-800 hover:bg-green-100",
            staff.status === "pending" && "border-yellow-500/50 text-yellow-700 bg-yellow-50 hover:bg-yellow-50"
          )}
        >
          {staff.status}
        </Badge>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-primary hover:text-primary hover:bg-primary/10 gap-2"
          onClick={handleMessageStaff}
          disabled={isMessaging}
        >
          <MessageSquare className="h-4 w-4" />
          Message
        </Button>
      </CardFooter>
    </Card>
  )
}
