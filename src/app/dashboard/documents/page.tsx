
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Textarea } from "@/components/ui/textarea"

// Mock data for uploaded documents
const mockDocuments = [
  { id: "DOC-001", staffName: "Eleanor Vance", type: "Contract", fileName: "contract-ev.pdf", date: "2023-10-15" },
  { id: "DOC-002", staffName: "Marcus Holloway", type: "Payslip", fileName: "payslip-mh-oct.pdf", date: "2023-10-30" },
  { id: "DOC-003", staffName: "Arthur Morgan", type: "Warning Letter", fileName: "warning-am.pdf", date: "2023-11-02" },
]

// Placeholder templates
const placeholderTemplates = {
  contract: `CONTRACT OF EMPLOYMENT

BETWEEN:
[Company Name]

AND:
{{staffName}}

This contract is effective from {{date}}.
...`,
  payslip: `[Company Logo]

PAYSLIP

Staff Name: {{staffName}}
Month: {{month}}
Amount: \${{amount}}

This is a summary of your payment.
...`,
  warning: `WARNING LETTER

Date: {{date}}
To: {{staffName}}

This letter serves as a formal warning regarding...`
}

export default function DocumentsPage() {
  const { toast } = useToast()
  
  // State for file upload
  const [selectedStaffId, setSelectedStaffId] = useState<string>("")
  const [documentType, setDocumentType] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState(mockDocuments);

  // State for template generation
  const [templateStaffId, setTemplateStaffId] = useState<string>("")
  const [templateDocType, setTemplateDocType] = useState<string>("")
  const [payslipAmount, setPayslipAmount] = useState<string>("")
  const [generating, setGenerating] = useState(false)

  // State for template content
  const [contractTemplate, setContractTemplate] = useState(placeholderTemplates.contract)
  const [payslipTemplate, setPayslipTemplate] = useState(placeholderTemplates.payslip)
  const [warningTemplate, setWarningTemplate] = useState(placeholderTemplates.warning)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
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

    setSelectedStaffId("")
    setDocumentType("")
    setFile(null)
    form.reset()
  }

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateStaffId || !templateDocType) {
        toast({
            variant: "destructive",
            title: "Incomplete Form",
            description: "Please select a staff member and document type.",
        })
        return
    }
    if (templateDocType === "Payslip" && !payslipAmount) {
        toast({
            variant: "destructive",
            title: "Amount Required",
            description: "Please enter an amount for the payslip.",
        })
        return
    }
    
    setGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const staffMember = mockStaff.find(s => s.id === templateStaffId);
    if (staffMember) {
        const docName = `${templateDocType.toLowerCase().replace(' ', '-')}-${staffMember.name.toLowerCase().replace(' ', '-')}.pdf`;
        const newDocument = {
            id: `DOC-${Math.random().toString(36).slice(2, 7)}`,
            staffName: staffMember.name,
            type: templateDocType,
            fileName: docName,
            date: new Date().toISOString().split('T')[0],
        };
        setDocuments(prev => [newDocument, ...prev]);
        toast({
            title: "Document Generated & Sent!",
            description: `${templateDocType} for ${staffMember.name} has been sent.`,
        });
    }

    setGenerating(false)
    setTemplateStaffId("")
    setTemplateDocType("")
    setPayslipAmount("")
  }

  const handleSaveTemplate = (templateType: 'contract' | 'payslip' | 'warning') => {
    // In a real app, you'd save this to a database
    toast({
      title: "Template Saved!",
      description: `The ${templateType} template has been updated.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
          <p className="text-muted-foreground">
            Upload, manage, and create templates for staff documents.
          </p>
        </div>
      </div>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage">Manage Documents</TabsTrigger>
          <TabsTrigger value="templates">Document Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="manage" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Card>
                  <CardHeader>
                    <CardTitle>Create & Send Document</CardTitle>
                    <CardDescription>
                      Upload a file or use a template to send a document to staff.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="upload" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="upload">Upload File</TabsTrigger>
                            <TabsTrigger value="template">Use Template</TabsTrigger>
                        </TabsList>
                        <TabsContent value="upload" className="pt-6">
                            <form onSubmit={handleUploadSubmit} className="space-y-4">
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
                                <Button type="submit" disabled={uploading} className="w-full">
                                    {uploading ? "Uploading..." : "Upload & Send"}
                                </Button>
                            </form>
                        </TabsContent>
                        <TabsContent value="template" className="pt-6">
                            <form onSubmit={handleGenerateSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Staff Member</Label>
                                    <Select value={templateStaffId} onValueChange={setTemplateStaffId} required>
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
                                    <Select value={templateDocType} onValueChange={setTemplateDocType} required>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select a template" />
                                        </SelectTrigger>
                                        <SelectContent>
                                        <SelectItem value="Contract">Contract</SelectItem>
                                        <SelectItem value="Payslip">Payslip</SelectItem>
                                        <SelectItem value="Warning Letter">Warning Letter</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {templateDocType === 'Payslip' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="payslip-amount">Amount</Label>
                                        <Input
                                            id="payslip-amount"
                                            type="number"
                                            value={payslipAmount}
                                            onChange={(e) => setPayslipAmount(e.target.value)}
                                            placeholder="e.g., 2500"
                                            required
                                        />
                                    </div>
                                )}
                                <Button type="submit" disabled={generating} className="w-full">
                                    {generating ? "Generating..." : "Generate & Send"}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
              </Card>
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
        </TabsContent>
        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Templates</CardTitle>
              <CardDescription>
                Edit the templates for contracts, payslips, and warning letters. Use placeholders like `{'{{staffName}}'}` or `{'{{date}}'}`. For the payslip, you can upload a logo which will replace the `[Company Logo]` placeholder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="contract">
                  <AccordionTrigger className="text-lg font-medium">Contract Template</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <Textarea
                      value={contractTemplate}
                      onChange={(e) => setContractTemplate(e.target.value)}
                      rows={15}
                      placeholder="Enter contract template here..."
                    />
                    <Button onClick={() => handleSaveTemplate('contract')}>Save Contract Template</Button>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="payslip">
                  <AccordionTrigger className="text-lg font-medium">Payslip Template</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="logo-upload">Company Logo</Label>
                        <Input id="logo-upload" type="file" />
                        <p className="text-sm text-muted-foreground">This logo will replace the `[Company Logo]` placeholder in the template.</p>
                    </div>
                     <Textarea
                      value={payslipTemplate}
                      onChange={(e) => setPayslipTemplate(e.target.value)}
                      rows={15}
                      placeholder="Enter payslip template here..."
                    />
                    <Button onClick={() => handleSaveTemplate('payslip')}>Save Payslip Template</Button>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="warning-letter">
                  <AccordionTrigger className="text-lg font-medium">Warning Letter Template</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                     <Textarea
                      value={warningTemplate}
                      onChange={(e) => setWarningTemplate(e.target.value)}
                      rows={15}
                      placeholder="Enter warning letter template here..."
                    />
                    <Button onClick={() => handleSaveTemplate('warning')}>Save Warning Letter Template</Button>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

    