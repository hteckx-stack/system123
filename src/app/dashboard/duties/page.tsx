"use client"

import { useState, useMemo, useRef } from "react"
import { useFirestore, useStorage, useCollection, useUser } from "@/firebase"
import { collection, query, orderBy, where } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  Upload,
  FileText,
  Image,
  File,
  X,
  Plus,
  Download,
  Eye,
  Calendar,
  User
} from "lucide-react"
import { createDuty } from "@/firebase/firestore/duties"
import { uploadFileToStorage } from "@/firebase/storage/upload"
import type { Duty, Staff } from "@/lib/types"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function DutiesPage() {
  const firestore = useFirestore()
  const storage = useStorage()
  const { user: currentUser } = useUser()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [selectedStaffId, setSelectedStaffId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [comments, setComments] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Fetch staff members
  const staffQuery = useMemo(() => query(
    collection(firestore, "users"),
    where("status", "==", "active"),
    where("role", "==", "staff")
  ), [firestore])
  const { data: staffList } = useCollection<Staff>(staffQuery as any)

  // Fetch duties
  const dutiesQuery = useMemo(() => query(
    collection(firestore, "duties"),
    orderBy("created_at", "desc")
  ), [firestore])
  const { data: duties, loading } = useCollection<Duty>(dutiesQuery as any)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ]

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF, Word, Excel, or image file.",
          variant: "destructive"
        })
        return
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive"
        })
        return
      }

      setSelectedFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStaffId || !title || !description || !currentUser) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    try {
      let documentUrl = null
      let documentFileName = null
      let documentType = null

      // Upload file if selected
      if (selectedFile) {
        const timestamp = Date.now()
        const fileExtension = selectedFile.name.split('.').pop()
        const fileName = `${timestamp}_${selectedFile.name}`
        const filePath = `duties/${selectedStaffId}/${fileName}`

        // Upload to Firebase Storage
        const storageRef = ref(storage, filePath)
        const snapshot = await uploadBytes(storageRef, selectedFile)
        documentUrl = await getDownloadURL(snapshot.ref)
        documentFileName = selectedFile.name
        documentType = selectedFile.type
      }

      // Get selected staff member
      const selectedStaff = staffList?.find(s => s.id === selectedStaffId)

      if (!selectedStaff) {
        throw new Error("Selected staff member not found")
      }

      // Create duty record
      await createDuty(
        firestore,
        selectedStaffId,
        selectedStaff.name,
        title,
        description,
        documentUrl,
        documentFileName,
        documentType,
        comments || undefined
      )

      // Reset form
      setSelectedStaffId("")
      setTitle("")
      setDescription("")
      setComments("")
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      toast({
        title: "Duty created successfully",
        description: `Duty assigned to ${selectedStaff.name}`,
      })

    } catch (error) {
      console.error("Error creating duty:", error)
      toast({
        title: "Error creating duty",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0D47A1]">Duties Management</h1>
        <p className="text-muted-foreground">
          Assign tasks and documents to staff members with file attachments.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Duty Form */}
        <Card className="border-none shadow-soft bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-xl">Create New Duty</CardTitle>
            <CardDescription>
              Assign a task with optional document attachment to a staff member.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Staff Selection */}
              <div className="space-y-2">
                <Label htmlFor="staff">Select Staff Member *</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList?.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} - {staff.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Task Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the task requirements"
                  rows={3}
                  required
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Document Attachment (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                    className="hidden"
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getFileIcon(selectedFile.type)}
                      <span>{selectedFile.name}</span>
                      <span>({formatFileSize(selectedFile.size)})</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ""
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), Images (JPG, PNG, GIF, WebP) - Max 10MB
                </p>
              </div>

              {/* Comments */}
              <div className="space-y-2">
                <Label htmlFor="comments">Additional Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Any additional notes or instructions"
                  rows={2}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isUploading}
                className="w-full bg-[#0D47A1] hover:bg-[#0D47A1]/90"
              >
                {isUploading ? "Creating Duty..." : "Create Duty"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Duties */}
        <Card className="border-none shadow-soft bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-xl">Recent Duties</CardTitle>
            <CardDescription>
              Latest assigned tasks and documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                ))
              ) : duties && duties.length > 0 ? (
                duties.slice(0, 5).map((duty) => (
                  <div key={duty.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{duty.title}</h4>
                        <p className="text-sm text-muted-foreground">{duty.description}</p>
                      </div>
                      {duty.documentUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(duty.documentUrl!, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {duty.staff_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(duty.created_at.toDate(), 'MMM dd, yyyy')}
                      </div>
                    </div>

                    {duty.documentFileName && (
                      <div className="flex items-center gap-2 text-xs">
                        {getFileIcon(duty.documentType)}
                        <span>{duty.documentFileName}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No duties assigned yet</p>
                  <p className="text-sm">Create your first duty using the form</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}