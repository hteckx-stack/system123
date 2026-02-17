"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { mockStaff } from "@/lib/placeholder-data"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function AnnouncementsPage() {
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])

  const handleSelectStaff = (staffId: string) => {
    setSelectedStaff((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    )
  }

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked) {
      setSelectedStaff(mockStaff.map((staff) => staff.id))
    } else {
      setSelectedStaff([])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !message || selectedStaff.length === 0) {
      toast({
        variant: "destructive",
        title: "Incomplete Form",
        description: "Please fill out the title, message, and select at least one staff member.",
      })
      return
    }

    console.log("Sending announcement:", { title, message, selectedStaff })
    
    toast({
      title: "Announcement Sent!",
      description: `Your message "${title}" has been sent to ${selectedStaff.length} staff member(s).`,
    })

    // Reset form
    setTitle("")
    setMessage("")
    setSelectedStaff([])
  }
  
  const areAllSelected = selectedStaff.length > 0 && selectedStaff.length === mockStaff.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Create and send announcements to staff members.
          </p>
        </div>
        <Button type="submit">Send Announcement</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
              <CardHeader>
                  <CardTitle>Compose Message</CardTitle>
                  <CardDescription>
                      Write your announcement below. It will be sent to the selected staff members.
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input 
                          id="title" 
                          placeholder="e.g. Upcoming Team Meeting" 
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                          id="message"
                          placeholder="Type your message here."
                          className="min-h-[200px]"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          required
                      />
                  </div>
              </CardContent>
          </Card>

          <Card className="lg:col-span-2">
              <CardHeader>
                  <CardTitle>Select Recipients</CardTitle>
                  <CardDescription>
                     Choose which staff should receive this.
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                   <div className="flex items-center space-x-2 border-b pb-4">
                      <Checkbox 
                          id="select-all" 
                          checked={areAllSelected}
                          onCheckedChange={handleSelectAll}
                      />
                      <Label htmlFor="select-all" className="font-medium cursor-pointer">
                          Select All Staff
                      </Label>
                  </div>
                  <ScrollArea className="h-72">
                    <div className="space-y-3 pr-4">
                        {mockStaff.map((staff) => (
                            <div key={staff.id} className="flex items-center space-x-3 rounded-md p-2 hover:bg-muted/50">
                                <Checkbox
                                id={staff.id}
                                checked={selectedStaff.includes(staff.id)}
                                onCheckedChange={() => handleSelectStaff(staff.id)}
                                />
                                <Label htmlFor={staff.id} className="w-full cursor-pointer flex items-center gap-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{staff.name}</span>
                                    <span className="text-xs text-muted-foreground">{staff.position}</span>
                                  </div>
                                </Label>
                            </div>
                        ))}
                    </div>
                  </ScrollArea>
              </CardContent>
              <CardFooter>
                  <p className="text-sm text-muted-foreground">
                      {selectedStaff.length} of {mockStaff.length} staff selected.
                  </p>
              </CardFooter>
          </Card>
      </div>
    </form>
  )
}
