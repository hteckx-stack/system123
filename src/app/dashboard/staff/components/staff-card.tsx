
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
  Building2,
} from "lucide-react"
import { useAuth, useFirestore, useUser } from "@/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { updateUser, deleteUser } from "@/firebase/firestore/users"
import { logActivity } from "@/firebase/firestore/activity-logs"
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
  const { user: currentUser } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const [isMessaging, setIsMessaging] = useState(false)

  const handleResetPassword = async () => {
    if (!staff.email) {
      toast({ variant: "destructive", title: "Missing Email", description: "This staff member does not have an email." })
      return
    }
    try {
      await sendPasswordResetEmail(auth, staff.email)
      toast({ title: "Reset Sent", description: `An email has been sent to ${staff.email}.` })
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to send reset email." })
    }
  }

  const handleApprove = async () => {
    if (!staff.id || !currentUser) return
    try {
        await updateUser(firestore, staff.id, { status: "active" })
        await logActivity(
            firestore,
            currentUser.uid,
            currentUser.displayName || "Admin",
            "Staff Approved",
            `Accepted registration for ${staff.name} (${staff.email})`
        );
        toast({ title: "Registration Accepted", description: `${staff.name} is now an active member.` })
    } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to approve staff member." })
    }
  }

  const handleDeactivate = async () => {
    if (!staff.id || !currentUser) return
    try {
        await updateUser(firestore, staff.id, { status: "inactive" })
        await logActivity(
            firestore,
            currentUser.uid,
            currentUser.displayName || "Admin",
            "Staff Deactivated",
            `Deactivated account for ${staff.name}`
        );
        toast({ title: "Account Inactive", description: `${staff.name} has been marked as inactive.` })
    } catch {
         toast({ variant: "destructive", title: "Error", description: "Failed to deactivate." })
    }
  }

  const handleDelete = async () => {
    if (!staff.id || !currentUser) return
    try {
        await deleteUser(firestore, staff.id)
        await logActivity(
            firestore,
            currentUser.uid,
            currentUser.displayName || "Admin",
            "Staff Removed",
            `Rejected and deleted registration for ${staff.name}`
        );
        toast({ variant: "destructive", title: "Registration Denied", description: "Access has been denied and record removed." })
    } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to deny account." })
    }
  }

  const handleMessageStaff = async () => {
    if (!staff.id) return
    setIsMessaging(true)
    try {
      await getOrCreateConversation(firestore, staff.id, staff.name)
      router.push("/dashboard/messages")
    } catch {
      toast({ variant: "destructive", title: "Chat Error", description: "Could not open secure thread." })
    } finally {
      setIsMessaging(false)
    }
  }

  return (
    <Card className="border-none shadow-soft hover:shadow-xl transition-all duration-300 rounded-2xl group overflow-hidden bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <Avatar className="h-16 w-16 border-2 border-slate-100 shadow-sm group-hover:scale-105 transition-transform duration-300">
            <AvatarImage src={staff.photoUrl} alt={staff.name} />
            <AvatarFallback className="bg-primary/5 text-primary font-bold text-xl">
              {staff.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
                <MoreHorizontal className="h-5 w-5 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-none shadow-xl">
               {staff.status === 'pending' && (
                <DropdownMenuItem onSelect={handleApprove} className="rounded-lg font-bold text-green-600">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Accept Request
                </DropdownMenuItem>
              )}
              {staff.status === 'active' && (
                <>
                  <DropdownMenuItem onSelect={() => onEdit(staff)} className="rounded-lg">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleDeactivate} className="rounded-lg text-orange-600 focus:text-orange-600 font-medium">
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                </>
              )}
              {staff.status === 'inactive' && (
                <DropdownMenuItem onSelect={handleApprove} className="rounded-lg font-bold text-green-600">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Reactivate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleResetPassword} className="rounded-lg">
                <Send className="mr-2 h-4 w-4" />
                Login Recovery
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg font-bold">
                <Trash2 className="mr-2 h-4 w-4" />
                Reject & Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="pt-2">
          <CardTitle className="text-xl font-bold text-[#1A1A1A] truncate">{staff.name}</CardTitle>
          <CardDescription className="text-xs font-bold text-accent uppercase tracking-widest mt-0.5 truncate">{staff.position}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 p-2 rounded-lg">
          <Building2 className="h-3.5 w-3.5" />
          {staff.department}
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center text-[13px] text-[#6B7280]">
            <Phone className="mr-2.5 h-3.5 w-3.5 text-slate-300" />
            <span className="font-medium">{staff.phone || "---"}</span>
          </div>
          <div className="flex items-center text-[13px] text-[#6B7280]">
            <Mail className="mr-2.5 h-3.5 w-3.5 text-slate-300" />
            <span className="truncate font-medium">{staff.email}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-2 pt-0 border-t border-slate-50 bg-slate-50/30 p-4">
        {staff.status === 'pending' ? (
          <div className="flex w-full gap-2">
            <Button 
              size="sm" 
              className="flex-1 bg-[#22C55E] hover:bg-[#1ea34d] font-bold text-xs rounded-xl h-9 shadow-md shadow-[#22C55E]/10"
              onClick={handleApprove}
            >
              Accept
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-red-600 border-red-100 hover:bg-red-50 font-bold text-xs rounded-xl h-9"
              onClick={handleDelete}
            >
              Reject
            </Button>
          </div>
        ) : (
          <>
            <Badge
              variant="outline"
              className={cn(
                "capitalize px-3 py-0.5 border-none font-bold text-[10px] tracking-widest",
                staff.status === "active" && "bg-[#22C55E]/10 text-[#22C55E]",
                staff.status === "pending" && "bg-[#F59E0B]/10 text-[#F59E0B]",
                staff.status === "inactive" && "bg-red-50 text-red-600"
              )}
            >
              {staff.status}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 text-primary hover:text-primary hover:bg-white font-bold gap-2 bg-white/50 rounded-xl"
              onClick={handleMessageStaff}
              disabled={isMessaging}
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
