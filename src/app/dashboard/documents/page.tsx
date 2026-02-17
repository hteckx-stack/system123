"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { mockStaff } from "@/lib/placeholder-data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"

// Mock data for uploaded documents
const mockDocuments = [
  { id: "DOC-001", staffName: "Eleanor Vance", type: "Contract", fileName: "contract-ev.pdf", date: "2023-10-15" },
  { id: "DOC-002", staffName: "Marcus Holloway", type: "Payslip", fileName: "payslip-mh-oct.pdf", date: "2023-10-30" },
  { id: "DOC-003", staffName: "Arthur Morgan", type: "Warning Letter", fileName: "warning-am.pdf", date: "2023-11-02" },
]

export default function DocumentsPage() {
  const { toast } = useToast()
  const [selectedStaffId, setSelectedStaffId] = useState<string>("")
  const [documentType, setDocumentType] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState(mockDocuments);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement

    if (!selectedStaffId || !documentType || !file) {
      toast({
        variant: "destructive",
        title: "Incomplete Form",
        description: "Please select a staff member, document type, and a file to upload.",
      })
      return
    }

    setUploading(true)

    // In a real app, you'd handle Firebase Storage upload here
    console.log("Uploading document:", {
      staffId: selectedStaffId,
      type: documentType,
      fileName: file.name,
    })

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    const staffMember = mockStaff.find(s => s.id === selectedStaffId);

    if (staffMember) {
      const newDocument = {
        id: `DOC-${Math.random().toString(36).slice(2, 7)}`,
        staffName: staffMember.name,
        type: documentType,
        fileName: file.name,
        date: new Date().toISOString().split('T')[0],
      };
      setDocuments(prev => [newDocument, ...prev]);
    }

    setUploading(false)
    
    toast({
      title: "Document Uploaded!",
      description: `${file.name} has been uploaded for ${staffMember?.name}.`,
    })

    // Reset form
    setSelectedStaffId("")
    setDocumentType("")
    setFile(null)
    form.reset()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
          <p className="text-muted-foreground">
            Upload and manage documents for staff members.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Upload New Document</CardTitle>
                <CardDescription>
                  Select a staff member, document type, and file to upload.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Staff Member</Label>
                   <Select value={selectedStaffId} onValueChange={setSelectedStaffId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockStaff.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select value={documentType} onValueChange={setDocumentType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Payslip">Payslip</SelectItem>
                      <SelectItem value="Warning Letter">Warning Letter</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document-file">File</Label>
                  <Input id="document-file" type="file" onChange={handleFileChange} required />
                </div>
              </CardContent>
              <CardFooter>
                 <Button type="submit" disabled={uploading} className="w-full">
                  {uploading ? "Uploading..." : "Upload & Send"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>
                View and manage recently uploaded documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length > 0 ? (
                    documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.staffName}</TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell>{doc.fileName}</TableCell>
                        <TableCell>{doc.date}</TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No documents found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
