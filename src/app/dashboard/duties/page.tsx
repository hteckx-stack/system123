"use client"

import { useState, useMemo } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  FileText,
  Image,
  File,
  ArrowLeft,
  Download,
  Eye,
  Calendar,
  User,
  ChevronRight
} from "lucide-react"
import type { Duty, Staff } from "@/lib/types"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

type ViewMode = 'staff-list' | 'staff-duties' | 'duty-documents'

export default function DutiesPage() {
  const firestore = useFirestore()
  const { toast } = useToast()

  const [viewMode, setViewMode] = useState<ViewMode>('staff-list')
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedDuty, setSelectedDuty] = useState<Duty | null>(null)

  // Fetch all active users (both staff and admins)
  const userQuery = useMemo(() => query(
    collection(firestore, "users"),
    where("status", "==", "active"),
    orderBy("name")
  ), [firestore])
  const { data: userList, loading: userLoading } = useCollection<Staff>(userQuery as any)

  // Fetch all duties for counting
  const allDutiesQuery = useMemo(() => query(
    collection(firestore, "duties"),
    orderBy("created_at", "desc")
  ), [firestore])
  const { data: allDuties, loading: allDutiesLoading } = useCollection<Duty>(allDutiesQuery as any)

  // Calculate duty counts per staff
  const dutyCounts = useMemo(() => {
    if (!allDuties) return {}
    const counts: Record<string, number> = {}
    allDuties.forEach(duty => {
      counts[duty.staff_id] = (counts[duty.staff_id] || 0) + 1
    })
    return counts
  }, [allDuties])

  // Fetch duties for selected user
  const dutiesQuery = useMemo(() => {
    if (!selectedStaff) return null
    return query(
      collection(firestore, "duties"),
      where("staff_id", "==", selectedStaff.id),
      orderBy("created_at", "desc")
    )
  }, [firestore, selectedStaff])
  const { data: userDuties, loading: dutiesLoading } = useCollection<Duty>(dutiesQuery as any)

  const handleStaffClick = (staff: Staff) => {
    setSelectedStaff(staff)
    setViewMode('staff-duties')
  }

  const handleDutyClick = (duty: Duty) => {
    setSelectedDuty(duty)
    setViewMode('duty-documents')
  }

  const handleBack = () => {
    if (viewMode === 'duty-documents') {
      setSelectedDuty(null)
      setViewMode('staff-duties')
    } else if (viewMode === 'staff-duties') {
      setSelectedStaff(null)
      setViewMode('staff-list')
    }
  }

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-4 w-4" />

    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {viewMode !== 'staff-list' && (
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0D47A1]">
            {viewMode === 'staff-list' && 'Duty Submissions'}
            {viewMode === 'staff-duties' && `${selectedStaff?.name}'s Submissions`}
            {viewMode === 'duty-documents' && selectedDuty?.title}
          </h1>
          <p className="text-muted-foreground">
            {viewMode === 'staff-list' && 'View duty submissions from all staff members'}
            {viewMode === 'staff-duties' && `Browse all submitted duties from this staff member (${userDuties?.length || 0} submissions)`}
            {viewMode === 'duty-documents' && 'View all documents submitted for this duty'}
          </p>
        </div>
      </div>

      {/* Staff List View */}
      {viewMode === 'staff-list' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userLoading || allDutiesLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-none shadow-soft bg-white rounded-3xl">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : userList && userList.length > 0 ? (
            userList.map((staff) => (
              <Card
                key={staff.id}
                className="border-none shadow-soft bg-white rounded-3xl cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleStaffClick(staff)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0D47A1] rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{staff.name}</h3>
                        <p className="text-sm text-muted-foreground">{staff.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-[#0D47A1]/10 text-[#0D47A1]">
                        {dutyCounts[staff.id] || 0} duties
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Staff Members</h3>
              <p className="text-muted-foreground">No active staff members found.</p>
            </div>
          )}
        </div>
      )}

      {/* Staff Duties View */}
      {viewMode === 'staff-duties' && selectedStaff && (
        <div className="space-y-4">
          {dutiesLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-none shadow-soft bg-white rounded-3xl">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : userDuties && userDuties.length > 0 ? (
            userDuties.map((duty) => (
              <Card
                key={duty.id}
                className="border-none shadow-soft bg-white rounded-3xl cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleDutyClick(duty)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{duty.title}</h3>
                      <p className="text-muted-foreground mb-3">{duty.description}</p>
                      {duty.comments && (
                        <p className="text-sm text-blue-600 mb-3 italic">
                          "{duty.comments}"
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(duty.created_at.toDate(), 'MMM dd, yyyy hh:mm a')}
                        </div>
                        {duty.documentFileName && (
                          <div className="flex items-center gap-1">
                            {getFileIcon(duty.documentType)}
                            <span>1 document</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-4" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Submissions Yet</h3>
              <p className="text-muted-foreground">
                {selectedStaff.name} hasn't submitted any duties yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Duty Documents View */}
      {viewMode === 'duty-documents' && selectedDuty && (
        <div className="space-y-6">
          <Card className="border-none shadow-soft bg-white rounded-3xl">
            <CardHeader>
              <CardTitle>{selectedDuty.title}</CardTitle>
              <CardDescription>{selectedDuty.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Submitted by:</span> {selectedDuty.staff_name}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {format(selectedDuty.created_at.toDate(), 'MMM dd, yyyy hh:mm a')}
                  </div>
                  {selectedDuty.comments && (
                    <div className="md:col-span-2">
                      <span className="font-medium">Comments:</span>
                      <p className="mt-1 italic text-blue-600">"{selectedDuty.comments}"</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Section */}
          <Card className="border-none shadow-soft bg-white rounded-3xl">
            <CardHeader>
              <CardTitle>Submitted Documents</CardTitle>
              <CardDescription>Documents attached to this duty submission</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDuty.documentUrl ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFileIcon(selectedDuty.documentType)}
                      <div>
                        <p className="font-medium">{selectedDuty.documentFileName}</p>
                        <p className="text-sm text-muted-foreground">
                          Submitted {format(selectedDuty.created_at.toDate(), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedDuty.documentUrl!, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = selectedDuty.documentUrl!
                          link.download = selectedDuty.documentFileName || 'document'
                          link.click()
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents attached to this submission</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}